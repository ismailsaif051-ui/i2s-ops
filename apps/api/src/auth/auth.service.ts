import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { AuthTokens, SessionUser } from '@i2s/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { ttlToSeconds } from './ttl';
import { RbacService } from '../rbac/rbac.service';
import { AuditService } from '../audit/audit.service';

const ARGON_OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

/** Verrouillage progressif : au-delà du seuil, le compte se bloque temporairement. */
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export interface ClientContext {
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly rbac: RbacService,
    private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string, ctx: ClientContext): Promise<AuthTokens> {
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase().trim(), deletedAt: null },
    });

    // Message identique dans tous les cas d'échec : on n'indique jamais
    // si l'adresse existe.
    const invalid = () => new UnauthorizedException('Identifiants invalides.');

    if (!user) {
      // Coût constant pour éviter de distinguer un compte inexistant au temps de réponse.
      await hash('inexistant-timing-equalizer', ARGON_OPTIONS);
      throw invalid();
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        `Compte temporairement verrouillé. Réessayez après ${user.lockedUntil.toLocaleTimeString('fr-FR')}.`,
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Compte désactivé. Contactez l’administrateur.');
    }

    const ok = await verify(user.passwordHash, password).catch(() => false);
    if (!ok) {
      const failed = user.failedAttempts + 1;
      const locked = failed >= MAX_FAILED_ATTEMPTS;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: locked ? 0 : failed,
          lockedUntil: locked ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
        },
      });
      await this.audit.record(
        { entity: 'user', entityId: user.id, action: locked ? 'LOGIN_LOCKED' : 'LOGIN_FAILED' },
        { ip: ctx.ip, userAgent: ctx.userAgent },
      );
      throw invalid();
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    await this.audit.record(
      { entity: 'user', entityId: user.id, action: 'LOGIN' },
      { ip: ctx.ip, userAgent: ctx.userAgent },
    );

    return this.issueTokens(user.id, user.email, randomUUID(), ctx);
  }

  /**
   * Rotation du jeton de rafraîchissement : chaque usage révoque le précédent.
   * La réutilisation d'un jeton déjà consommé révoque toute la famille — c'est
   * la signature d'un vol de jeton.
   */
  async refresh(refreshToken: string, ctx: ClientContext): Promise<AuthTokens> {
    const tokenHash = sha256(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) throw new UnauthorizedException('Session invalide.');

    if (stored.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { family: stored.family, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.audit.record(
        { entity: 'user', entityId: stored.userId, action: 'REFRESH_REUSE_DETECTED' },
        { ip: ctx.ip, userAgent: ctx.userAgent },
      );
      throw new UnauthorizedException('Session révoquée. Reconnectez-vous.');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expirée. Reconnectez-vous.');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.userId, stored.user.email, stored.family, ctx);
  }

  async logout(refreshToken: string | undefined, userId: string): Promise<void> {
    if (refreshToken) {
      const stored = await this.prisma.refreshToken.findUnique({
        where: { tokenHash: sha256(refreshToken) },
      });
      if (stored) {
        await this.prisma.refreshToken.updateMany({
          where: { family: stored.family, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        return;
      }
    }
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ctx: ClientContext,
  ): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const ok = await verify(user.passwordHash, currentPassword).catch(() => false);
    if (!ok) throw new BadRequestException('Mot de passe actuel incorrect.');

    const same = await verify(user.passwordHash, newPassword).catch(() => false);
    if (same) throw new BadRequestException('Le nouveau mot de passe doit être différent de l’ancien.');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hash(newPassword, ARGON_OPTIONS),
        mustChangePassword: false,
      },
    });

    // Toute autre session est invalidée.
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.audit.record(
      { entity: 'user', entityId: userId, action: 'PASSWORD_CHANGED' },
      { ip: ctx.ip, userAgent: ctx.userAgent },
    );
  }

  async hashPassword(plain: string): Promise<string> {
    return hash(plain, ARGON_OPTIONS);
  }

  /** Profil complet pour l'interface : rôles, sociétés et droits effectifs. */
  async me(userId: string): Promise<SessionUser> {
    const requestUser = await this.rbac.loadRequestUser(userId);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        employee: { include: { department: { select: { id: true, code: true } } } },
        userRoles: { include: { role: true } },
      },
    });

    const companies = requestUser.companyIds.length
      ? await this.prisma.company.findMany({
          where: { id: { in: requestUser.companyIds } },
          select: { id: true, code: true, name: true },
        })
      : [];

    // Un seul paramètre suffit à déclencher le bandeau : dès qu'une société
    // accessible porte des données de démonstration, l'utilisateur doit le voir.
    const demo = requestUser.companyIds.length
      ? (await this.prisma.setting.count({
          where: {
            companyId: { in: requestUser.companyIds },
            key: 'demo.enabled',
            value: { equals: true },
          },
        })) > 0
      : false;

    return {
      id: user.id,
      email: user.email,
      mustChangePassword: user.mustChangePassword,
      demo,
      employee: user.employee
        ? {
            id: user.employee.id,
            matricule: user.employee.matricule,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            position: user.employee.position,
            departmentId: user.employee.departmentId,
            departmentCode: user.employee.department?.code ?? null,
            isInspector: user.employee.isInspector,
          }
        : null,
      roles: user.userRoles.map((ur) => ({
        code: ur.role.code,
        name: ur.role.name,
        companyId: ur.companyId,
        departmentId: ur.departmentId,
      })),
      companies,
      permissions: requestUser.permissions,
    };
  }

  private async issueTokens(
    userId: string,
    email: string,
    family: string,
    ctx: ClientContext,
  ): Promise<AuthTokens> {
    const accessTtlSeconds = ttlToSeconds(this.config.get<string>('JWT_ACCESS_TTL', '15m'));
    const refreshDays = Number(this.config.get<string>('JWT_REFRESH_TTL_DAYS', '30'));

    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      { expiresIn: accessTtlSeconds },
    );
    const refreshToken = randomBytes(48).toString('base64url');

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: sha256(refreshToken),
        family,
        expiresAt: new Date(Date.now() + refreshDays * 86_400_000),
        ip: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
      },
    });

    return { accessToken, refreshToken, expiresIn: accessTtlSeconds };
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

