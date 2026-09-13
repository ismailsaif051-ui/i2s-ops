import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { can } from '@i2s/contracts';
import { PERMISSION_KEY, PUBLIC_KEY, type RequiredPermission } from '../decorators';
import type { RequestUser } from '../types';

/**
 * Premier des trois niveaux de contrôle (route → service → requête).
 * Voir docs/04-RBAC.md §5.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<RequiredPermission | undefined>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const user = context.switchToHttp().getRequest<{ user?: RequestUser }>().user;
    if (!user) throw new ForbiddenException('Utilisateur non résolu.');

    if (!can(user.permissions, required.resource, required.action)) {
      throw new ForbiddenException(
        `Droit manquant : ${required.action} sur ${required.resource}.`,
      );
    }
    return true;
  }
}
