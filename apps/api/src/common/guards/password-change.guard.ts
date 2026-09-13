import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ERROR_CODES } from '@i2s/contracts';
import { PUBLIC_KEY } from '../decorators';
import type { RequestUser } from '../types';

/** Routes accessibles tant que le mot de passe initial n’a pas été changé. */
const ALLOWED_WHILE_PENDING = [
  'GET /auth/me',
  'POST /auth/change-password',
  'POST /auth/logout',
  'POST /auth/refresh',
];

/**
 * Le chemin Express réel porte le préfixe global et la version : /api/v1/auth/me.
 * On les retire avant comparaison, sinon la liste blanche ne correspond jamais
 * et un compte à mot de passe provisoire ne peut même plus atteindre
 * l'endpoint de changement de mot de passe.
 */
export function normalizeRoutePath(path: string): string {
  return path
    .replace(/^\/api(?=\/|$)/, '')
    .replace(/^\/v\d+(?=\/|$)/, '')
    .replace(/\/+$/, '') || '/';
}

@Injectable()
export class PasswordChangeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const user = request.user;
    if (!user?.mustChangePassword) return true;

    const rawPath = (request.route as { path?: string })?.path ?? request.path;
    const route = `${request.method} ${normalizeRoutePath(rawPath)}`;
    if (ALLOWED_WHILE_PENDING.includes(route)) return true;

    throw new ForbiddenException({
      statusCode: 403,
      error: 'Forbidden',
      code: ERROR_CODES.PASSWORD_CHANGE_REQUIRED,
      message: 'Vous devez définir un nouveau mot de passe avant d’utiliser l’application.',
    });
  }
}
