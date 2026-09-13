import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/types';

export interface AuditEntry {
  entity: string;
  entityId?: string | null;
  action: string;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
  companyId?: string | null;
}

export interface AuditContext {
  user?: RequestUser | null;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Journal en ajout seul. Aucune route ne permet de modifier ou supprimer une
 * entrée — c'est l'exigence de traçabilité du CDC (module 24).
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry, context: AuditContext = {}): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          entity: entry.entity,
          entityId: entry.entityId ?? null,
          action: entry.action,
          before: (entry.before ?? undefined) as never,
          after: (entry.after ?? undefined) as never,
          reason: entry.reason ?? null,
          companyId: entry.companyId ?? context.user?.companyIds[0] ?? null,
          userId: context.user?.id ?? null,
          userEmail: context.user?.email ?? null,
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
        },
      });
    } catch (error) {
      // Un échec d'audit ne doit pas faire échouer l'opération métier,
      // mais il doit être visible en supervision.
      this.logger.error(
        `Écriture d'audit impossible (${entry.entity}/${entry.action})`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /** Différence champ à champ, pour un journal lisible. */
  diff<T extends Record<string, unknown>>(
    before: T | null,
    after: T | null,
    ignore: string[] = ['updatedAt', 'createdAt'],
  ): { before: Record<string, unknown>; after: Record<string, unknown> } {
    const b: Record<string, unknown> = {};
    const a: Record<string, unknown> = {};
    const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
    for (const key of keys) {
      if (ignore.includes(key)) continue;
      const bv = before?.[key];
      const av = after?.[key];
      if (JSON.stringify(bv) !== JSON.stringify(av)) {
        b[key] = bv ?? null;
        a[key] = av ?? null;
      }
    }
    return { before: b, after: a };
  }
}
