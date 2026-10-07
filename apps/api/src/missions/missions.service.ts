import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import { ScopeService } from '../rbac/scope.service';
import { AffairsService } from '../affairs/affairs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { renderMissionOrderPdf } from './mission-order-pdf';
import type { RequestUser, ScopeDescriptor } from '../common/types';

export const MISSION_SCOPE: ScopeDescriptor = {
  companyPath: 'affair.companyId',
  departmentPath: 'departmentId',
  ownerPath: 'assignments.some.employeeId',
  teamPath: 'affair.accountManagerId',
};

/** Motifs pour lesquels une affectation est refusée ou signalée. */
export type AssignmentConflict =
  | 'DOUBLE_BOOKING'
  | 'LEAVE_OVERLAP'
  | 'EXPIRED_CERTIFICATION'
  | 'NO_CERTIFICATION';

export interface ConflictReport {
  employeeId: string;
  employee: string;
  kind: AssignmentConflict;
  message: string;
  /** Un conflit bloquant interdit l'affectation ; les autres l'accompagnent. */
  blocking: boolean;
  /** Journée partagée : l'autre mission de l'inspecteur ces jours-là. */
  otherMission?: { id: string; number: string };
}

export interface MissionInput {
  affairId: string;
  objective?: string | null;
  instructions?: string | null;
  departmentId?: string | null;
  siteId?: string | null;
  serviceType?: string | null;
  billable: boolean;
  plannedStartDate: Date;
  plannedEndDate: Date;
}

export interface AssignmentInput {
  employeeId: string;
  role: string;
  plannedDays: number;
}

