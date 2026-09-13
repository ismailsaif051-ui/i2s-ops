import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ScopeService } from '../rbac/scope.service';
import type { RequestUser, ScopeDescriptor } from '../common/types';

export const LEAVE_SCOPE: ScopeDescriptor = {
  companyPath: 'employee.companyId',
  departmentPath: 'employee.departmentId',
  ownerPath: 'employeeId',
  teamPath: 'employeeId',
};

export const LEAVE_TYPES = ['ANNUAL', 'SICK', 'UNPAID', 'RECOVERY', 'SPECIAL'] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: 'Congé annuel',
  SICK: 'Arrêt maladie',
  UNPAID: 'Congé sans solde',
  RECOVERY: 'Récupération',
  SPECIAL: 'Congé exceptionnel',
};

export interface LeaveWarning {
  message: string;
}

@Injectable()
export class LeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly scope: ScopeService,
  ) {}

  /* ── Lecture ──────────────────────────────────────────────────── */

  async get(user: RequestUser, id: string) {
    const leave = await this.prisma.leaveRequest.findFirst({
      where: { id, employee: { companyId: { in: user.companyIds } } },
      include: {
        employee: {
          select: {
            id: true,
            matricule: true,
            firstName: true,
            lastName: true,
            departmentId: true,
            department: { select: { code: true } },
          },
        },
      },
    });

    if (!leave) throw new NotFoundException('Demande de congé introuvable.');

    const level = this.scope.requireScope(user, 'leave', 'VIEW');
    const allowed =
      level === 'ALL' ||
      level === 'COMPANY' ||
      (level === 'DEPARTMENT' &&
        leave.employee.departmentId !== null &&
        user.departmentIds.includes(leave.employee.departmentId)) ||
      (level === 'TEAM' &&
        (leave.employeeId === user.employeeId ||
          user.teamEmployeeIds.includes(leave.employeeId))) ||
      (level === 'OWN' && leave.employeeId === user.employeeId);

    if (!allowed) throw new ForbiddenException('Cette demande est hors de votre périmètre.');

    return leave;
  }

  /* ── Demande ──────────────────────────────────────────────────── */

  /**
   * Dépose une demande de congé.
   *
   * Le nombre de jours n'est pas saisi : il se compte sur le calendrier de la
   * société. Une semaine posée sur un pont férié ne consomme pas cinq jours,
   * et laisser quelqu'un l'écrire à la main ouvrirait la porte aux écarts de
   * solde.
   */
  async request(
    user: RequestUser,
    input: { type: LeaveType; startDate: Date; endDate: Date; reason?: string | null; employeeId?: string },
    ctx: { ip?: string | null; userAgent?: string | null },
  ): Promise<{ leave: unknown; warnings: LeaveWarning[] }> {
    const employeeId = input.employeeId ?? user.employeeId;
    if (!employeeId) {
      throw new ForbiddenException(
        'Votre compte n’est rattaché à aucun employé : impossible de poser un congé.',
      );
    }
    if (employeeId !== user.employeeId && !this.canActFor(user)) {
      throw new ForbiddenException('Vous ne pouvez poser un congé que pour vous-même.');
    }

    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, deletedAt: null, companyId: { in: user.companyIds } },
      select: { id: true, companyId: true },
    });
    if (!employee) throw new BadRequestException('Employé introuvable.');

    const start = startOfDay(input.startDate);
    const end = startOfDay(input.endDate);

    if (end < start) {
      throw new BadRequestException({
        message: 'Demande refusée.',
        errors: [{ field: 'endDate', message: 'La fin ne peut pas précéder le début.' }],
      });
    }

    // Deux congés ne se chevauchent pas : un jour n'est absent qu'une fois.
    const overlap = await this.prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['SUBMITTED', 'APPROVED'] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: { id: true, startDate: true, endDate: true },
    });
    if (overlap) {
      throw new BadRequestException({
        message: 'Demande refusée.',
        errors: [
          {
            field: 'startDate',
            message: `Une demande couvre déjà du ${overlap.startDate.toLocaleDateString('fr-FR')} au ${overlap.endDate.toLocaleDateString('fr-FR')}.`,
          },
        ],
      });
    }

    const days = await this.workingDaysBetween(employee.companyId, start, end);
    if (days === 0) {
      throw new BadRequestException({
        message: 'Demande refusée.',
        errors: [
          {
            field: 'startDate',
            message: 'Cette période ne compte aucun jour ouvré : il n’y a rien à poser.',
          },
        ],
      });
    }

    const warnings = await this.assignmentWarnings(employeeId, start, end);

    const leave = await this.prisma.leaveRequest.create({
      data: {
        employeeId,
        type: input.type,
        startDate: start,
        endDate: end,
        days,
        reason: input.reason?.trim() || null,
        status: 'SUBMITTED',
      },
    });

    await this.audit.record(
      {
        entity: 'leave',
        entityId: leave.id,
        action: 'REQUEST',
        after: { type: input.type, from: iso(start), to: iso(end), days },
        companyId: employee.companyId,
      },
      { user, ...ctx },
    );

    return { leave, warnings };
  }

  /* ── Décision ─────────────────────────────────────────────────── */

  /**
   * Le responsable accorde ou refuse.
   *
   * Un congé accordé se répercute seul sur le pointage : la déduction du
   * planning en fait une journée d'absence, sans nouvelle saisie.
   */
  async decide(
    user: RequestUser,
    id: string,
    input: { decision: 'APPROVE' | 'REJECT'; comment?: string | null },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const leave = await this.get(user, id);

    if (!this.canApprove(user)) {
      throw new ForbiddenException('Droit manquant : APPROVE sur leave.');
    }
    if (leave.employeeId === user.employeeId && !user.roleCodes.includes('ADMIN')) {
      throw new BadRequestException('Un congé ne s’accorde pas soi-même.');
    }
    if (leave.status !== 'SUBMITTED') {
      throw new BadRequestException(`Une demande « ${leave.status} » n’attend aucune décision.`);
    }
    if (input.decision === 'REJECT' && !input.comment?.trim()) {
      throw new BadRequestException({
        message: 'Refus refusé.',
        errors: [{ field: 'comment', message: 'Un refus doit être motivé.' }],
      });
    }

    const warnings =
      input.decision === 'APPROVE'
        ? await this.assignmentWarnings(leave.employeeId, leave.startDate, leave.endDate)
        : [];

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        approverId: user.employeeId,
        decidedAt: new Date(),
        reason: input.decision === 'REJECT' ? (input.comment?.trim() ?? leave.reason) : leave.reason,
      },
    });

    await this.audit.record(
      {
        entity: 'leave',
        entityId: id,
        action: input.decision === 'APPROVE' ? 'APPROVE' : 'REJECT',
        before: { status: leave.status },
        after: { status: updated.status },
        reason: input.comment ?? null,
      },
      { user, ...ctx },
    );

    return { leave: updated, warnings };
  }

  /** Le demandeur retire sa demande, tant qu'elle n'est pas tranchée. */
  async cancel(user: RequestUser, id: string, ctx: { ip?: string | null; userAgent?: string | null }) {
    const leave = await this.get(user, id);

    if (leave.employeeId !== user.employeeId && !this.canApprove(user)) {
      throw new ForbiddenException('Seul le demandeur retire sa demande.');
    }
    if (!['DRAFT', 'SUBMITTED'].includes(leave.status)) {
      throw new BadRequestException(
        'Une demande déjà tranchée ne se retire plus : demandez son annulation au responsable.',
      );
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await this.audit.record(
      {
        entity: 'leave',
        entityId: id,
        action: 'CANCEL',
        before: { status: leave.status },
        after: { status: updated.status },
      },
      { user, ...ctx },
    );

    return updated;
  }

  /* ── Utilitaires ──────────────────────────────────────────────── */

  /** Jours ouvrés d'une période, d'après le calendrier de la société. */
  private async workingDaysBetween(companyId: string, from: Date, to: Date): Promise<number> {
    const calendar = await this.prisma.workCalendarDay.findMany({
      where: { companyId, date: { gte: from, lte: to } },
      select: { date: true, isWorkingDay: true },
    });

    // Le calendrier fait foi là où il est renseigné ; ailleurs, le week-end
    // reste la seule exclusion connue.
    const known = new Map(calendar.map((c) => [iso(c.date), c.isWorkingDay]));

    let days = 0;
    for (let day = new Date(from); day <= to; day = addDays(day, 1)) {
      const working = known.get(iso(day)) ?? ![0, 6].includes(day.getUTCDay());
      if (working) days += 1;
    }
    return days;
  }

  /**
   * Missions planifiées pendant l'absence.
   *
   * On signale sans bloquer : c'est au responsable d'arbitrer entre le congé
   * et la mission, pas au système.
   */
  private async assignmentWarnings(
    employeeId: string,
    from: Date,
    to: Date,
  ): Promise<LeaveWarning[]> {
    const assignments = await this.prisma.missionAssignment.findMany({
      where: {
        employeeId,
        mission: {
          deletedAt: null,
          status: { notIn: ['CANCELLED', 'POSTPONED'] },
          plannedStartDate: { lte: to },
          plannedEndDate: { gte: from },
        },
      },
      select: {
        mission: {
          select: { number: true, plannedStartDate: true, plannedEndDate: true },
        },
      },
    });

    return assignments.map((a) => ({
      message: `La mission ${a.mission.number} est planifiée du ${a.mission.plannedStartDate?.toLocaleDateString('fr-FR')} au ${a.mission.plannedEndDate?.toLocaleDateString('fr-FR')} : il faudra la réaffecter.`,
    }));
  }

  private canActFor(user: RequestUser): boolean {
    return user.permissions.some(
      (p) =>
        p.resource === 'leave' &&
        p.action === 'CREATE' &&
        (p.scope === 'COMPANY' || p.scope === 'ALL'),
    );
  }

  private canApprove(user: RequestUser): boolean {
    return user.permissions.some((p) => p.resource === 'leave' && p.action === 'APPROVE');
  }
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}
