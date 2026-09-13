import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Action, Resource, Scope } from '@i2s/contracts';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/types';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Résout l'identité complète d'un utilisateur : rôles, périmètres, droits
   * effectifs et équipe. Appelé à chaque requête authentifiée.
   */
  async loadRequestUser(userId: string): Promise<RequestUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        employee: { select: { id: true, departmentId: true, companyId: true } },
        userRoles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Compte inactif ou introuvable.');
    }

    const companyIds = new Set<string>();
    const departmentIds = new Set<string>();
    const roleCodes: string[] = [];
    const permissions = new Map<string, { resource: Resource; action: Action; scope: Scope }>();

    if (user.employee?.companyId) companyIds.add(user.employee.companyId);
    if (user.employee?.departmentId) departmentIds.add(user.employee.departmentId);

    for (const ur of user.userRoles) {
      roleCodes.push(ur.role.code);
      if (ur.companyId) companyIds.add(ur.companyId);
      if (ur.departmentId) departmentIds.add(ur.departmentId);

      for (const rp of ur.role.permissions) {
        const key = `${rp.permission.resource}:${rp.permission.action}`;
        const existing = permissions.get(key);
        // On conserve le périmètre le plus large en cas de cumul de rôles.
        if (!existing || RANK[rp.scope] < RANK[existing.scope]) {
          permissions.set(key, {
            resource: rp.permission.resource as Resource,
            action: rp.permission.action as Action,
            scope: rp.scope as Scope,
          });
        }
      }
    }

    // Départements dont l'utilisateur est le chef déclaré.
    if (user.employee) {
      const managed = await this.prisma.department.findMany({
        where: { managerId: user.employee.id, deletedAt: null },
        select: { id: true },
      });
      for (const d of managed) departmentIds.add(d.id);
    }

    // Périmètre TEAM : les employés dont l'utilisateur est le manager direct.
    const teamEmployeeIds = user.employee
      ? (
          await this.prisma.employee.findMany({
            where: { managerId: user.employee.id, deletedAt: null },
            select: { id: true },
          })
        ).map((e) => e.id)
      : [];

    return {
      id: user.id,
      email: user.email,
      employeeId: user.employee?.id ?? null,
      companyIds: [...companyIds],
      departmentIds: [...departmentIds],
      teamEmployeeIds,
      roleCodes,
      permissions: [...permissions.values()],
      mustChangePassword: user.mustChangePassword,
    };
  }
}

const RANK: Record<string, number> = {
  ALL: 0,
  COMPANY: 1,
  DEPARTMENT: 2,
  TEAM: 3,
  OWN: 4,
};
