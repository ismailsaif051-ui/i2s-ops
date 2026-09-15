import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { CreateUserInput } from '@i2s/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/types';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly audit: AuditService,
  ) {}

  /** Employés et départements du périmètre — pour le formulaire de création. */
  async options(user: RequestUser) {
    const companyId = user.companyIds[0];
    if (!companyId) return { companyId: null, employees: [], departments: [] };

    const [employees, departments] = await Promise.all([
      this.prisma.employee.findMany({
        where: { companyId, deletedAt: null, status: 'ACTIVE', user: null },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        select: { id: true, matricule: true, firstName: true, lastName: true, position: true },
      }),
      this.prisma.department.findMany({
        where: { companyId },
        orderBy: { code: 'asc' },
        select: { id: true, code: true, name: true },
      }),
    ]);

    return {
      companyId,
      employees: employees.map((e) => ({
        id: e.id,
        matricule: e.matricule,
        name: `${e.lastName.toUpperCase()} ${e.firstName}`,
        position: e.position,
      })),
      departments,
    };
  }

  async list(user: RequestUser, query: { limit: number; cursor?: string; q?: string }) {
    const rows = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(query.q ? { email: { contains: query.q, mode: 'insensitive' } } : {}),
        ...(user.permissions.some((p) => p.resource === 'user' && p.scope === 'ALL')
          ? {}
          : { userRoles: { some: { companyId: { in: user.companyIds } } } }),
      },
      orderBy: { email: 'asc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: {
        employee: { select: { id: true, matricule: true, firstName: true, lastName: true } },
        userRoles: { include: { role: { select: { code: true, name: true } } } },
      },
    });

    const hasMore = rows.length > query.limit;
    const items = (hasMore ? rows.slice(0, query.limit) : rows).map((u) => ({
      id: u.id,
      email: u.email,
      status: u.status,
      mustChangePassword: u.mustChangePassword,
      lastLoginAt: u.lastLoginAt,
      employee: u.employee,
      roles: u.userRoles.map((r) => ({
        code: r.role.code,
        name: r.role.name,
        companyId: r.companyId,
        departmentId: r.departmentId,
      })),
    }));

    return { items, nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null };
  }

  /**
   * Crée un compte avec un mot de passe provisoire à usage unique.
   * Le mot de passe n'est renvoyé qu'une fois, à l'administrateur qui crée le
   * compte, et doit être changé à la première connexion.
   */
  async create(
    actor: RequestUser,
    input: CreateUserInput,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const email = input.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Un compte existe déjà avec cette adresse.');

    const roles = await this.prisma.role.findMany({
      where: { code: { in: input.roles.map((r) => r.roleCode) } },
    });
    const roleByCode = new Map(roles.map((r) => [r.code, r.id]));
    for (const r of input.roles) {
      if (!roleByCode.has(r.roleCode)) throw new BadRequestException(`Rôle inconnu : ${r.roleCode}`);
    }

    const temporaryPassword = randomBytes(12).toString('base64url');

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash: await this.auth.hashPassword(temporaryPassword),
          employeeId: input.employeeId ?? null,
          mustChangePassword: true,
        },
      });
      await tx.userRole.createMany({
        data: input.roles.map((r) => ({
          userId: created.id,
          roleId: roleByCode.get(r.roleCode)!,
          companyId: r.companyId ?? null,
          departmentId: r.departmentId ?? null,
        })),
      });
      return created;
    });

    await this.audit.record(
      {
        entity: 'user',
        entityId: user.id,
        action: 'CREATE',
        after: { email, roles: input.roles.map((r) => r.roleCode) },
      },
      { user: actor, ...ctx },
    );

    return { id: user.id, email: user.email, temporaryPassword };
  }

  async setStatus(
    actor: RequestUser,
    id: string,
    status: 'ACTIVE' | 'SUSPENDED',
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    if (id === actor.id) {
      throw new BadRequestException('Vous ne pouvez pas modifier le statut de votre propre compte.');
    }

    const before = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw new NotFoundException('Compte introuvable.');

    const after = await this.prisma.user.update({ where: { id }, data: { status } });

    if (status === 'SUSPENDED') {
      await this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await this.audit.record(
      {
        entity: 'user',
        entityId: id,
        action: 'SET_STATUS',
        before: { status: before.status },
        after: { status: after.status },
      },
      { user: actor, ...ctx },
    );

    return { id: after.id, status: after.status };
  }

  async roles() {
    return this.prisma.role.findMany({
      orderBy: { rank: 'asc' },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    });
  }
}
