import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ScopeService } from '../rbac/scope.service';
import type { RequestUser, ScopeDescriptor } from '../common/types';

export const TIMESHEET_SCOPE: ScopeDescriptor = {
  companyPath: 'employee.companyId',
  departmentPath: 'employee.departmentId',
  ownerPath: 'employeeId',
  teamPath: 'employeeId',
};

export const TIMESHEET_CATEGORIES = [
  'MISSION_BILLABLE',
  'MISSION_NON_BILLABLE',
  'SITE_WAITING',
  'WEATHER',
  'TRAINING',
  'LEAVE',
  'SICK',
  'UNASSIGNED',
  'OTHER',
] as const;
export type TimesheetCategory = (typeof TIMESHEET_CATEGORIES)[number];

/** Catégories qui exigent une mission — et les seules à en accepter une. */
const MISSION_CATEGORIES = new Set<TimesheetCategory>([
  'MISSION_BILLABLE',
  'MISSION_NON_BILLABLE',
  'SITE_WAITING',
]);

export interface DayInput {
  date: string;
  category: TimesheetCategory;
  missionId?: string | null;
  comment?: string | null;
}

export interface SaveWarning {
  date: string;
  message: string;
}

@Injectable()
export class TimesheetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly scope: ScopeService,
  ) {}

  /* ── Génération ───────────────────────────────────────────────── */

  /**
   * Déduit le pointage du planning, pour un mois.
   *
   * Le principe : une journée affectée à une mission EST pointée sur cette
   * mission — il n'y a rien à déclarer. Ce qui reste, une fois retirés les
   * jours vendus, les absences accordées et les jours non ouvrés, est une
   * journée non affectée. C'est cette soustraction qui rend le coût
   * d'inactivité fiable : il n'attend la bonne volonté de personne.
   *
   * L'opération est rejouable : elle ne touche ni les journées corrigées à la
   * main, ni celles déjà visées.
   */
  async generate(
    user: RequestUser,
    month: string,
    employeeId: string | undefined,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const companyId = user.companyIds[0];
    if (!companyId) throw new BadRequestException('Votre compte n’est rattaché à aucune société.');

    const { from, to } = monthRange(month);

    // On ne pointe pas l'avenir : une journée à venir n'est ni travaillée,
    // ni perdue. Le mois en cours se remplit au fil des jours.
    const today = startOfToday();
    const until = to < today ? to : today;
    if (until < from) {
      return { month, generated: 0, skipped: 0, byCategory: {} as Record<string, number> };
    }

    const employees = await this.prisma.employee.findMany({
      where: {
        companyId,
        deletedAt: null,
        status: 'ACTIVE',
        ...(employeeId ? { id: employeeId } : {}),
        ...this.generationFilter(user),
      },
      select: { id: true, matricule: true, departmentId: true },
    });
    if (employees.length === 0) return { month, generated: 0, skipped: 0, byCategory: {} };

    const ids = employees.map((e) => e.id);

    const [calendar, existing, assignments, leaves, trainings, costs] = await Promise.all([
      this.prisma.workCalendarDay.findMany({
        where: { companyId, date: { gte: from, lte: until } },
      }),
      this.prisma.timesheetDay.findMany({
        where: { employeeId: { in: ids }, date: { gte: from, lte: until } },
        select: { employeeId: true, date: true, source: true, status: true },
      }),
      this.prisma.missionAssignment.findMany({
        where: {
          employeeId: { in: ids },
          mission: {
            deletedAt: null,
            status: { notIn: ['CANCELLED', 'POSTPONED'] },
            plannedStartDate: { lte: until },
            plannedEndDate: { gte: from },
          },
        },
        select: {
          employeeId: true,
          mission: {
            select: {
              id: true,
              affairId: true,
              billable: true,
              plannedStartDate: true,
              plannedEndDate: true,
            },
          },
        },
      }),
      this.prisma.leaveRequest.findMany({
        where: {
          employeeId: { in: ids },
          status: 'APPROVED',
          startDate: { lte: until },
          endDate: { gte: from },
        },
        select: { employeeId: true, type: true, startDate: true, endDate: true },
      }),
      this.prisma.training.findMany({
        where: {
          employeeId: { in: ids },
          status: { in: ['PLANNED', 'DONE', 'COMPLETED'] },
          startDate: { lte: until },
          endDate: { gte: from },
        },
        select: { employeeId: true, startDate: true, endDate: true },
      }),
      this.prisma.employeeDailyCost.findMany({
        where: { employeeId: { in: ids } },
        select: { employeeId: true, amount: true, validFrom: true, validTo: true },
        orderBy: { validFrom: 'asc' },
      }),
    ]);

    const workingDay = new Map(calendar.map((c) => [iso(c.date), c.isWorkingDay]));
    const holidayLabel = new Map(calendar.map((c) => [iso(c.date), c.label]));

    // Une journée déjà corrigée ou visée est intouchable.
    const frozen = new Set(
      existing
        .filter((e) => e.source === 'MANUAL' || ['VALIDATED', 'LOCKED'].includes(e.status))
        .map((e) => `${e.employeeId}|${iso(e.date)}`),
    );

    const byCategory: Record<string, number> = {};
    let generated = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const employee of employees) {
        for (let day = new Date(from); day <= until; day = addDays(day, 1)) {
          const key = iso(day);
          if (frozen.has(`${employee.id}|${key}`)) continue;

          const assignment = assignments.find(
            (a) =>
              a.employeeId === employee.id &&
              a.mission.plannedStartDate !== null &&
              a.mission.plannedEndDate !== null &&
              iso(a.mission.plannedStartDate) <= key &&
              iso(a.mission.plannedEndDate) >= key,
          );

          const isWorkingDay = workingDay.get(key) ?? ![0, 6].includes(day.getUTCDay());

          // Un jour chômé ne compte pas — sauf si une mission l'a occupé.
          if (!isWorkingDay && !assignment) {
            await tx.timesheetDay.deleteMany({
              where: { employeeId: employee.id, date: day, source: 'PLAN' },
            });
            continue;
          }

          const resolved = this.resolve(employee.id, key, assignment, leaves, trainings);
          const cost = costFor(costs, employee.id, day);

          const data = {
            category: resolved.category,
            missionId: resolved.missionId,
            affairId: resolved.affairId,
            billable: resolved.category === 'MISSION_BILLABLE',
            dailyCostSnapshot: cost,
            source: 'PLAN' as const,
            status: 'DRAFT' as const,
            comment: !isWorkingDay ? (holidayLabel.get(key) ?? 'Jour non ouvré travaillé') : null,
          };

          await tx.timesheetDay.upsert({
            where: { employeeId_date: { employeeId: employee.id, date: day } },
            update: data,
            create: { employeeId: employee.id, date: day, ...data },
          });

          byCategory[resolved.category] = (byCategory[resolved.category] ?? 0) + 1;
          generated += 1;
        }
      }
    });

    await this.audit.record(
      {
        entity: 'timesheet',
        entityId: employeeId ?? null,
        action: 'GENERATE',
        after: { month, employees: employees.length, generated, byCategory },
        companyId,
      },
      { user, ...ctx },
    );

    return { month, generated, skipped: frozen.size, byCategory };
  }

  /**
   * Ce qu'une journée devient, dans l'ordre de priorité du métier.
   *
   * L'affectation prime : une personne envoyée en mission un jour où elle
   * était aussi inscrite en formation a bien travaillé ce jour-là.
   */
  private resolve(
    employeeId: string,
    date: string,
    assignment:
      | { mission: { id: string; affairId: string; billable: boolean } }
      | undefined,
    leaves: Array<{ employeeId: string; type: string; startDate: Date; endDate: Date }>,
    trainings: Array<{ employeeId: string; startDate: Date | null; endDate: Date | null }>,
  ): { category: TimesheetCategory; missionId: string | null; affairId: string | null } {
    if (assignment) {
      return {
        category: assignment.mission.billable ? 'MISSION_BILLABLE' : 'MISSION_NON_BILLABLE',
        missionId: assignment.mission.id,
        affairId: assignment.mission.affairId,
      };
    }

    const leave = leaves.find(
      (l) => l.employeeId === employeeId && iso(l.startDate) <= date && iso(l.endDate) >= date,
    );
    if (leave) {
      return {
        category: leave.type === 'SICK' ? 'SICK' : 'LEAVE',
        missionId: null,
        affairId: null,
      };
    }

    const training = trainings.find(
      (t) =>
        t.employeeId === employeeId &&
        t.startDate !== null &&
        t.endDate !== null &&
        iso(t.startDate) <= date &&
        iso(t.endDate) >= date,
    );
    if (training) return { category: 'TRAINING', missionId: null, affairId: null };

    // Ce qui reste : une journée ouvrée que rien n'a occupée.
    return { category: 'UNASSIGNED', missionId: null, affairId: null };
  }

  /* ── Semaine ──────────────────────────────────────────────────── */

  /** La semaine telle que le planning la décrit, corrections comprises. */
  async week(user: RequestUser, employeeId: string, anyDayOfWeek: Date) {
    const employee = await this.readableEmployee(user, employeeId);
    const from = monday(anyDayOfWeek);
    const to = addDays(from, 6);

    const [calendar, entries, assignments, cost] = await Promise.all([
      this.prisma.workCalendarDay.findMany({
        where: { companyId: employee.companyId, date: { gte: from, lte: to } },
        orderBy: { date: 'asc' },
      }),
      this.prisma.timesheetDay.findMany({
        where: { employeeId, date: { gte: from, lte: to } },
        include: {
          mission: { select: { id: true, number: true } },
          affair: { select: { number: true } },
          validatedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.missionAssignment.findMany({
        where: {
          employeeId,
          mission: {
            deletedAt: null,
            status: { notIn: ['CANCELLED', 'POSTPONED'] },
            plannedStartDate: { lte: to },
            plannedEndDate: { gte: from },
          },
        },
        include: {
          mission: {
            select: {
              id: true,
              number: true,
              objective: true,
              billable: true,
              plannedStartDate: true,
              plannedEndDate: true,
              affair: { select: { number: true, client: { select: { name: true } } } },
            },
          },
        },
      }),
      this.dailyCost(employeeId, from),
    ]);

    const byDate = new Map(entries.map((e) => [iso(e.date), e]));
    const calendarByDate = new Map(calendar.map((c) => [iso(c.date), c]));

    const days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(from, i);
      const key = iso(date);
      const entry = byDate.get(key);
      const day = calendarByDate.get(key);

      const missions = assignments
        .filter(
          (a) =>
            a.mission.plannedStartDate !== null &&
            a.mission.plannedEndDate !== null &&
            iso(a.mission.plannedStartDate) <= key &&
            iso(a.mission.plannedEndDate) >= key,
        )
        .map((a) => ({
          missionId: a.mission.id,
          number: a.mission.number,
          objective: a.mission.objective,
          billable: a.mission.billable,
          affair: a.mission.affair.number,
          client: a.mission.affair.client.name,
        }));

      return {
        date: key,
        weekday: date.getUTCDay(),
        isWorkingDay: day?.isWorkingDay ?? ![0, 6].includes(date.getUTCDay()),
        holidayLabel: day && !day.isWorkingDay ? day.label : null,
        entry: entry
          ? {
              category: entry.category,
              missionId: entry.missionId,
              missionNumber: entry.mission?.number ?? null,
              affairNumber: entry.affair?.number ?? null,
              comment: entry.comment,
              status: entry.status,
              /** D'où vient cette journée : du planning, ou d'une correction. */
              source: entry.source,
              validatedBy: entry.validatedBy
                ? `${entry.validatedBy.lastName.toUpperCase()} ${entry.validatedBy.firstName}`
                : null,
              locked: entry.status === 'VALIDATED' || entry.status === 'LOCKED',
            }
          : null,
        /** Missions couvrant ce jour — pour corriger vers la bonne. */
        missions,
      };
    });

    return {
      employee: {
        id: employee.id,
        matricule: employee.matricule,
        name: `${employee.lastName.toUpperCase()} ${employee.firstName}`,
        department: employee.department?.code ?? null,
      },
      week: { from: iso(from), to: iso(to) },
      dailyCost: cost,
      days,
      editable: this.canWrite(user, employee.id),
      canValidate: this.canApprove(user) && employee.id !== user.employeeId,
    };
  }

  /* ── Correction ───────────────────────────────────────────────── */

  /**
   * Corrige des journées que le planning a mal décrites : une intervention
   * empêchée par les intempéries, une attente sur site, une mission annulée
   * sur le terrain. Ces journées sont marquées comme corrigées : une
   * régénération ne les écrase pas.
   */
  async correct(
    user: RequestUser,
    employeeId: string,
    days: DayInput[],
    ctx: { ip?: string | null; userAgent?: string | null },
  ): Promise<{ corrected: number; warnings: SaveWarning[] }> {
    const employee = await this.readableEmployee(user, employeeId);

    if (!this.canWrite(user, employeeId)) {
      throw new ForbiddenException('Vous ne pouvez corriger que vos propres journées.');
    }
    if (days.length === 0) throw new BadRequestException('Aucune journée à corriger.');

    const dates = days.map((d) => new Date(`${d.date}T00:00:00.000Z`));

    const [calendar, existing, missions] = await Promise.all([
      this.prisma.workCalendarDay.findMany({
        where: { companyId: employee.companyId, date: { in: dates } },
      }),
      this.prisma.timesheetDay.findMany({
        where: { employeeId, date: { in: dates } },
        select: { date: true, status: true },
      }),
      this.prisma.mission.findMany({
        where: {
          id: { in: days.map((d) => d.missionId).filter((id): id is string => Boolean(id)) },
          deletedAt: null,
        },
        select: {
          id: true,
          number: true,
          affairId: true,
          billable: true,
          assignments: { where: { employeeId }, select: { id: true } },
        },
      }),
    ]);

    const calendarByDate = new Map(calendar.map((c) => [iso(c.date), c]));
    const locked = new Set(
      existing.filter((e) => ['VALIDATED', 'LOCKED'].includes(e.status)).map((e) => iso(e.date)),
    );
    const missionById = new Map(missions.map((m) => [m.id, m]));

    const warnings: SaveWarning[] = [];
    const errors: Array<{ field: string; message: string }> = [];

    for (const day of days) {
      if (locked.has(day.date)) {
        errors.push({ field: day.date, message: 'Journée déjà visée : elle ne se reprend plus.' });
        continue;
      }

      const needsMission = MISSION_CATEGORIES.has(day.category);
      if (needsMission && !day.missionId) {
        errors.push({ field: day.date, message: 'Cette catégorie demande une mission.' });
        continue;
      }
      if (!needsMission && day.missionId) {
        errors.push({
          field: day.date,
          message: 'Cette catégorie ne se rattache pas à une mission.',
        });
        continue;
      }

      const calendarDay = calendarByDate.get(day.date);
      const isWorkingDay = calendarDay?.isWorkingDay ?? ![0, 6].includes(weekdayOf(day.date));
      if (!isWorkingDay && !needsMission) {
        errors.push({
          field: day.date,
          message: calendarDay?.label
            ? `${calendarDay.label} : seule une intervention se pointe ce jour-là.`
            : 'Jour non ouvré : seule une intervention se pointe ce jour-là.',
        });
        continue;
      }

      if (day.missionId) {
        const mission = missionById.get(day.missionId);
        if (!mission) {
          errors.push({ field: day.date, message: 'Mission introuvable.' });
          continue;
        }
        if (mission.assignments.length === 0) {
          warnings.push({
            date: day.date,
            message: `Vous n’êtes pas affecté à la mission ${mission.number} : l’affectation reste à régulariser au planning.`,
          });
        }
        if (day.category === 'MISSION_BILLABLE' && !mission.billable) {
          warnings.push({
            date: day.date,
            message: `La mission ${mission.number} est déclarée non facturable : la journée est comptée comme telle.`,
          });
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({ message: 'Correction refusée.', errors });
    }

    await this.prisma.$transaction(async (tx) => {
      for (const day of days) {
        const date = new Date(`${day.date}T00:00:00.000Z`);
        const mission = day.missionId ? missionById.get(day.missionId) : null;

        const data = {
          category: day.category,
          missionId: mission?.id ?? null,
          affairId: mission?.affairId ?? null,
          comment: day.comment?.trim() || null,
          billable: day.category === 'MISSION_BILLABLE' && (mission?.billable ?? false),
          dailyCostSnapshot: await this.dailyCost(employeeId, date),
          source: 'MANUAL' as const,
          status: 'DRAFT' as const,
        };

        await tx.timesheetDay.upsert({
          where: { employeeId_date: { employeeId, date } },
          update: data,
          create: { employeeId, date, ...data },
        });
      }
    });

    await this.audit.record(
      {
        entity: 'timesheet',
        entityId: employeeId,
        action: 'CORRECT',
        after: { days: days.map((d) => `${d.date}:${d.category}`), warnings: warnings.length },
        companyId: employee.companyId,
      },
      { user, ...ctx },
    );

    return { corrected: days.length, warnings };
  }

  /* ── Visa mensuel ─────────────────────────────────────────────── */

  /**
   * Vise le mois d'un intervenant.
   *
   * Personne ne vise son propre pointage : c'est ce visa qui rend le temps
   * passé opposable au client comme au contrôle de gestion.
   */
  async validateMonth(
    user: RequestUser,
    employeeId: string,
    month: string,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const employee = await this.readableEmployee(user, employeeId);

    if (!this.canApprove(user)) {
      throw new ForbiddenException('Droit manquant : APPROVE sur timesheet.');
    }
    if (employeeId === user.employeeId) {
      throw new BadRequestException(
        'Un pointage ne se vise pas soi-même. Faites-le viser par les ressources humaines.',
      );
    }

    const { from, to } = monthRange(month);

    const { count } = await this.prisma.timesheetDay.updateMany({
      where: { employeeId, date: { gte: from, lte: to }, status: 'DRAFT' },
      data: { status: 'VALIDATED', validatedById: user.employeeId, validatedAt: new Date() },
    });

    if (count === 0) {
      throw new BadRequestException('Aucune journée à viser sur ce mois.');
    }

    await this.audit.record(
      {
        entity: 'timesheet',
        entityId: employeeId,
        action: 'VALIDATE_MONTH',
        after: { month, days: count, validatedBy: user.employeeId },
        companyId: employee.companyId,
      },
      { user, ...ctx },
    );

    return { validated: count };
  }

  /* ── File d'attente du viseur ─────────────────────────────────── */

  /** Mois non visés, dans le périmètre de l'utilisateur. */
  async pending(user: RequestUser, month: string) {
    const { from, to } = monthRange(month);

    const rows = await this.prisma.timesheetDay.findMany({
      where: {
        status: 'DRAFT',
        date: { gte: from, lte: to },
        ...this.scope.buildWhere(user, 'timesheet', 'VIEW', TIMESHEET_SCOPE),
      },
      select: {
        employeeId: true,
        category: true,
        source: true,
        employee: {
          select: {
            matricule: true,
            firstName: true,
            lastName: true,
            department: { select: { code: true } },
          },
        },
      },
    });

    const byEmployee = new Map<
      string,
      {
        employeeId: string;
        matricule: string;
        name: string;
        department: string | null;
        days: number;
        unassigned: number;
        corrected: number;
      }
    >();

    for (const row of rows) {
      const entry = byEmployee.get(row.employeeId) ?? {
        employeeId: row.employeeId,
        matricule: row.employee.matricule,
        name: `${row.employee.lastName.toUpperCase()} ${row.employee.firstName}`,
        department: row.employee.department?.code ?? null,
        days: 0,
        unassigned: 0,
        corrected: 0,
      };

      entry.days += 1;
      if (row.category === 'UNASSIGNED') entry.unassigned += 1;
      if (row.source === 'MANUAL') entry.corrected += 1;
      byEmployee.set(row.employeeId, entry);
    }

    return [...byEmployee.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }

  /* ── Utilitaires ──────────────────────────────────────────────── */

  /** Coût journalier en vigueur à une date — jamais recalculé après coup. */
  private async dailyCost(employeeId: string, at: Date): Promise<number | null> {
    const row = await this.prisma.employeeDailyCost.findFirst({
      where: {
        employeeId,
        validFrom: { lte: at },
        OR: [{ validTo: null }, { validTo: { gte: at } }],
      },
      orderBy: { validFrom: 'desc' },
      select: { amount: true },
    });

    return row ? Number(row.amount) : null;
  }

/**
   * Employés que la déduction peut toucher.
   *
   * Le périmètre du viseur fait foi : un chef de département ne déduit que
   * pour son pôle. Un périmètre plus étroit que « département » ne permet pas
   * d'administrer le pointage d'autrui — la déduction est alors refusée
   * plutôt que réduite en silence.
   */
  private generationFilter(user: RequestUser): Record<string, unknown> {
    const level = this.scope.requireScope(user, 'timesheet', 'APPROVE');

    if (level === 'ALL' || level === 'COMPANY') return {};
    if (level === 'DEPARTMENT') {
      if (user.departmentIds.length === 0) {
        throw new ForbiddenException(
          'Aucun département rattaché à votre habilitation : déduction impossible.',
        );
      }
      return { departmentId: { in: user.departmentIds } };
    }

    throw new ForbiddenException(
      'La déduction du pointage relève du chef de département ou des ressources humaines.',
    );
  }

  private async readableEmployee(user: RequestUser, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, deletedAt: null, companyId: { in: user.companyIds } },
      select: {
        id: true,
        companyId: true,
        matricule: true,
        firstName: true,
        lastName: true,
        departmentId: true,
        department: { select: { code: true } },
      },
    });

    if (!employee) throw new BadRequestException('Employé introuvable.');

    const level = this.scope.requireScope(user, 'timesheet', 'VIEW');
    const allowed =
      level === 'ALL' ||
      level === 'COMPANY' ||
      (level === 'DEPARTMENT' &&
        employee.departmentId !== null &&
        user.departmentIds.includes(employee.departmentId)) ||
      (level === 'TEAM' &&
        (employee.id === user.employeeId || user.teamEmployeeIds.includes(employee.id))) ||
      (level === 'OWN' && employee.id === user.employeeId);

    if (!allowed) throw new ForbiddenException('Ce pointage est hors de votre périmètre.');

    return employee;
  }

  private canWrite(user: RequestUser, employeeId: string): boolean {
    const own = employeeId === user.employeeId;
    return user.permissions.some(
      (p) => p.resource === 'timesheet' && p.action === 'UPDATE' && (p.scope !== 'OWN' || own),
    );
  }

  private canApprove(user: RequestUser): boolean {
    return user.permissions.some((p) => p.resource === 'timesheet' && p.action === 'APPROVE');
  }
}

/* ── Dates ────────────────────────────────────────────────────────── */

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/** Lundi de la semaine qui contient cette date. */
function monday(date: Date): Date {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = (utc.getUTCDay() + 6) % 7;
  return new Date(utc.getTime() - weekday * 86_400_000);
}

function monthRange(month: string): { from: Date; to: Date } {
  const [year, index] = month.split('-').map(Number);
  if (!year || !index || index < 1 || index > 12) {
    throw new BadRequestException('Mois attendu au format AAAA-MM.');
  }
  return { from: new Date(Date.UTC(year, index - 1, 1)), to: new Date(Date.UTC(year, index, 0)) };
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function weekdayOf(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00.000Z`).getUTCDay();
}

/** Coût journalier en vigueur à une date, dans une grille déjà chargée. */
function costFor(
  costs: Array<{ employeeId: string; amount: unknown; validFrom: Date; validTo: Date | null }>,
  employeeId: string,
  at: Date,
): number | null {
  const match = costs
    .filter(
      (c) =>
        c.employeeId === employeeId &&
        c.validFrom <= at &&
        (c.validTo === null || c.validTo >= at),
    )
    .sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime())[0];

  return match ? Number(match.amount) : null;
}
