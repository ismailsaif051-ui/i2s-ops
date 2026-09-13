import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/types';

/**
 * Coût journalier historisé.
 *
 * Règle absolue (CDC module 07, docs/09 §1) : l'historique n'est JAMAIS écrasé.
 * Une mise à jour ferme la période en cours et en ouvre une nouvelle. Tout
 * calcul rétroactif utilise le coût en vigueur à la date du fait générateur.
 */
@Injectable()
export class DailyCostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Coût applicable à une date donnée. `null` si aucune période ne couvre la date. */
  async costAt(employeeId: string, date: Date): Promise<Prisma.Decimal | null> {
    const day = atMidnight(date);
    const row = await this.prisma.employeeDailyCost.findFirst({
      where: {
        employeeId,
        validFrom: { lte: day },
        OR: [{ validTo: null }, { validTo: { gte: day } }],
      },
      orderBy: { validFrom: 'desc' },
    });
    return row?.amount ?? null;
  }

  /** Coûts applicables à une date pour plusieurs employés, en une requête. */
  async costsAt(employeeIds: string[], date: Date): Promise<Map<string, Prisma.Decimal>> {
    if (employeeIds.length === 0) return new Map();
    const day = atMidnight(date);
    const rows = await this.prisma.employeeDailyCost.findMany({
      where: {
        employeeId: { in: employeeIds },
        validFrom: { lte: day },
        OR: [{ validTo: null }, { validTo: { gte: day } }],
      },
      orderBy: { validFrom: 'desc' },
    });
    const map = new Map<string, Prisma.Decimal>();
    for (const row of rows) {
      if (!map.has(row.employeeId)) map.set(row.employeeId, row.amount);
    }
    return map;
  }

  async history(employeeId: string) {
    return this.prisma.employeeDailyCost.findMany({
      where: { employeeId },
      orderBy: { validFrom: 'desc' },
    });
  }

  /**
   * Ouvre une nouvelle période de coût. Le motif est obligatoire et l'opération
   * est journalisée avec l'ancienne et la nouvelle valeur.
   */
  async set(
    input: {
      employeeId: string;
      validFrom: Date;
      amount: number;
      currency: string;
      reason: string;
    },
    actor: RequestUser,
    ctx: { ip?: string | null; userAgent?: string | null } = {},
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: input.employeeId, deletedAt: null },
      select: { id: true, matricule: true, companyId: true },
    });
    if (!employee) throw new NotFoundException('Employé introuvable.');

    const validFrom = atMidnight(input.validFrom);

    const existingSameDay = await this.prisma.employeeDailyCost.findUnique({
      where: { employeeId_validFrom: { employeeId: employee.id, validFrom } },
    });
    if (existingSameDay) {
      throw new BadRequestException(
        `Une période de coût débute déjà le ${validFrom.toLocaleDateString('fr-FR')}. ` +
          'Choisissez une autre date de prise d’effet.',
      );
    }

    const previous = await this.prisma.employeeDailyCost.findFirst({
      where: { employeeId: employee.id, validFrom: { lt: validFrom } },
      orderBy: { validFrom: 'desc' },
    });

    const later = await this.prisma.employeeDailyCost.findFirst({
      where: { employeeId: employee.id, validFrom: { gt: validFrom } },
      orderBy: { validFrom: 'asc' },
    });

    const created = await this.prisma.$transaction(async (tx) => {
      // Fermer la période précédente la veille de la nouvelle prise d'effet.
      if (previous && (previous.validTo === null || previous.validTo >= validFrom)) {
        await tx.employeeDailyCost.update({
          where: { id: previous.id },
          data: { validTo: new Date(validFrom.getTime() - 86_400_000) },
        });
      }

      return tx.employeeDailyCost.create({
        data: {
          employeeId: employee.id,
          validFrom,
          // Si une période ultérieure existe déjà, la nouvelle se ferme la veille.
          validTo: later ? new Date(later.validFrom.getTime() - 86_400_000) : null,
          amount: new Prisma.Decimal(input.amount),
          currency: input.currency,
          reason: input.reason,
          createdById: actor.id,
        },
      });
    });

    await this.audit.record(
      {
        entity: 'employee_daily_cost',
        entityId: created.id,
        action: 'SET_DAILY_COST',
        before: previous
          ? { amount: previous.amount.toString(), validFrom: previous.validFrom }
          : null,
        after: {
          matricule: employee.matricule,
          amount: created.amount.toString(),
          validFrom: created.validFrom,
        },
        reason: input.reason,
        companyId: employee.companyId,
      },
      { user: actor, ...ctx },
    );

    return created;
  }
}

function atMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
