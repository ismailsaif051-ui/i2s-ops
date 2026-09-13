import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { ERROR_CODES } from '@i2s/contracts';
import { PasswordChangeGuard, normalizeRoutePath } from './password-change.guard';

/**
 * Regression : le prefixe global (`api`) et la version d'URI (`v1`) font partie
 * du chemin Express. Comparee telle quelle, la liste blanche ne correspondait
 * jamais — et un compte a mot de passe provisoire ne pouvait meme plus
 * atteindre l'endpoint de changement de mot de passe.
 */
describe('normalizeRoutePath', () => {
  it('retire le prefixe global et la version', () => {
    expect(normalizeRoutePath('/api/v1/auth/change-password')).toBe('/auth/change-password');
    expect(normalizeRoutePath('/api/v12/auth/logout')).toBe('/auth/logout');
  });

  it('laisse intact un chemin deja nu', () => {
    expect(normalizeRoutePath('/auth/me')).toBe('/auth/me');
  });

  it('ne confond pas un segment qui commence par « v » avec une version', () => {
    expect(normalizeRoutePath('/api/version-history')).toBe('/version-history');
  });
});

class FakeController {}
function fakeHandler() {}

function contextFor(method: string, path: string, mustChangePassword: boolean) {
  const request = { method, path, route: { path }, user: { mustChangePassword } };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    // Reflector lit les métadonnées sur ces cibles : elles doivent être réelles.
    getHandler: () => fakeHandler,
    getClass: () => FakeController,
  } as never;
}

describe('PasswordChangeGuard', () => {
  const guard = new PasswordChangeGuard(new Reflector());

  it('laisse passer le changement de mot de passe malgre le prefixe', () => {
    expect(guard.canActivate(contextFor('POST', '/api/v1/auth/change-password', true))).toBe(true);
    expect(guard.canActivate(contextFor('GET', '/api/v1/auth/me', true))).toBe(true);
  });

  it('bloque toute autre route et annonce un code exploitable par le front', () => {
    try {
      guard.canActivate(contextFor('GET', '/api/v1/inspections', true));
      expect.unreachable('la route aurait du etre refusee');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      const body = (error as ForbiddenException).getResponse() as { code?: string };
      expect(body.code).toBe(ERROR_CODES.PASSWORD_CHANGE_REQUIRED);
    }
  });

  it('ne gene pas un compte dont le mot de passe est definitif', () => {
    expect(guard.canActivate(contextFor('GET', '/api/v1/inspections', false))).toBe(true);
  });
});
