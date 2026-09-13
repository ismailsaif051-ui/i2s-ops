import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/types';

export const assetCreateSchema = z.object({
  clientId: z.string().uuid(),
  siteId: z.string().uuid().nullable().optional(),
  tag: z.string().trim().min(1, 'Le repère de l’équipement est obligatoire.').max(60),
  type: z.string().trim().max(120).nullable().optional(),
  brand: z.string().trim().max(80).nullable().optional(),
  model: z.string().trim().max(80).nullable().optional(),
  serialNumber: z.string().trim().max(80).nullable().optional(),
  commissioningDate: z.coerce.date().nullable().optional(),
  inspectionIntervalM: z.coerce.number().int().min(1).max(120).nullable().optional(),
  regulatoryRef: z.string().trim().max(160).nullable().optional(),
  nextInspectionDue: z.coerce.date().nullable().optional(),
});

export const assetUpdateSchema = assetCreateSchema.partial().omit({ clientId: true });

export function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

/**
 * Parc d'équipements des clients.
 *
 * C'est ce qu'I2S inspecte : bacs, ponts roulants, circuits de tuyauterie,
 * installations électriques. Chaque équipement porte la périodicité que la
 * réglementation lui impose — et c'est cette échéance qui fait revenir
 * l'inspection l'année suivante.
 */
@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async get(user: RequestUser, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, deletedAt: null, client: { companyId: { in: user.companyIds } } },
      include: {
        client: { select: { id: true, name: true, code: true } },
        site: { select: { id: true, name: true, city: true } },
      },
    });

    if (!asset) throw new NotFoundException('Équipement introuvable.');
    return asset;
  }

  /**
   * Reporte l'échéance réglementaire après une inspection.
   *
   * Appelé à l'émission du rapport : c'est la pièce remise qui atteste du
   * contrôle, pas la saisie. Sans périodicité connue, rien n'est reporté —
   * mieux vaut une échéance vide qu'une échéance inventée.
   */
  async recordInspection(assetId: string, inspectionDate: Date): Promise<Date | null> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true, inspectionIntervalM: true, nextInspectionDue: true },
    });
    if (!asset?.inspectionIntervalM) return null;

    const next = startOfDay(addMonths(startOfDay(inspectionDate), asset.inspectionIntervalM));

    // L'échéance n'avance jamais à reculons : un rapport émis en retard ne
    // raccourcit pas le délai déjà acquis.
    if (asset.nextInspectionDue && startOfDay(asset.nextInspectionDue) > next) {
      return asset.nextInspectionDue;
    }

    await this.prisma.asset.update({ where: { id: assetId }, data: { nextInspectionDue: next } });
    return next;
  }

  async create(
    user: RequestUser,
    input: z.infer<typeof assetCreateSchema>,
    context: { ip?: string | null; userAgent?: string | null },
  ) {
    const client = await this.prisma.client.findFirst({
      where: { id: input.clientId, deletedAt: null, companyId: { in: user.companyIds } },
      select: { id: true, companyId: true, name: true },
    });
    if (!client) throw new BadRequestException('Client introuvable.');

    const existing = await this.prisma.asset.findFirst({
      where: { clientId: client.id, tag: input.tag.trim(), deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException(
        `Le repère ${input.tag} est déjà porté par un équipement de ${client.name}.`,
      );
    }

    if (input.siteId) {
      const site = await this.prisma.site.findFirst({
        where: { id: input.siteId, project: { affair: { clientId: client.id } } },
        select: { id: true },
      });
      if (!site) {
        throw new BadRequestException('Ce site n’appartient pas à ce client.');
      }
    }

    // À défaut d'échéance saisie, la périodicité la calcule depuis la mise en
    // service : c'est ce que dit la réglementation.
    const nextInspectionDue =
      input.nextInspectionDue ??
      (input.inspectionIntervalM && input.commissioningDate
        ? addMonths(startOfDay(input.commissioningDate), input.inspectionIntervalM)
        : null);

    const asset = await this.prisma.asset.create({
      data: {
        clientId: client.id,
        siteId: input.siteId ?? null,
        tag: input.tag.trim(),
        type: input.type?.trim() || null,
        brand: input.brand?.trim() || null,
        model: input.model?.trim() || null,
        serialNumber: input.serialNumber?.trim() || null,
        commissioningDate: input.commissioningDate ?? null,
        inspectionIntervalM: input.inspectionIntervalM ?? null,
        regulatoryRef: input.regulatoryRef?.trim() || null,
        nextInspectionDue,
      },
    });

    await this.audit.record(
      {
        entity: 'asset',
        entityId: asset.id,
        action: 'CREATE',
        after: { tag: asset.tag, client: client.name, type: asset.type },
        companyId: client.companyId,
      },
      { user, ...context },
    );

    return asset;
  }

  async update(
    user: RequestUser,
    id: string,
    input: z.infer<typeof assetUpdateSchema>,
    context: { ip?: string | null; userAgent?: string | null },
  ) {
    const asset = await this.get(user, id);

    if (input.siteId) {
      const site = await this.prisma.site.findFirst({
        where: { id: input.siteId, project: { affair: { clientId: asset.clientId } } },
        select: { id: true },
      });
      if (!site) throw new BadRequestException('Ce site n’appartient pas à ce client.');
    }

    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        ...input,
        tag: input.tag?.trim(),
        type: input.type?.trim() || undefined,
      },
    });

    await this.audit.record(
      {
        entity: 'asset',
        entityId: id,
        action: 'UPDATE',
        before: { tag: asset.tag, nextInspectionDue: asset.nextInspectionDue },
        after: { tag: updated.tag, nextInspectionDue: updated.nextInspectionDue },
      },
      { user, ...context },
    );

    return updated;
  }
}
