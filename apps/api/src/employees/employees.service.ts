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
