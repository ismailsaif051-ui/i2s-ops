import { ForbiddenException, Injectable } from '@nestjs/common';
import { resolveScope, type Action, type Resource, type Scope } from '@i2s/contracts';
import type { RequestUser, ScopeDescriptor } from '../common/types';

/**
 * Traduit un périmètre RBAC en clause `where` Prisma.
 *
 * Règle de conception : le périmètre est appliqué DANS LA REQUÊTE, pas dans
 * l'interface. Un inspecteur qui forgerait un appel d'API ne verra toujours
 * que ses propres objets (docs/04-RBAC.md §5).
 */
@Injectable()
export class ScopeService {
  /** Périmètre le plus large détenu par l'utilisateur, ou refus. */
  requireScope(user: RequestUser, resource: Resource, action: Action): Scope {
    const scope = resolveScope(user.permissions, resource, action);
    if (!scope) {
      throw new ForbiddenException(
        `Droit manquant : ${action} sur ${resource}.`,
      );
    }
    return scope;
  }

  /**
   * Construit la clause de restriction. Un chemin absent pour le périmètre
   * demandé provoque un refus — jamais un `where` vide, qui exposerait tout.
   */
  buildWhere(
    user: RequestUser,
    resource: Resource,
    action: Action,
    descriptor: ScopeDescriptor,
  ): Record<string, unknown> {
    const scope = this.requireScope(user, resource, action);

    switch (scope) {
      case 'ALL':
        return {};

      case 'COMPANY':
        return this.pathIn(descriptor.companyPath, user.companyIds, resource, scope);

      case 'DEPARTMENT': {
        if (user.departmentIds.length === 0) {
          throw new ForbiddenException(
            `Aucun département rattaché à votre habilitation pour ${resource}.`,
          );
        }
        return this.pathIn(descriptor.departmentPath, user.departmentIds, resource, scope);
      }

      case 'TEAM': {
        const ids = [...user.teamEmployeeIds];
        if (user.employeeId) ids.push(user.employeeId);
        return this.pathIn(descriptor.teamPath ?? descriptor.ownerPath, ids, resource, scope);
      }

      case 'OWN': {
        if (!user.employeeId) {
          throw new ForbiddenException(
            "Votre compte n'est rattaché à aucun employé : périmètre personnel impossible.",
          );
        }
        return this.pathIn(descriptor.ownerPath, [user.employeeId], resource, scope);
      }
    }
  }

  private pathIn(
    path: string | undefined,
    values: string[],
    resource: Resource,
    scope: Scope,
  ): Record<string, unknown> {
    if (!path) {
      throw new ForbiddenException(
        `Périmètre ${scope} non applicable à la ressource ${resource}.`,
      );
    }
    if (values.length === 0) {
      // Aucune valeur = aucun résultat, pas « tous les résultats ».
      return this.nest(path, { in: [] });
    }
    return this.nest(path, { in: values });
  }

  /** `affair.companyId` → `{ affair: { companyId: <filter> } }` */
  private nest(path: string, filter: unknown): Record<string, unknown> {
    const segments = path.split('.');
    return segments.reduceRight<Record<string, unknown>>(
      (acc, key, index) =>
        index === segments.length - 1 ? { [key]: filter } : { [key]: acc },
      {},
    );
  }
}