@Injectable()
export class MissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly numbering: NumberingService,
    private readonly scope: ScopeService,
    private readonly affairs: AffairsService,
    private readonly notifications: NotificationsService,
  ) {}

  /* ── Lecture ──────────────────────────────────────────────────── */

  async get(user: RequestUser, id: string) {
    const mission = await this.prisma.mission.findFirst({
      where: {
        id,
        deletedAt: null,
        ...this.scope.buildWhere(user, 'mission', 'VIEW', MISSION_SCOPE),
      },
      include: {
        affair: {
          select: {
            id: true,
            number: true,
            title: true,
            companyId: true,
            client: { select: { name: true } },
          },
        },
        department: { select: { id: true, code: true, name: true } },
        site: { select: { id: true, name: true, city: true } },
        vehicle: { select: { plate: true, brand: true, model: true } },
        assignments: {
          include: {
            employee: {
              select: { id: true, matricule: true, firstName: true, lastName: true },
            },
          },
        },
        missionOrder: true,
        inspections: { select: { id: true, status: true } },
        reports: { select: { id: true, number: true, status: true } },
        // Frais imputés à cette mission — seulement ceux de l'intéressé : la
        // note de frais d'un collègue n'a rien à faire sur cet écran.
        expenseLines: {
          // Un compte sans fiche employé (ex. administrateur pur) n'a aucune
          // note de frais à voir ici — la chaîne vide ne correspond à aucun id.
          where: { expenseReport: { employeeId: user.employeeId ?? '' } },
          orderBy: { date: 'asc' },
          select: {
            id: true,
            date: true,
            amount: true,
            status: true,
            category: { select: { label: true } },
            expenseReport: { select: { id: true, number: true, status: true } },
          },
        },
      },
    });

    if (!mission) throw new NotFoundException('Mission introuvable.');
    return mission;
  }

  /* ── Création ─────────────────────────────────────────────────── */

  /**
   * Une mission naît sur une affaire : c'est ce rattachement qui fait que le
   * temps passé, les frais et le chiffre d'affaires retombent au bon endroit.
   * Le délai de remise du rapport est posé dès l'ouverture — 21 jours ouvrés
   * après la fin prévue, objectif qualité du système.
   */
  async create(
    user: RequestUser,
    input: MissionInput,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const affair = await this.prisma.affair.findFirst({
      where: {
        id: input.affairId,
        deletedAt: null,
        ...this.affairs.affairWhere(user, 'VIEW'),
      },
      select: { id: true, number: true, companyId: true, departmentId: true },
    });
    if (!affair) throw new BadRequestException('Affaire introuvable ou hors de votre périmètre.');

    if (input.plannedEndDate < input.plannedStartDate) {
      throw new BadRequestException('La fin prévue précède le début prévu.');
    }

    if (input.siteId) {
      const site = await this.prisma.site.findFirst({
        where: { id: input.siteId, project: { affairId: affair.id } },
        select: { id: true },
      });
      if (!site) {
        throw new BadRequestException('Ce site n’appartient pas à l’affaire choisie.');
      }
    }

    const reportDueDate = await this.addWorkingDays(affair.companyId, input.plannedEndDate, 21);

    const mission = await this.prisma.$transaction(async (tx) => {
      const number = await this.numbering.next(affair.companyId, 'MISSION', {}, tx);

      return tx.mission.create({
        data: {
          number,
          affairId: affair.id,
          // Le service porte la mission : celui demandé, sinon celui de
          // l'affaire, sinon celui du planificateur — sans quoi un chef de
          // département ne verrait pas la mission qu'il vient d'ouvrir.
          departmentId: input.departmentId || affair.departmentId || user.departmentIds[0] || null,
          siteId: input.siteId || null,
          serviceType: input.serviceType?.trim() || null,
          objective: input.objective?.trim() || null,
          instructions: input.instructions?.trim() || null,
          billable: input.billable,
          plannedStartDate: input.plannedStartDate,
          plannedEndDate: input.plannedEndDate,
          reportDueDate,
          status: 'PLANNED',
          requestedById: user.employeeId,
          createdById: user.employeeId,
        },
      });
    });

    await this.audit.record(
      {
        entity: 'mission',
        entityId: mission.id,
        action: 'CREATE',
        after: {
          number: mission.number,
          affair: affair.number,
          from: input.plannedStartDate,
          to: input.plannedEndDate,
          reportDueDate,
        },
        companyId: affair.companyId,
      },
      { user, ...ctx },
    );

    return mission;
  }

  /* ── Affectation ──────────────────────────────────────────────── */

  /**
   * Remplace l'équipe d'une mission après contrôle de disponibilité.
   *
   * Deux refus, vérifiés au serveur : personne n'est affecté pendant un congé
   * accordé, et personne n'intervient avec une certification périmée à la
   * date d'intervention. Ce dernier point n'est pas une commodité : un rapport
   * signé par un inspecteur non certifié n'est pas opposable.
   *
   * Être déjà sur une autre mission le même jour n'est PAS un refus : un
   * inspecteur enchaîne souvent plusieurs interventions courtes dans la
   * journée, qui se partage alors à parts égales. C'est un avertissement.
   */
  async assign(
    user: RequestUser,
    id: string,
    assignments: AssignmentInput[],
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const mission = await this.get(user, id);

    if (['COMPLETED', 'CLOSED', 'CANCELLED'].includes(mission.status)) {
      throw new BadRequestException(
        `Une mission « ${mission.status} » ne se réaffecte pas.`,
      );
    }
    if (mission.missionOrder && mission.missionOrder.status !== 'DRAFT') {
      throw new BadRequestException(
        'L’ordre de mission est déjà émis : modifiez-le avant de changer l’équipe.',
      );
    }
    if (assignments.length === 0) {
      throw new BadRequestException('Une mission a besoin d’au moins un intervenant.');
    }

    const conflicts = await this.checkConflicts(mission, assignments);
    const blocking = conflicts.filter((c) => c.blocking);
    if (blocking.length > 0) {
      throw new BadRequestException({
        message: 'Affectation impossible en l’état.',
        errors: blocking.map((c) => ({ field: c.employee, message: c.message })),
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.missionAssignment.deleteMany({ where: { missionId: id } });

      for (const a of assignments) {
        // Le coût du jour est figé à l'affectation : il servira de référence
        // même si la grille change avant l'exécution.
        const cost = await tx.employeeDailyCost.findFirst({
          where: {
            employeeId: a.employeeId,
            validFrom: { lte: mission.plannedStartDate ?? new Date() },
            OR: [{ validTo: null }, { validTo: { gte: mission.plannedStartDate ?? new Date() } }],
          },
          orderBy: { validFrom: 'desc' },
          select: { amount: true },
        });

        await tx.missionAssignment.create({
          data: {
            missionId: id,
            employeeId: a.employeeId,
            role: a.role,
            plannedDays: a.plannedDays,
            dailyCostSnapshot: cost?.amount ?? null,
          },
        });
      }

      await tx.mission.update({
        where: { id },
        data: { status: 'ASSIGNED', updatedById: user.employeeId },
      });
    });

    await this.audit.record(
      {
        entity: 'mission',
        entityId: id,
        action: 'ASSIGN',
        before: { team: mission.assignments.map((a) => a.employee.matricule) },
        after: {
          team: assignments.map((a) => a.employeeId),
          warnings: conflicts.map((c) => c.message),
        },
        companyId: mission.affair.companyId,
      },
      { user, ...ctx },
    );

    await this.alertSharedDays(user, mission, conflicts);

    return { conflicts };
  }

  /* ── Annulation ───────────────────────────────────────────────── */

  /**
   * Une mission qui n'a encore rien produit peut être annulée. Au-delà — un
   * rapport existe, ou la mission est déjà close — l'annulation reviendrait à
   * effacer un travail livré ; c'est une non-conformité à tracer, pas un
   * retour en arrière.
   */
  async cancel(
    user: RequestUser,
    id: string,
    reason: string,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const mission = await this.get(user, id);

    if (['COMPLETED', 'REPORTED', 'CLOSED', 'CANCELLED'].includes(mission.status)) {
      throw new BadRequestException(
        `Une mission « ${mission.status} » ne s’annule plus.`,
      );
    }

    await this.prisma.mission.update({
      where: { id },
      data: { status: 'CANCELLED', cancelReason: reason, updatedById: user.employeeId },
    });

    await this.audit.record(
      {
        entity: 'mission',
        entityId: id,
        action: 'CANCEL',
        before: { status: mission.status },
        after: { status: 'CANCELLED', reason },
        reason,
        companyId: mission.affair.companyId,
      },
      { user, ...ctx },
    );

    const employeeIds = mission.assignments.map((a) => a.employeeId);
    if (employeeIds.length > 0) {
      const recipients = await this.prisma.user.findMany({
        where: { employeeId: { in: employeeIds } },
        select: { id: true },
      });
      const userIds = recipients.map((r) => r.id).filter((uid) => uid !== user.id);
      if (userIds.length > 0) {
        await this.notifications.notifyMany(userIds, {
          type: 'MISSION_CANCELLED',
          level: 'warning',
          title: `Mission annulée — ${mission.number}`,
          body: `La mission ${mission.number} (${mission.affair.number}) a été annulée. Motif : ${reason}`,
          link: `/operations/missions/${mission.id}`,
          payload: { missionId: mission.id, reason },
        });
      }
    }

    return { status: 'CANCELLED' as const };
  }

  /**
   * Prévient les chefs de service d'une deuxième intervention le même jour.
   *
   * Affecter un inspecteur à deux missions le même jour est permis — la
   * journée se partage à parts égales. Mais celui qui affecte n'est pas
   * toujours le chef de service : un chargé d'affaires peut empiler une
   * intervention sans que le responsable de l'inspecteur le sache. Le chef de
   * service de l'inspecteur est donc prévenu, et celui du service de la
   * mission s'il est différent. Pas l'auteur de l'affectation : il a vu
   * l'avertissement à l'écran.
   */
  private async alertSharedDays(
    user: RequestUser,
    mission: {
      id: string;
      number: string;
      plannedStartDate: Date | null;
      plannedEndDate: Date | null;
      departmentId: string | null;
    },
    conflicts: ConflictReport[],
  ) {
    const shared = conflicts.filter((c) => c.kind === 'DOUBLE_BOOKING' && c.otherMission);
    if (shared.length === 0) return;

    const employeeIds = [...new Set(shared.map((c) => c.employeeId))];
    const [employees, missionDepartment, actor] = await Promise.all([
      this.prisma.employee.findMany({
        where: { id: { in: employeeIds } },
        select: {
          id: true,
          department: { select: { manager: { select: { id: true, user: { select: { id: true } } } } } },
        },
      }),
      mission.departmentId
        ? this.prisma.department.findUnique({
            where: { id: mission.departmentId },
            select: { manager: { select: { id: true, user: { select: { id: true } } } } },
          })
        : Promise.resolve(null),
      user.employeeId
        ? this.prisma.employee.findUnique({
            where: { id: user.employeeId },
            select: { firstName: true, lastName: true },
          })
        : Promise.resolve(null),
    ]);

    const by = actor ? `${actor.lastName.toUpperCase()} ${actor.firstName}` : 'un utilisateur';
    const period =
      mission.plannedStartDate && mission.plannedEndDate
        ? iso(mission.plannedStartDate) === iso(mission.plannedEndDate)
          ? `le ${fr(mission.plannedStartDate)}`
          : `du ${fr(mission.plannedStartDate)} au ${fr(mission.plannedEndDate)}`
        : 'sur la même période';

    for (const employee of employees) {
      const links = shared.filter((c) => c.employeeId === employee.id);
      const name = links[0].employee;
      const others = [...new Set(links.map((c) => c.otherMission!.number))].join(', ');

      // Chef du service de l'inspecteur, puis chef du service de la mission.
      const recipients = new Set<string>();
      for (const manager of [employee.department?.manager, missionDepartment?.manager]) {
        const userId = manager?.user?.id;
        if (userId && userId !== user.id) recipients.add(userId);
      }
      if (recipients.size === 0) continue;

      await this.notifications.notifyMany([...recipients], {
        type: 'MISSION_SHARED_DAY',
        level: 'warning',
        title: `Deuxième intervention le même jour — ${name}`,
        body: `${name} vient d’être affecté à la mission ${mission.number} ${period}, alors qu’il est déjà sur ${others}. La journée sera partagée à parts égales entre les interventions. Affectation faite par ${by}.`,
        link: `/operations/missions/${mission.id}`,
        payload: {
          missionId: mission.id,
          employeeId: employee.id,
          otherMissions: links.map((c) => c.otherMission),
        },
      });
    }
  }

  /* ── Contrôle de disponibilité ────────────────────────────────── */

  async checkConflicts(
    mission: {
      id: string;
      plannedStartDate: Date | null;
      plannedEndDate: Date | null;
      departmentId: string | null;
    },
    assignments: AssignmentInput[],
  ): Promise<ConflictReport[]> {
    const from = mission.plannedStartDate;
    const to = mission.plannedEndDate;
    if (!from || !to) return [];

    const employeeIds = assignments.map((a) => a.employeeId);

    const [employees, overlapping, leaves, certifications] = await Promise.all([
      this.prisma.employee.findMany({
        where: { id: { in: employeeIds } },
        select: {
          id: true,
          matricule: true,
          firstName: true,
          lastName: true,
          isInspector: true,
        },
      }),
      this.prisma.missionAssignment.findMany({
        where: {
          employeeId: { in: employeeIds },
          missionId: { not: mission.id },
          mission: {
            deletedAt: null,
            status: { notIn: ['CANCELLED', 'POSTPONED', 'CLOSED'] },
            plannedStartDate: { lte: to },
            plannedEndDate: { gte: from },
          },
        },
        include: { mission: { select: { id: true, number: true, plannedStartDate: true } } },
      }),
      this.prisma.leaveRequest.findMany({
        where: {
          employeeId: { in: employeeIds },
          status: 'APPROVED',
          startDate: { lte: to },
          endDate: { gte: from },
        },
        select: { employeeId: true, type: true, startDate: true, endDate: true },
      }),
      this.prisma.certification.findMany({
        where: { employeeId: { in: employeeIds } },
        select: { employeeId: true, method: true, level: true, expiresAt: true },
      }),
    ]);

    const nameOf = new Map(
      employees.map((e) => [e.id, `${e.lastName.toUpperCase()} ${e.firstName}`]),
    );
    const inspectors = new Set(employees.filter((e) => e.isInspector).map((e) => e.id));
    const conflicts: ConflictReport[] = [];

    // Plusieurs interventions le même jour sont normales chez I2S — un palan
    // le matin, une élingue l'après-midi. Ce n'est donc plus un refus : la
    // journée se partagera à parts égales entre les missions. Le chef de
    // service est prévenu, pour ne pas empiler par erreur deux interventions
    // longues sur les mêmes jours.
    for (const link of overlapping) {
      conflicts.push({
        employeeId: link.employeeId,
        employee: nameOf.get(link.employeeId) ?? link.employeeId,
        kind: 'DOUBLE_BOOKING',
        message: `Aussi sur la mission ${link.mission.number} ces jours-là : la journée sera partagée à parts égales entre les interventions.`,
        blocking: false,
        otherMission: { id: link.mission.id, number: link.mission.number },
      });
    }

    for (const leave of leaves) {
      conflicts.push({
        employeeId: leave.employeeId,
        employee: nameOf.get(leave.employeeId) ?? leave.employeeId,
        kind: 'LEAVE_OVERLAP',
        message: `Congé accordé du ${fr(leave.startDate)} au ${fr(leave.endDate)}.`,
        blocking: true,
      });
    }

    for (const employeeId of employeeIds) {
      if (!inspectors.has(employeeId)) continue;

      const own = certifications.filter((c) => c.employeeId === employeeId);
      if (own.length === 0) {
        conflicts.push({
          employeeId,
          employee: nameOf.get(employeeId) ?? employeeId,
          kind: 'NO_CERTIFICATION',
          message: 'Aucune certification enregistrée pour cet inspecteur.',
          // Signalé, pas bloquant : un inspecteur peut accompagner sans signer.
          blocking: false,
        });
        continue;
      }

      const valid = own.filter((c) => c.expiresAt !== null && c.expiresAt >= to);
      if (valid.length === 0) {
        const latest = own
          .map((c) => c.expiresAt)
          .filter((d): d is Date => d !== null)
          .sort((a, b) => b.getTime() - a.getTime())[0];

        conflicts.push({
          employeeId,
          employee: nameOf.get(employeeId) ?? employeeId,
          kind: 'EXPIRED_CERTIFICATION',
          message: latest
            ? `Certification expirée le ${fr(latest)}, avant la fin de la mission.`
            : 'Certification sans date de validité.',
          blocking: true,
        });
      }
    }

    return conflicts;
  }

  /* ── Ordre de mission ─────────────────────────────────────────── */

  /**
   * L'ordre de mission est la pièce qui autorise le déplacement. Il n'existe
   * pas sans équipe : c'est lui qui nomme les intervenants.
   */
  async issueOrder(
    user: RequestUser,
    id: string,
    input: {
      object: string;
      instructions?: string | null;
      hseInstructions?: string | null;
      transportMode?: 'SERVICE_VEHICLE' | 'PERSONAL_VEHICLE_AUTHORIZED' | 'TAXI_ORGANIZED' | null;
    },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const mission = await this.get(user, id);

    if (mission.assignments.length === 0) {
      throw new BadRequestException(
        'Affectez au moins un intervenant avant d’émettre l’ordre de mission.',
      );
    }
    if (mission.missionOrder && mission.missionOrder.status !== 'DRAFT') {
      throw new BadRequestException('Un ordre de mission est déjà émis pour cette mission.');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const number =
        mission.missionOrder?.number ??
        (await this.numbering.next(mission.affair.companyId, 'MISSION_ORDER', {}, tx));

      const row = mission.missionOrder
        ? await tx.missionOrder.update({
            where: { id: mission.missionOrder.id },
            data: {
              object: input.object.trim(),
              instructions: input.instructions?.trim() || null,
              hseInstructions: input.hseInstructions?.trim() || null,
              transportMode: input.transportMode || null,
              status: 'APPROVED',
              issuedById: user.employeeId,
              issuedAt: new Date(),
            },
          })
        : await tx.missionOrder.create({
            data: {
              number,
              missionId: id,
              object: input.object.trim(),
              instructions: input.instructions?.trim() || null,
              hseInstructions: input.hseInstructions?.trim() || null,
              transportMode: input.transportMode || null,
              status: 'APPROVED',
              issuedById: user.employeeId,
              issuedAt: new Date(),
            },
          });

      await tx.mission.update({ where: { id }, data: { status: 'CONFIRMED' } });
      return row;
    });

    await this.audit.record(
      {
        entity: 'mission_order',
        entityId: order.id,
        action: 'ISSUE',
        after: { number: order.number, mission: mission.number, status: order.status },
        companyId: mission.affair.companyId,
      },
      { user, ...ctx },
    );

    return order;
  }

  /**
   * La signature ouvre la saisie terrain — c'est la condition d'entrée du
   * workflow d'inspection. On conserve une empreinte du contenu signé : elle
   * prouve que l'ordre n'a pas été retouché après coup.
   */
  async signOrder(
    user: RequestUser,
    id: string,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const mission = await this.get(user, id);
    const order = mission.missionOrder;

    if (!order) throw new NotFoundException('Aucun ordre de mission à signer.');
    if (order.status === 'SIGNED' || order.status === 'IN_PROGRESS') {
      throw new BadRequestException('Cet ordre de mission est déjà signé.');
    }
    if (order.status !== 'APPROVED') {
      throw new BadRequestException('Seul un ordre de mission approuvé peut être signé.');
    }
    if (!user.employeeId) {
      throw new BadRequestException(
        'Votre compte n’est rattaché à aucun employé : impossible de signer.',
      );
    }

    const signedAt = new Date();
    const signatureHash = createHash('sha256')
      .update(
        JSON.stringify({
          number: order.number,
          mission: mission.number,
          object: order.object,
          instructions: order.instructions,
          hseInstructions: order.hseInstructions,
          transportMode: order.transportMode,
          team: mission.assignments.map((a) => a.employee.matricule).sort(),
          signedBy: user.employeeId,
          signedAt: signedAt.toISOString(),
          nonce: randomBytes(8).toString('hex'),
        }),
      )
      .digest('hex');

    const signed = await this.prisma.$transaction(async (tx) => {
      const row = await tx.missionOrder.update({
        where: { id: order.id },
        data: {
          status: 'SIGNED',
          signedById: user.employeeId,
          signedAt,
          signatureHash,
          signatureIp: ctx.ip ?? null,
        },
      });

      await tx.mission.update({ where: { id }, data: { status: 'ORDER_ISSUED' } });
      return row;
    });

    await this.audit.record(
      {
        entity: 'mission_order',
        entityId: order.id,
        action: 'SIGN',
        before: { status: order.status },
        after: { status: signed.status, signedAt, signatureHash },
        companyId: mission.affair.companyId,
      },
      { user, ...ctx },
    );

    return signed;
  }

  /**
   * Pièce imprimable de l'ordre de mission — celle que l'inspecteur emporte
   * sur site. N'existe qu'à partir de la signature : avant, il n'y a rien
   * d'immuable à remettre (docs/05-WORKFLOWS.md, W3).
   */
  async orderPdf(user: RequestUser, id: string): Promise<Buffer> {
    const mission = await this.get(user, id);
    const order = mission.missionOrder;

    if (!order || !['SIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(order.status)) {
      throw new BadRequestException('Cet ordre de mission n’est pas encore signé.');
    }

    const [company, signer, issuer] = await Promise.all([
      this.prisma.company.findUniqueOrThrow({
        where: { id: mission.affair.companyId },
        select: { name: true, address: true, phone: true },
      }),
      order.signedById
        ? this.prisma.employee.findUnique({
            where: { id: order.signedById },
            select: { firstName: true, lastName: true },
          })
        : Promise.resolve(null),
      order.issuedById
        ? this.prisma.employee.findUnique({
            where: { id: order.issuedById },
            select: { firstName: true, lastName: true },
          })
        : Promise.resolve(null),
    ]);

    return renderMissionOrderPdf({
      number: order.number,
      object: order.object,
      instructions: order.instructions,
      hseInstructions: order.hseInstructions,
      transportMode: order.transportMode,
      company,
      client: mission.affair.client.name,
      affair: { number: mission.affair.number, title: mission.affair.title },
      mission: {
        number: mission.number,
        plannedStartDate: mission.plannedStartDate,
        plannedEndDate: mission.plannedEndDate,
      },
      department: mission.department,
      site: mission.site,
      vehicle: mission.vehicle,
      team: mission.assignments.map((a) => ({
        name: `${a.employee.lastName.toUpperCase()} ${a.employee.firstName}`,
        matricule: a.employee.matricule,
        role: a.role,
      })),
      issuedBy: issuer ? `${issuer.lastName.toUpperCase()} ${issuer.firstName}` : null,
      issuedAt: order.issuedAt,
      signedBy: signer ? `${signer.lastName.toUpperCase()} ${signer.firstName}` : null,
      signedAt: order.signedAt,
      signatureHash: order.signatureHash,
      signatureIp: order.signatureIp,
    });
  }

  /* ── Calendrier ───────────────────────────────────────────────── */

  /** Ajoute un nombre de jours ouvrés au calendrier de la société. */
  private async addWorkingDays(companyId: string, from: Date, days: number): Promise<Date> {
    const rows = await this.prisma.workCalendarDay.findMany({
      where: { companyId, isWorkingDay: true, date: { gt: from } },
      orderBy: { date: 'asc' },
      take: days,
      select: { date: true },
    });

    // Calendrier incomplet au-delà de l'exercice : on retombe sur le calendaire.
    if (rows.length < days) {
      return new Date(from.getTime() + Math.round(days * 1.4) * 86_400_000);
    }
    return rows[rows.length - 1]!.date;
  }
}

function fr(date: Date): string {
  return date.toLocaleDateString('fr-FR');
}

/** Date au format AAAA-MM-JJ, pour comparer deux jours. */
function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}
