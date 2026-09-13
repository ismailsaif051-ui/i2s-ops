import { Body, Controller, Get, Module, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { z } from 'zod';
import {
  AssetsService,
  assetCreateSchema,
  assetUpdateSchema,
  startOfDay,
} from './assets.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

const listSchema = z.object({
  clientId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
  q: z.string().trim().max(120).optional(),
  /** `late` : contrôle réglementaire échu. `due` : échéance sous 60 jours. */
  state: z.enum(['late', 'due', 'ok']).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(300),
});

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

@ApiTags('Équipements clients')
@Controller('assets')
class AssetsController {
  constructor(
    private readonly assets: AssetsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @RequirePermission('asset', 'VIEW')
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(listSchema)) query: z.infer<typeof listSchema>,
  ) {
    const rows = await this.prisma.asset.findMany({
      where: {
        deletedAt: null,
        client: { companyId: { in: user.companyIds } },
        ...(query.clientId ? { clientId: query.clientId } : {}),
        ...(query.siteId ? { siteId: query.siteId } : {}),
        ...(query.q
          ? {
              OR: [
                { tag: { contains: query.q, mode: 'insensitive' as const } },
                { type: { contains: query.q, mode: 'insensitive' as const } },
                { serialNumber: { contains: query.q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: [{ nextInspectionDue: 'asc' }, { tag: 'asc' }],
      take: query.limit,
      include: {
        client: { select: { id: true, name: true } },
        site: { select: { name: true, city: true } },
        _count: { select: { inspections: true, nonConformities: true } },
      },
    });

    const today = startOfDay(new Date());
    const in60Days = new Date(today.getTime() + 60 * 86_400_000);

    const items = rows.map((a) => {
      const due = a.nextInspectionDue ? startOfDay(a.nextInspectionDue) : null;

      return {
        id: a.id,
        tag: a.tag,
        type: a.type,
        designation: [a.brand, a.model].filter(Boolean).join(' ') || null,
        serialNumber: a.serialNumber,
        client: a.client.name,
        clientId: a.client.id,
        site: a.site?.name ?? null,
        city: a.site?.city ?? null,
        commissioningDate: a.commissioningDate,
        inspectionIntervalM: a.inspectionIntervalM,
        regulatoryRef: a.regulatoryRef,
        nextInspectionDue: a.nextInspectionDue,
        inspections: a._count.inspections,
        openIssues: a._count.nonConformities,
        /** Contrôle réglementaire échu : l'équipement n'est plus couvert. */
        late: due !== null && due < today,
        dueSoon: due !== null && due >= today && due <= in60Days,
        daysLeft:
          due === null ? null : Math.round((due.getTime() - today.getTime()) / 86_400_000),
      };
    });

    const filtered = query.state
      ? items.filter((a) =>
          query.state === 'late' ? a.late : query.state === 'due' ? a.dueSoon : !a.late,
        )
      : items;

    return {
      items: filtered,
      totals: {
        all: items.length,
        late: items.filter((a) => a.late).length,
        dueSoon: items.filter((a) => a.dueSoon).length,
        withoutSchedule: items.filter((a) => a.nextInspectionDue === null).length,
        clients: new Set(items.map((a) => a.clientId)).size,
      },
    };
  }

  @Get(':id')
  @RequirePermission('asset', 'VIEW')
  async detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const asset = await this.assets.get(user, id);

    const [inspections, issues] = await Promise.all([
      this.prisma.inspection.findMany({
        where: { assetId: id },
        orderBy: { date: 'desc' },
        take: 20,
        select: {
          id: true,
          date: true,
          status: true,
          template: { select: { formCode: true, title: true } },
          mission: { select: { number: true } },
          report: { select: { number: true, status: true, issuedAt: true } },
        },
      }),
      this.prisma.nonConformity.findMany({
        where: { assetId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, number: true, description: true, severity: true, status: true, dueDate: true },
      }),
    ]);

    const today = startOfDay(new Date());
    const due = asset.nextInspectionDue ? startOfDay(asset.nextInspectionDue) : null;

    return {
      id: asset.id,
      tag: asset.tag,
      type: asset.type,
      brand: asset.brand,
      model: asset.model,
      serialNumber: asset.serialNumber,
      client: asset.client,
      site: asset.site,
      commissioningDate: asset.commissioningDate,
      inspectionIntervalM: asset.inspectionIntervalM,
      regulatoryRef: asset.regulatoryRef,
      nextInspectionDue: asset.nextInspectionDue,
      late: due !== null && due < today,
      daysLeft: due === null ? null : Math.round((due.getTime() - today.getTime()) / 86_400_000),
      inspections: inspections.map((i) => ({
        id: i.id,
        date: i.date,
        status: i.status,
        formCode: i.template.formCode,
        title: i.template.title,
        mission: i.mission.number,
        report: i.report?.number ?? null,
        reportStatus: i.report?.status ?? null,
        issuedAt: i.report?.issuedAt ?? null,
      })),
      issues: issues.map((n) => ({
        id: n.id,
        number: n.number,
        description: n.description,
        severity: n.severity,
        status: n.status,
        dueDate: n.dueDate,
        open: n.status !== 'CLOSED',
      })),
    };
  }

  @Post()
  @RequirePermission('asset', 'CREATE')
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(assetCreateSchema)) body: z.infer<typeof assetCreateSchema>,
    @Req() req: Request,
  ) {
    return this.assets.create(user, body, ctx(req));
  }

  @Patch(':id')
  @RequirePermission('asset', 'UPDATE')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(assetUpdateSchema)) body: z.infer<typeof assetUpdateSchema>,
    @Req() req: Request,
  ) {
    return this.assets.update(user, id, body, ctx(req));
  }
}

@Module({
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
