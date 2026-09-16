import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateEmployeeInput } from '@i2s/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeService } from '../rbac/scope.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/types';

/** Colonnes portant le périmètre pour la ressource `employee`. */
const SCOPE = {
  companyPath: 'companyId',
  departmentPath: 'departmentId',
  ownerPath: 'id',
  teamPath: 'id',
} as const;

/** Cellule Excel → texte propre, quel que soit le type d'origine. */
function cell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

/** Accepte une date Excel native ou un texte JJ/MM/AAAA — le format de l'export. */
function parseFrenchDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  const text = cell(value);
  const m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
}

function parseAmount(value: unknown): number | null {
  if (typeof value === 'number') return value;
  const text = cell(value).replace(',', '.');
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
    private readonly audit: AuditService,
  ) {}

  async list(user: RequestUser, query: { limit: number; cursor?: string; q?: string }) {
    const scopeWhere = this.scope.buildWhere(user, 'employee', 'VIEW', SCOPE);

    const where = {
      deletedAt: null,
      ...scopeWhere,
      ...(query.q
        ? {
            OR: [
              { firstName: { contains: query.q, mode: 'insensitive' as const } },
              { lastName: { contains: query.q, mode: 'insensitive' as const } },
              { matricule: { contains: query.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.employee.findMany({
      where,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: {
        department: { select: { id: true, code: true, name: true } },
        dailyCosts: {
          where: { OR: [{ validTo: null }, { validTo: { gte: new Date() } }] },
          orderBy: { validFrom: 'desc' },
          take: 1,
        },
      },
    });

    const hasMore = rows.length > query.limit;
    const items = (hasMore ? rows.slice(0, query.limit) : rows).map((e) => ({
      id: e.id,
      matricule: e.matricule,
      firstName: e.firstName,
      lastName: e.lastName,
      position: e.position,
      isInspector: e.isInspector,
      status: e.status,
      department: e.department,
      currentDailyCost: e.dailyCosts[0]
        ? { amount: e.dailyCosts[0].amount.toString(), validFrom: e.dailyCosts[0].validFrom }
        : null,
    }));

    return { items, nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null };
  }

  /**
   * Lignes pour l'extraction Excel — sans le RIB : une fiche employé se
   * consulte une à une pour ça, un tableur circule trop facilement pour y
   * mettre des coordonnées bancaires.
   */
  async exportRows(user: RequestUser) {
    const scopeWhere = this.scope.buildWhere(user, 'employee', 'EXPORT', SCOPE);

    return this.prisma.employee.findMany({
      where: { deletedAt: null, ...scopeWhere },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      include: {
        department: { select: { code: true } },
        dailyCosts: {
          where: { OR: [{ validTo: null }, { validTo: { gte: new Date() } }] },
          orderBy: { validFrom: 'desc' },
          take: 1,
        },
      },
    });
  }

  /**
   * Import en masse — mêmes colonnes que exportRows, pour un aller-retour
   * Excel naturel. Un matricule déjà connu est ignoré, jamais réécrit : un
   * import ne doit pas pouvoir écraser une fiche existante en silence.
   */
  async importRows(
    user: RequestUser,
    rows: Array<Record<string, unknown>>,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    this.scope.requireScope(user, 'employee', 'CREATE');

    const companyId = user.companyIds[0];
    if (!companyId) {
      throw new Error('Aucune société associée à votre compte.');
    }

    const departments = await this.prisma.department.findMany({
      where: { companyId },
      select: { id: true, code: true },
    });
    const deptByCode = new Map(departments.map((d) => [d.code.toUpperCase(), d.id]));

    const details: Array<{
      row: number;
      matricule: string;
      status: 'created' | 'skipped' | 'error';
      message?: string;
    }> = [];

    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      const rowNumber = i + 2;
      const matricule = cell(r['Matricule']);
      const lastName = cell(r['Nom']);
      const firstName = cell(r['Prénom']);

      if (!matricule || !lastName || !firstName) {
        details.push({
          row: rowNumber,
          matricule: matricule || '—',
          status: 'error',
          message: 'Matricule, nom et prénom sont obligatoires.',
        });
        continue;
      }

      const existing = await this.prisma.employee.findFirst({
        where: { companyId, matricule },
        select: { id: true },
      });
      if (existing) {
        details.push({
          row: rowNumber,
          matricule,
          status: 'skipped',
          message: 'Un employé porte déjà ce matricule — fiche inchangée.',
        });
        continue;
      }

      const deptCode = cell(r['Département']).toUpperCase();
      const departmentId = deptCode ? (deptByCode.get(deptCode) ?? null) : null;
      if (deptCode && !departmentId) {
        details.push({
          row: rowNumber,
          matricule,
          status: 'error',
          message: `Département inconnu : ${deptCode}.`,
        });
        continue;
      }

      const hireDate = parseFrenchDate(r['Embauché le']);
      const dailyCostAmount = parseAmount(r['Coût journalier']);

      try {
        await this.prisma.$transaction(async (tx) => {
          const employee = await tx.employee.create({
            data: {
              companyId,
              matricule,
              firstName,
              lastName,
              departmentId,
              position: cell(r['Fonction']) || null,
              email: cell(r['Email']) || null,
              phone: cell(r['Téléphone']) || null,
              isInspector: /^oui$/i.test(cell(r['Inspecteur'])),
              contractType: cell(r['Type de contrat']) || null,
              hireDate,
              createdById: user.id,
              updatedById: user.id,
            },
          });

          if (dailyCostAmount !== null && dailyCostAmount > 0) {
            await tx.employeeDailyCost.create({
              data: {
                employeeId: employee.id,
                validFrom: hireDate ?? new Date(),
                amount: dailyCostAmount,
                reason: 'Import initial',
                createdById: user.id,
              },
            });
          }
        });

        details.push({ row: rowNumber, matricule, status: 'created' });
      } catch (error) {
        details.push({
          row: rowNumber,
          matricule,
          status: 'error',
          message: error instanceof Error ? error.message : 'Erreur inconnue.',
        });
      }
    }

    const created = details.filter((d) => d.status === 'created').length;
    const skipped = details.filter((d) => d.status === 'skipped').length;
    const errors = details.filter((d) => d.status === 'error').length;

    await this.audit.record(
      {
        entity: 'employee',
        entityId: 'import',
        action: 'IMPORT',
        after: { created, skipped, errors, total: rows.length },
        companyId,
      },
      { user, ...ctx },
    );

    return { created, skipped, errors, details };
  }

  async get(user: RequestUser, id: string) {
    const scopeWhere = this.scope.buildWhere(user, 'employee', 'VIEW', SCOPE);

    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null, ...scopeWhere },
      include: {
        department: { select: { id: true, code: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
        dailyCosts: { orderBy: { validFrom: 'desc' } },
        certifications: { orderBy: { expiresAt: 'asc' } },
        skills: { include: { skill: true } },
      },
    });

    if (!employee) throw new NotFoundException('Employé introuvable ou hors de votre périmètre.');
    return employee;
  }

  async create(
    user: RequestUser,
    input: CreateEmployeeInput,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    // Le périmètre d'écriture est vérifié, même si la garde de route a déjà
    // validé le droit : deuxième des trois niveaux (docs/04 §5).
    this.scope.requireScope(user, 'employee', 'CREATE');

    const employee = await this.prisma.employee.create({
      data: { ...input, createdById: user.id, updatedById: user.id },
    });

    await this.audit.record(
      {
        entity: 'employee',
        entityId: employee.id,
        action: 'CREATE',
        after: { matricule: employee.matricule, name: `${employee.firstName} ${employee.lastName}` },
        companyId: employee.companyId,
      },
      { user, ...ctx },
    );

    return employee;
  }

  async update(
    user: RequestUser,
    id: string,
    input: Partial<CreateEmployeeInput>,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const scopeWhere = this.scope.buildWhere(user, 'employee', 'UPDATE', SCOPE);
    const before = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null, ...scopeWhere },
    });
    if (!before) throw new NotFoundException('Employé introuvable ou hors de votre périmètre.');

    const after = await this.prisma.employee.update({
      where: { id },
      data: { ...input, updatedById: user.id },
    });

    const changes = this.audit.diff(
      before as unknown as Record<string, unknown>,
      after as unknown as Record<string, unknown>,
    );

    await this.audit.record(
      {
        entity: 'employee',
        entityId: id,
        action: 'UPDATE',
        before: changes.before,
        after: changes.after,
        companyId: after.companyId,
      },
      { user, ...ctx },
    );

    return after;
  }
}
