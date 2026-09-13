import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';
import type { RequestUser } from '../common/types';

export interface StoreInput {
  companyId: string;
  type: string;
  fileName: string;
  mimeType: string;
  content: Buffer;
  extension: string;
  /** Objet auquel le document se rattache — un rapport, une affaire, un OM. */
  entityType?: string | null;
  entityId?: string | null;
  affairId?: string | null;
  departmentId?: string | null;
  qmsCode?: string | null;
  version?: string | null;
  tags?: string[];
  confidentiality?: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED' | 'CONFIDENTIAL';
  comment?: string | null;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  /* ── Dépôt ────────────────────────────────────────────────────── */

  /**
   * Range un fichier et l'enregistre à la GED.
   *
   * Un document déjà présent pour le même objet n'est pas dupliqué : une
   * nouvelle version lui est ajoutée. C'est ce qui permet de rééditer le PDF
   * d'un rapport révisé sans perdre la trace de ce qui a été remis avant.
   */
  async store(user: RequestUser | null, input: StoreInput) {
    const stored = await this.storage.put(input.content, input.extension);

    const existing =
      input.entityType && input.entityId
        ? await this.prisma.document.findFirst({
            where: {
              entityType: input.entityType,
              entityId: input.entityId,
              type: input.type,
              deletedAt: null,
            },
            include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
          })
        : null;

    const document = existing
      ? await this.prisma.document.update({
          where: { id: existing.id },
          data: {
            fileName: input.fileName,
            mimeType: input.mimeType,
            size: stored.size,
            sha256: stored.sha256,
            storageKey: stored.storageKey,
            versions: {
              create: {
                version: (existing.versions[0]?.version ?? 0) + 1,
                storageKey: stored.storageKey,
                sha256: stored.sha256,
                size: stored.size,
                comment: input.comment ?? null,
                createdById: user?.employeeId ?? null,
              },
            },
          },
        })
      : await this.prisma.document.create({
          data: {
            companyId: input.companyId,
            type: input.type,
            qmsCode: input.qmsCode ?? null,
            version: input.version ?? null,
            fileName: input.fileName,
            mimeType: input.mimeType,
            size: stored.size,
            sha256: stored.sha256,
            storageKey: stored.storageKey,
            entityType: input.entityType ?? null,
            entityId: input.entityId ?? null,
            affairId: input.affairId ?? null,
            departmentId: input.departmentId ?? null,
            year: new Date().getFullYear(),
            tags: input.tags ?? [],
            confidentiality: input.confidentiality ?? 'INTERNAL',
            uploadedById: user?.employeeId ?? null,
            versions: {
              create: {
                version: 1,
                storageKey: stored.storageKey,
                sha256: stored.sha256,
                size: stored.size,
                comment: input.comment ?? null,
                createdById: user?.employeeId ?? null,
              },
            },
          },
        });

    await this.audit.record(
      {
        entity: 'document',
        entityId: document.id,
        action: existing ? 'NEW_VERSION' : 'CREATE',
        after: {
          fileName: document.fileName,
          type: document.type,
          sha256: stored.sha256,
          size: stored.size,
        },
        companyId: input.companyId,
      },
      { user },
    );

    return document;
  }

  /* ── Lecture ──────────────────────────────────────────────────── */

  async get(user: RequestUser, id: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, deletedAt: null, companyId: { in: user.companyIds } },
      include: { versions: { orderBy: { version: 'desc' } } },
    });

    if (!document) throw new NotFoundException('Document introuvable.');
    return document;
  }

  /**
   * Sert le contenu d'un document, et enregistre qui l'a consulté.
   *
   * La trace de téléchargement n'est pas un détail : sur un rapport remis à un
   * client, savoir qui a sorti quelle version et quand fait partie de ce que
   * le système qualité demande.
   */
  async download(user: RequestUser, id: string) {
    const document = await this.get(user, id);

    if (document.confidentiality === 'CONFIDENTIAL') {
      const granted = await this.prisma.documentAccess.findFirst({
        where: { documentId: id, userId: user.id },
      });
      const isAdmin = user.roleCodes.includes('ADMIN');
      if (!granted && !isAdmin) {
        throw new ForbiddenException('Ce document est confidentiel : accès non accordé.');
      }
    }

    const content = await this.storage.get(document.storageKey, document.sha256);

    await this.audit.record(
      {
        entity: 'document',
        entityId: id,
        action: 'DOWNLOAD',
        after: { fileName: document.fileName, sha256: document.sha256 },
        companyId: document.companyId,
      },
      { user },
    );

    return { document, content };
  }

  /* ── Liste ────────────────────────────────────────────────────── */

  async list(
    user: RequestUser,
    filters: { type?: string; affairId?: string; q?: string; limit: number },
  ) {
    const rows = await this.prisma.document.findMany({
      where: {
        deletedAt: null,
        companyId: { in: user.companyIds },
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.affairId ? { affairId: filters.affairId } : {}),
        ...(filters.q
          ? { fileName: { contains: filters.q, mode: 'insensitive' as const } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit,
      include: {
        affair: { select: { number: true, client: { select: { name: true } } } },
        _count: { select: { versions: true } },
      },
    });

    return rows;
  }
}
