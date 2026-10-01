import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { splitDay } from '../timesheets/day-split';
import { readCostSheet, type CostSheetRow } from './daily-cost-sheet';
import type { RequestUser } from '../common/types';

type Tx = Prisma.TransactionClient;
type Ctx = { ip?: string | null; userAgent?: string | null };

interface PeriodInput {
  validFrom: Date;
  amount: number;
  currency: string;
  reason: string;
}

/** Ce que l'ouverture d'une période a changé — pour l'écran et pour l'audit. */
export interface PeriodOutcome {
  created: Prisma.EmployeeDailyCostGetPayload<object>;
  previous: { amount: string; validFrom: Date } | null;
  /** Journées déjà pointées revalorisées au nouveau coût. */
  repricedDays: number;
  /** Journées d'un mois clôturé laissées à leur ancien coût. */
  lockedDays: number;
}

export interface CostImportLine {
  row: number;
  matricule: string;
  employee?: string;
  status: 'ready' | 'done' | 'unchanged' | 'error';
  amount?: number;
  previousAmount?: number | null;
  validFrom?: string;
  message?: string;
}

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
  async set(input: PeriodInput & { employeeId: string }, actor: RequestUser, ctx: Ctx = {}) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: input.employeeId, deletedAt: null },
      select: { id: true, matricule: true, companyId: true },
    });
    if (!employee) throw new NotFoundException('Employé introuvable.');

    const outcome = await this.prisma.$transaction((tx) =>
      this.openPeriod(tx, employee.id, input, actor),
    );
    await this.recordAudit(employee, outcome, input.reason, actor, ctx);

    return {
      ...outcome.created,
      repricedDays: outcome.repricedDays,
      lockedDays: outcome.lockedDays,
    };
  }

  /**
   * Mise à jour en masse depuis un classeur : augmentation annuelle, reprise
   * de l'historique de paie.
   *
   * En deux temps. Sans `apply`, rien n'est écrit : l'écran montre ligne par
   * ligne ce qui changera. Avec `apply`, tout passe ou rien ne passe — un
   * import de coûts à moitié appliqué laisserait des marges fausses sans que
   * personne sache lesquelles.
   */
  async importSheet(
    user: RequestUser,
    fileName: string,
    records: Array<Record<string, unknown>>,
    apply: boolean,
    ctx: Ctx = {},
  ) {
    const companyId = user.companyIds[0];
    if (!companyId) throw new BadRequestException('Aucune société associée à votre compte.');

    const { rows, missing } = readCostSheet(records, `Import du fichier « ${fileName} »`);
    if (missing.length > 0) {
      throw new BadRequestException(
        `Colonne(s) introuvable(s) : ${missing.join(', ')}. Partez du modèle à télécharger.`,
      );
    }

    const wanted = rows.filter((r) => r.amount !== null || r.validFrom !== null || r.error);
    if (wanted.length === 0) {
      throw new BadRequestException(
        'Aucun nouveau coût dans ce fichier : la colonne « Nouveau coût journalier » est vide.',
      );
    }

    const matricules = [...new Set(wanted.map((r) => r.matricule).filter(Boolean))];
    const employees = await this.prisma.employee.findMany({
      where: { companyId, matricule: { in: matricules }, deletedAt: null },
      select: {
        id: true,
        matricule: true,
        firstName: true,
        lastName: true,
        companyId: true,
        dailyCosts: { orderBy: { validFrom: 'asc' } },
      },
    });
    const byMatricule = new Map(employees.map((e) => [e.matricule, e]));

    const lines: CostImportLine[] = [];
    const seen = new Set<string>();
    const toApply: Array<{
      line: CostImportLine;
      sheet: CostSheetRow;
      employeeId: string;
    }> = [];

    for (const sheet of wanted) {
      const line: CostImportLine = {
        row: sheet.row,
        matricule: sheet.matricule || '—',
        status: 'ready',
      };
      lines.push(line);
      if (sheet.validFrom && !Number.isNaN(sheet.validFrom.getTime()))
        line.validFrom = iso(sheet.validFrom);
      if (sheet.amount !== null && !Number.isNaN(sheet.amount)) line.amount = sheet.amount;

      if (sheet.error) {
        Object.assign(line, { status: 'error', message: sheet.error });
        continue;
      }

      const employee = byMatricule.get(sheet.matricule);
      if (!employee) {
        Object.assign(line, {
          status: 'error',
          message: 'Aucun employé ne porte ce matricule.',
        });
        continue;
      }
      line.employee = `${employee.lastName.toUpperCase()} ${employee.firstName}`;

      const validFrom = sheet.validFrom!;
      const key = `${employee.id}|${iso(validFrom)}`;
      if (seen.has(key)) {
        Object.assign(line, {
          status: 'error',
          message: 'Deux lignes du fichier pour ce matricule et cette date d’effet.',
        });
        continue;
      }
      seen.add(key);

      const sameDay = employee.dailyCosts.find(
        (c) => c.validFrom.getTime() === validFrom.getTime(),
      );
      const inForce =
        [...employee.dailyCosts].reverse().find((c) => c.validFrom <= validFrom) ?? null;
      line.previousAmount = inForce ? Number(inForce.amount) : null;

      if (sameDay) {
        if (Number(sameDay.amount) === sheet.amount) {
          Object.assign(line, {
            status: 'unchanged',
            message: 'Déjà enregistré.',
          });
        } else {
          Object.assign(line, {
            status: 'error',
            message:
              `Une période commence déjà le ${fr(validFrom)} à ${Number(sameDay.amount).toLocaleString('fr-FR')} DH. ` +
              'Une période enregistrée ne se modifie pas : indiquez une autre date d’effet.',
          });
        }
        continue;
      }

      if (inForce && Number(inForce.amount) === sheet.amount) {
        Object.assign(line, {
          status: 'unchanged',
          message: `Ce coût est déjà en vigueur depuis le ${fr(inForce.validFrom)}.`,
        });
        continue;
      }

      toApply.push({ line, sheet, employeeId: employee.id });
    }

    const summary = () => ({
      ready: lines.filter((l) => l.status === 'ready').length,
      done: lines.filter((l) => l.status === 'done').length,
      unchanged: lines.filter((l) => l.status === 'unchanged').length,
      errors: lines.filter((l) => l.status === 'error').length,
    });

    if (!apply)
      return {
        applied: false,
        ...summary(),
        repricedDays: 0,
        lockedDays: 0,
        lines,
      };

    if (summary().errors > 0) {
      throw new BadRequestException(
        'Le fichier contient des erreurs : corrigez-les puis relancez l’aperçu. Rien n’a été enregistré.',
      );
    }
    if (toApply.length === 0) {
      throw new BadRequestException('Rien à enregistrer : tous ces coûts sont déjà en place.');
    }

    // Par date croissante : la reprise d'un historique ouvre ses périodes
    // dans l'ordre où elles se sont succédé.
    toApply.sort((a, b) => a.sheet.validFrom!.getTime() - b.sheet.validFrom!.getTime());

    const outcomes = await this.prisma.$transaction(
      async (tx) => {
        const done: Array<{
          employeeId: string;
          reason: string;
          outcome: PeriodOutcome;
        }> = [];
        for (const item of toApply) {
          const outcome = await this.openPeriod(
            tx,
            item.employeeId,
            {
              validFrom: item.sheet.validFrom!,
              amount: item.sheet.amount!,
              currency: 'MAD',
              reason: item.sheet.reason,
            },
            user,
          );
          done.push({
            employeeId: item.employeeId,
            reason: item.sheet.reason,
            outcome,
          });
          item.line.status = 'done';
        }
        return done;
      },
      { timeout: 120_000, maxWait: 10_000 },
    );

    const byId = new Map(employees.map((e) => [e.id, e]));
    for (const { employeeId, reason, outcome } of outcomes) {
      await this.recordAudit(byId.get(employeeId)!, outcome, reason, user, ctx);
    }

    return {
      applied: true,
      ...summary(),
      repricedDays: outcomes.reduce((sum, o) => sum + o.outcome.repricedDays, 0),
      lockedDays: outcomes.reduce((sum, o) => sum + o.outcome.lockedDays, 0),
      lines,
    };
  }

  /**
   * Ouvre la période dans une transaction, puis revalorise les journées
   * déjà pointées qu'elle couvre.
   *
   * Un coût antidaté est courant — l'augmentation décidée en mars, applicable
   * au 1er janvier. Sans revalorisation, les journées de janvier à mars
   * garderaient l'ancien coût et la marge de ces affaires resterait fausse.
   * Seul un mois clôturé (statut LOCKED) garde ses coûts : ses chiffres ont
   * déjà été arrêtés.
   */
  private async openPeriod(
    tx: Tx,
    employeeId: string,
    input: PeriodInput,
    actor: RequestUser,
  ): Promise<PeriodOutcome> {
    const validFrom = atMidnight(input.validFrom);

    const existingSameDay = await tx.employeeDailyCost.findUnique({
      where: { employeeId_validFrom: { employeeId, validFrom } },
    });
    if (existingSameDay) {
      throw new BadRequestException(
        `Une période de coût débute déjà le ${fr(validFrom)}. ` +
          'Choisissez une autre date de prise d’effet.',
      );
    }

    const previous = await tx.employeeDailyCost.findFirst({
      where: { employeeId, validFrom: { lt: validFrom } },
      orderBy: { validFrom: 'desc' },
    });

    const later = await tx.employeeDailyCost.findFirst({
      where: { employeeId, validFrom: { gt: validFrom } },
      orderBy: { validFrom: 'asc' },
    });

    // Fermer la période précédente la veille de la nouvelle prise d'effet.
    if (previous && (previous.validTo === null || previous.validTo >= validFrom)) {
      await tx.employeeDailyCost.update({
        where: { id: previous.id },
        data: { validTo: dayBefore(validFrom) },
      });
    }

    // Si une période ultérieure existe déjà, la nouvelle se ferme la veille.
    const validTo = later ? dayBefore(later.validFrom) : null;
    const created = await tx.employeeDailyCost.create({
      data: {
        employeeId,
        validFrom,
        validTo,
        amount: new Prisma.Decimal(input.amount),
        currency: input.currency,
        reason: input.reason,
        createdById: actor.id,
      },
    });

    const { repricedDays, lockedDays } = await this.reprice(
      tx,
      employeeId,
      validFrom,
      validTo,
      input.amount,
    );

    return {
      created,
      previous: previous
        ? { amount: previous.amount.toString(), validFrom: previous.validFrom }
        : null,
      repricedDays,
      lockedDays,
    };
  }

  /**
   * Revalorise les journées pointées entre deux dates. Une journée partagée
   * entre plusieurs interventions se repartage à parts égales, la dernière
   * absorbant l'arrondi — exactement comme à la génération du pointage.
   */
  private async reprice(tx: Tx, employeeId: string, from: Date, to: Date | null, amount: number) {
    const rows = await tx.timesheetDay.findMany({
      where: { employeeId, date: { gte: from, ...(to ? { lte: to } : {}) } },
      select: { id: true, date: true, status: true, dailyCostSnapshot: true },
      orderBy: [{ date: 'asc' }, { id: 'asc' }],
    });

    const days = new Map<string, typeof rows>();
    for (const row of rows) {
      const key = iso(row.date);
      days.set(key, [...(days.get(key) ?? []), row]);
    }

    let repricedDays = 0;
    let lockedDays = 0;
    for (const dayRows of days.values()) {
      if (dayRows.some((r) => r.status === 'LOCKED')) {
        lockedDays += 1;
        continue;
      }

      const slots = splitDay(dayRows.length, amount);
      let changed = false;
      for (const [index, row] of dayRows.entries()) {
        const cost = slots[index].cost!;
        if (row.dailyCostSnapshot !== null && Number(row.dailyCostSnapshot) === cost) continue;
        await tx.timesheetDay.update({
          where: { id: row.id },
          data: { dailyCostSnapshot: cost },
        });
        changed = true;
      }
      if (changed) repricedDays += 1;
    }

    return { repricedDays, lockedDays };
  }

  private async recordAudit(
    employee: { matricule: string; companyId: string },
    outcome: PeriodOutcome,
    reason: string,
    actor: RequestUser,
    ctx: Ctx,
  ) {
    await this.audit.record(
      {
        entity: 'employee_daily_cost',
        entityId: outcome.created.id,
        action: 'SET_DAILY_COST',
        before: outcome.previous,
        after: {
          matricule: employee.matricule,
          amount: outcome.created.amount.toString(),
          validFrom: outcome.created.validFrom,
          repricedDays: outcome.repricedDays,
          lockedDays: outcome.lockedDays,
        },
        reason,
        companyId: employee.companyId,
      },
      { user: actor, ...ctx },
    );
  }
}

function atMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayBefore(date: Date): Date {
  return new Date(date.getTime() - 86_400_000);
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function fr(date: Date): string {
  return date.toLocaleDateString('fr-FR', { timeZone: 'UTC' });
}
