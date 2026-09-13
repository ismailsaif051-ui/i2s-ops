import { Injectable } from '@nestjs/common';
import { CATEGORY_LABELS, type TimesheetCategory } from '@i2s/calc';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeService } from '../rbac/scope.service';
import type { RequestUser } from '../common/types';

const TIMESHEET_SCOPE = {
  companyPath: 'employee.companyId',
  departmentPath: 'employee.departmentId',
  ownerPath: 'employeeId',
  teamPath: 'employeeId',
} as const;

export type ConflictKind =
  | 'DOUBLE_BOOKING'
  | 'LEAVE_OVERLAP'
  | 'EXPIRED_CERTIFICATION';

export interface PlanningCell {
  date: string;
  isWorkingDay: boolean;
  holidayLabel: string | null;
  category: TimesheetCategory | null;
  missionId: string | null;
  missionNumber: string | null;
  affairNumber: string | null;
  clientName: string | null;
  siteName: string | null;
  billable: boolean;
  conflicts: ConflictKind[];
}

@Injectable()
export class PlanningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
  ) {}

  /**
   * Grille de planning : une ligne par inspecteur, une colonne par jour.
   *
   * Les conflits sont calculés côté serveur — c'est une règle métier, pas un
   * effet d'affichage : deux missions le même jour, une mission posée sur un
   * congé, ou une certification expirée à la date de l'intervention
   * (docs/05-WORKFLOWS.md, W2).
   */
  async grid(
    user: RequestUser,
    input: { from: Date; to: Date; departmentId?: string },
  ) {
    const scopeWhere = this.scope.buildWhere(user, 'planning', 'VIEW', TIMESHEET_SCOPE);

    const [calendar, employees] = await Promise.all([
      this.prisma.workCalendarDay.findMany({
        where: {
          companyId: { in: user.companyIds },
          date: { gte: input.from, lte: input.to },
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.employee.findMany({
        where: {
          deletedAt: null,
          isInspector: true,
          status: { not: 'LEFT' },
          companyId: { in: user.companyIds },
          ...(input.departmentId ? { departmentId: input.departmentId } : {}),
        },
        orderBy: [{ department: { code: 'asc' } }, { lastName: 'asc' }],
        select: {
          id: true,
          matricule: true,
          firstName: true,
          lastName: true,
          position: true,
          department: { select: { id: true, code: true, name: true } },
        },
      }),
    ]);

    const employeeIds = employees.map((e) => e.id);

    const [days, assignments, certifications] = await Promise.all([
      this.prisma.timesheetDay.findMany({
        where: {
          employeeId: { in: employeeIds },
          date: { gte: input.from, lte: input.to },
          ...scopeWhere,
        },
        select: {
          employeeId: true,
          date: true,
          category: true,
          billable: true,
          mission: {
            select: {
              id: true,
              number: true,
              affair: { select: { number: true, client: { select: { name: true } } } },
              site: { select: { name: true } },
            },
          },
        },
      }),

      // Affectations chevauchant la période — base de la détection de conflit.
      this.prisma.missionAssignment.findMany({
        where: {
          employeeId: { in: employeeIds },
          mission: {
            deletedAt: null,
            status: { notIn: ['CANCELLED', 'POSTPONED'] },
            plannedStartDate: { lte: input.to },
            plannedEndDate: { gte: input.from },
          },
        },
        select: {
          employeeId: true,
          mission: {
            select: { id: true, number: true, plannedStartDate: true, plannedEndDate: true },
          },
        },
      }),

      this.prisma.certification.findMany({
        where: { employeeId: { in: employeeIds }, expiresAt: { not: null } },
        select: { employeeId: true, method: true, expiresAt: true },
      }),
    ]);

    /* ── Conflits ─────────────────────────────────────────────── */

    // employé → jour ISO → missions couvrant ce jour
    const booked = new Map<string, Map<string, Set<string>>>();
    for (const a of assignments) {
      const { plannedStartDate, plannedEndDate } = a.mission;
      if (!plannedStartDate || !plannedEndDate) continue;
      for (
        let d = new Date(Math.max(plannedStartDate.getTime(), input.from.getTime()));
        d <= plannedEndDate && d <= input.to;
        d = new Date(d.getTime() + 86_400_000)
      ) {
        const iso = toIso(d);
        const byDay = booked.get(a.employeeId) ?? new Map<string, Set<string>>();
        const set = byDay.get(iso) ?? new Set<string>();
        set.add(a.mission.id);
        byDay.set(iso, set);
        booked.set(a.employeeId, byDay);
      }
    }

    // Dernière expiration de certification par employé — au-delà, il n'est
    // plus affectable sur la méthode concernée.
    const lastCertByEmployee = new Map<string, Date>();
    for (const c of certifications) {
      if (!c.expiresAt) continue;
      const current = lastCertByEmployee.get(c.employeeId);
      if (!current || c.expiresAt > current) lastCertByEmployee.set(c.employeeId, c.expiresAt);
    }

    /* ── Assemblage de la grille ──────────────────────────────── */

    const dayByEmployee = new Map<string, Map<string, (typeof days)[number]>>();
    for (const d of days) {
      const map = dayByEmployee.get(d.employeeId) ?? new Map();
      map.set(toIso(d.date), d);
      dayByEmployee.set(d.employeeId, map);
    }

    const columns = calendar.map((c) => ({
      date: toIso(c.date),
      isWorkingDay: c.isWorkingDay,
      label: c.label,
    }));

    const rows = employees.map((employee) => {
      const punches = dayByEmployee.get(employee.id) ?? new Map();
      const bookings = booked.get(employee.id) ?? new Map<string, Set<string>>();
      const certExpiry = lastCertByEmployee.get(employee.id) ?? null;

      let workedDays = 0;
      let unassignedDays = 0;
      let conflictCount = 0;

      const cells: PlanningCell[] = columns.map((column) => {
        const punch = punches.get(column.date);
        const missionsThatDay = bookings.get(column.date);
        const conflicts: ConflictKind[] = [];

        if (missionsThatDay && missionsThatDay.size > 1) conflicts.push('DOUBLE_BOOKING');

        const onLeave =
          punch?.category === 'LEAVE' || punch?.category === 'SICK' || punch?.category === 'TRAINING';
        if (onLeave && missionsThatDay && missionsThatDay.size > 0) {
          conflicts.push('LEAVE_OVERLAP');
        }

        if (
          missionsThatDay &&
          missionsThatDay.size > 0 &&
          certExpiry &&
          certExpiry < new Date(column.date)
        ) {
          conflicts.push('EXPIRED_CERTIFICATION');
        }

        if (conflicts.length > 0) conflictCount += 1;
        if (punch?.category === 'MISSION_BILLABLE' || punch?.category === 'MISSION_NON_BILLABLE') {
          workedDays += 1;
        }
        if (punch?.category === 'UNASSIGNED') unassignedDays += 1;

        return {
          date: column.date,
          isWorkingDay: column.isWorkingDay,
          holidayLabel: column.isWorkingDay ? null : column.label,
          category: (punch?.category as TimesheetCategory) ?? null,
          missionId: punch?.mission?.id ?? null,
          missionNumber: punch?.mission?.number ?? null,
          affairNumber: punch?.mission?.affair.number ?? null,
          clientName: punch?.mission?.affair.client.name ?? null,
          siteName: punch?.mission?.site?.name ?? null,
          billable: punch?.billable ?? false,
          conflicts,
        };
      });

      const workingDays = columns.filter((c) => c.isWorkingDay).length;

      return {
        employeeId: employee.id,
        matricule: employee.matricule,
        name: `${employee.lastName.toUpperCase()} ${employee.firstName}`,
        position: employee.position,
        department: employee.department,
        cells,
        workedDays,
        unassignedDays,
        conflictCount,
        loadRate: workingDays > 0 ? Math.round((workedDays / workingDays) * 100) : 0,
      };
    });

    return {
      period: { from: toIso(input.from), to: toIso(input.to) },
      columns,
      rows,
      categoryLabels: CATEGORY_LABELS,
      totals: {
        inspectors: rows.length,
        conflicts: rows.reduce((s, r) => s + r.conflictCount, 0),
        unassignedDays: rows.reduce((s, r) => s + r.unassignedDays, 0),
        available: rows.filter((r) => r.loadRate === 0).length,
      },
    };
  }

  /**
   * Grille de pointage mensuelle : une ligne par employé, une colonne par jour,
   * avec la répartition par catégorie sur la période.
   */
  async timesheetGrid(user: RequestUser, month: string) {
    const [yearRaw, monthRaw] = month.split('-');
    const year = Number(yearRaw);
    const monthIndex = Number(monthRaw) - 1;
    const from = new Date(Date.UTC(year, monthIndex, 1));
    const to = new Date(Date.UTC(year, monthIndex + 1, 0));

    const scopeWhere = this.scope.buildWhere(user, 'timesheet', 'VIEW', TIMESHEET_SCOPE);

    const [calendar, days] = await Promise.all([
      this.prisma.workCalendarDay.findMany({
        where: { companyId: { in: user.companyIds }, date: { gte: from, lte: to } },
        orderBy: { date: 'asc' },
      }),
      this.prisma.timesheetDay.findMany({
        where: { date: { gte: from, lte: to }, ...scopeWhere },
        orderBy: { date: 'asc' },
        select: {
          employeeId: true,
          date: true,
          category: true,
          status: true,
          dailyCostSnapshot: true,
          mission: { select: { number: true } },
          affair: { select: { number: true } },
          employee: {
            select: {
              matricule: true,
              firstName: true,
              lastName: true,
              isInspector: true,
              department: { select: { code: true } },
            },
          },
        },
      }),
    ]);

    const byEmployee = new Map<
      string,
      {
        employeeId: string;
        matricule: string;
        name: string;
        department: string | null;
        isInspector: boolean;
        cells: Map<string, { category: string; status: string; ref: string | null }>;
        counts: Record<string, number>;
        cost: number;
      }
    >();

    for (const d of days) {
      const entry =
        byEmployee.get(d.employeeId) ??
        {
          employeeId: d.employeeId,
          matricule: d.employee.matricule,
          name: `${d.employee.lastName.toUpperCase()} ${d.employee.firstName}`,
          department: d.employee.department?.code ?? null,
          isInspector: d.employee.isInspector,
          cells: new Map<string, { category: string; status: string; ref: string | null }>(),
          counts: {} as Record<string, number>,
          cost: 0,
        };

      entry.cells.set(toIso(d.date), {
        category: d.category,
        status: d.status,
        ref: d.mission?.number ?? d.affair?.number ?? null,
      });
      entry.counts[d.category] = (entry.counts[d.category] ?? 0) + 1;
      if (d.category === 'UNASSIGNED') entry.cost += Number(d.dailyCostSnapshot ?? 0);

      byEmployee.set(d.employeeId, entry);
    }

    const columns = calendar.map((c) => ({
      date: toIso(c.date),
      isWorkingDay: c.isWorkingDay,
      label: c.label,
      weekday: c.date.getUTCDay(),
    }));

    return {
      month,
      label: from.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      workingDays: columns.filter((c) => c.isWorkingDay).length,
      columns,
      rows: [...byEmployee.values()]
        .map((e) => ({
          employeeId: e.employeeId,
          matricule: e.matricule,
          name: e.name,
          department: e.department,
          isInspector: e.isInspector,
          cells: Object.fromEntries(e.cells),
          counts: e.counts,
          idleCost: Math.round(e.cost),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      categoryLabels: CATEGORY_LABELS,
    };
  }
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}
