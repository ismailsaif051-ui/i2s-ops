import { Body, Controller, Get, Module, Param, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { z } from 'zod';
import { SEVERITIES, NonConformitiesService } from './non-conformities.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

const listSchema = z.object({
  status: z.string().trim().max(30).optional(),
  severity: z.enum(SEVERITIES).optional(),
  /** `late` ne garde que les écarts dont l'échéance est passée. */
  state: z.enum(['open', 'late', 'due', 'closed']).optional(),
  limit: z.coerce.number().int().min(1).max(300).default(200),
});

const openSchema = z.object({
  description: z.string().trim().min(5, 'Décrivez l’écart constaté.').max(2000),
  severity: z.enum(SEVERITIES),
  affairId: z.string().uuid().nullable().optional(),
  assetId: z.string().uuid().nullable().optional(),
  findingId: z.string().uuid().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

const assignSchema = z.object({
  ownerId: z.string().uuid(),
  dueDate: z.coerce.date().nullable().optional(),
});

const evidenceSchema = z.object({
  correctiveAction: z.string().trim().min(5, 'Décrivez l’action corrective menée.').max(2000),
  evidence: z
    .object({
      fileName: z.string().trim().min(1).max(200),
      contentBase64: z.string().max(11_000_000),
    })
    .nullable()
    .optional(),
});

const verifySchema = z.object({
  decision: z.enum(['CLOSE', 'REJECT']),
  comment: z.string().trim().max(1000).nullable().optional(),
});

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

@ApiTags('Non-conformités')
@Controller('non-conformities')
class NonConformitiesController {
  constructor(
    private readonly ncs: NonConformitiesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @RequirePermission('non_conformity', 'VIEW')
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(listSchema)) query: z.infer<typeof listSchema>,
  ) {
    const rows = await this.prisma.nonConformity.findMany({
      where: {
        ...(query.status ? { status: query.status as never } : {}),
        ...(query.severity ? { severity: query.severity } : {}),
        OR: [{ affair: { companyId: { in: user.companyIds } } }, { affairId: null }],
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
      take: query.limit,
      include: {
        affair: { select: { number: true, client: { select: { name: true } } } },
        asset: { select: { tag: true, type: true, brand: true, model: true } },
        owner: { select: { firstName: true, lastName: true } },
      },
    });

    const today = startOfDay(new Date());
    const in7Days = new Date(today.getTime() + 7 * 86_400_000);

    const items = rows.map((nc) => {
      const due = nc.dueDate ? startOfDay(nc.dueDate) : null;
      const closed = nc.status === 'CLOSED';

      return {
        id: nc.id,
        number: nc.number,
        description: nc.description,
        severity: nc.severity,
        status: nc.status,
        affair: nc.affair?.number ?? null,
        client: nc.affair?.client.name ?? null,
        asset: nc.asset ? `${nc.asset.tag}${nc.asset.type ? ` — ${nc.asset.type}` : ''}` : null,
        owner: nc.owner ? `${nc.owner.lastName.toUpperCase()} ${nc.owner.firstName}` : null,
        dueDate: nc.dueDate,
        closedAt: nc.closedAt,
        /** Un écart dont l'échéance est passée sans être clos. */
        late: !closed && due !== null && due < today,
        dueSoon: !closed && due !== null && due >= today && due <= in7Days,
        daysLeft:
          due === null ? null : Math.round((due.getTime() - today.getTime()) / 86_400_000),
      };
    });

    const filtered = query.state
      ? items.filter((nc) =>
          query.state === 'late'
            ? nc.late
            : query.state === 'due'
              ? nc.dueSoon
              : query.state === 'closed'
                ? nc.status === 'CLOSED'
                : nc.status !== 'CLOSED',
        )
      : items;

    return {
      items: filtered,
      totals: {
        all: items.length,
        open: items.filter((nc) => nc.status !== 'CLOSED').length,
        late: items.filter((nc) => nc.late).length,
        dueSoon: items.filter((nc) => nc.dueSoon).length,
        critical: items.filter((nc) => nc.severity === 'CRITICAL' && nc.status !== 'CLOSED').length,
      },
    };
  }

  @Get(':id')
  @RequirePermission('non_conformity', 'VIEW')
  async detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const nc = await this.ncs.get(user, id);

    const today = startOfDay(new Date());
    const due = nc.dueDate ? startOfDay(nc.dueDate) : null;
    const isOwner = nc.ownerId !== null && nc.ownerId === user.employeeId;
    const canApprove = user.permissions.some(
      (p) => p.resource === 'non_conformity' && p.action === 'APPROVE',
    );
    const canUpdate = user.permissions.some(
      (p) => p.resource === 'non_conformity' && p.action === 'UPDATE',
    );

    return {
      id: nc.id,
      number: nc.number,
      description: nc.description,
      severity: nc.severity,
      status: nc.status,
      dueDate: nc.dueDate,
      daysLeft: due === null ? null : Math.round((due.getTime() - today.getTime()) / 86_400_000),
      late: nc.status !== 'CLOSED' && due !== null && due < today,
      correctiveAction: nc.correctiveAction,
      verificationComment: nc.verificationComment,
      hasEvidence: nc.evidenceDocumentId !== null,
      affair: nc.affair
        ? { id: nc.affair.id, number: nc.affair.number, title: nc.affair.title, client: nc.affair.client.name }
        : null,
      asset: nc.asset
        ? {
            tag: nc.asset.tag,
            designation: [nc.asset.type, nc.asset.brand, nc.asset.model]
              .filter(Boolean)
              .join(' ') || null,
          }
        : null,
      owner: nc.owner
        ? {
            id: nc.owner.id,
            matricule: nc.owner.matricule,
            name: `${nc.owner.lastName.toUpperCase()} ${nc.owner.firstName}`,
          }
        : null,
      openedBy: nc.openedBy
        ? `${nc.openedBy.lastName.toUpperCase()} ${nc.openedBy.firstName}`
        : null,
      closedBy: nc.closedBy
        ? `${nc.closedBy.lastName.toUpperCase()} ${nc.closedBy.firstName}`
        : null,
      closedAt: nc.closedAt,
      origin: nc.finding
        ? {
            reference: nc.finding.reference,
            comment: nc.finding.comment,
            mission: nc.finding.inspection.mission.number,
            report: nc.finding.inspection.report?.number ?? null,
            date: nc.finding.inspection.date,
          }
        : null,
      /**
       * Gestes ouverts. Le vérificateur n'est jamais le responsable : une levée
       * que personne d'autre n'a regardée ne vaut rien devant un auditeur.
       */
      actions: {
        assign: canUpdate && nc.status !== 'CLOSED',
        start: (isOwner || canApprove) && ['OPEN', 'ASSIGNED'].includes(nc.status),
        evidence: (isOwner || canApprove) && ['ASSIGNED', 'IN_PROGRESS'].includes(nc.status),
        verify: canApprove && nc.status === 'EVIDENCE_PROVIDED' && !isOwner,
      },
    };
  }

  @Post()
  @RequirePermission('non_conformity', 'CREATE')
  open(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(openSchema)) body: z.infer<typeof openSchema>,
    @Req() req: Request,
  ) {
    return this.ncs.open(user, body, ctx(req));
  }

  @Post(':id/assign')
  @RequirePermission('non_conformity', 'UPDATE')
  assign(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(assignSchema)) body: z.infer<typeof assignSchema>,
    @Req() req: Request,
  ) {
    return this.ncs.assign(user, id, body, ctx(req));
  }

  @Post(':id/start')
  @RequirePermission('non_conformity', 'UPDATE')
  start(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.ncs.start(user, id, ctx(req));
  }

  @Post(':id/evidence')
  @RequirePermission('non_conformity', 'UPDATE')
  evidence(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(evidenceSchema)) body: z.infer<typeof evidenceSchema>,
    @Req() req: Request,
  ) {
    return this.ncs.provideEvidence(user, id, body, ctx(req));
  }

  @Post(':id/verify')
  @RequirePermission('non_conformity', 'APPROVE')
  verify(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(verifySchema)) body: z.infer<typeof verifySchema>,
    @Req() req: Request,
  ) {
    return this.ncs.verify(user, id, body, ctx(req));
  }
}

@Module({
  controllers: [NonConformitiesController],
  providers: [NonConformitiesService],
  exports: [NonConformitiesService],
})
export class NonConformitiesModule {}
