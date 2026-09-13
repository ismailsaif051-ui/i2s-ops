import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Action, Resource } from '@i2s/contracts';
import type { RequestUser } from '../types';

export const PUBLIC_KEY = 'i2s:public';
export const PERMISSION_KEY = 'i2s:permission';
export const AUDIT_KEY = 'i2s:audit';

/** Route accessible sans jeton (login, refresh, santé). */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

export interface RequiredPermission {
  resource: Resource;
  action: Action;
}

/** Droit exigé pour appeler la route. Vérifié par `PermissionsGuard`. */
export const RequirePermission = (resource: Resource, action: Action) =>
  SetMetadata(PERMISSION_KEY, { resource, action } satisfies RequiredPermission);

export interface AuditMeta {
  entity: string;
  action: string;
}

/** Journalise l'appel dans `audit_logs`. Voir docs/05 — toute action est historisée. */
export const Audited = (entity: string, action: string) =>
  SetMetadata(AUDIT_KEY, { entity, action } satisfies AuditMeta);

export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
