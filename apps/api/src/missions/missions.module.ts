import { Body, Controller, Get, Module, Param, Post, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { paginationSchema, type PaginationInput } from '@i2s/contracts';
import { MISSION_SCOPE, MissionsService } from './missions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AffairsModule } from '../affairs/affairs.module';
import { AffairsService } from '../affairs/affairs.service';
import { ScopeService } from '../rbac/scope.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

const missionSchema = z
  .object({
    affairId: z.string().uuid('Choisissez une affaire.'),
    objective: z.string().trim().max(300).optional().or(z.literal('')),
    instructions: z.string().trim().max(4000).optional().or(z.literal('')),
    departmentId: z.string().uuid().optional().or(z.literal('')),
    siteId: z.string().uuid().optional().or(z.literal('')),
    serviceType: z.string().trim().max(80).optional().or(z.literal('')),
    billable: z.boolean().default(true),
    plannedStartDate: z.coerce.date(),
    plannedEndDate: z.coerce.date(),
  })
  .refine((v) => v.plannedEndDate >= v.plannedStartDate, {
    message: 'La fin prévue précède le début prévu.',
    path: ['plannedEndDate'],
  });

const assignSchema = z.object({
  assignments: z
    .array(
      z.object({
        employeeId: z.string().uuid(),
        role: z.enum(['LEAD', 'ASSISTANT', 'TRAINEE', 'SUPERVISOR']).default('LEAD'),
        plannedDays: z.coerce.number().min(0.5).max(60),
      }),
    )
    .min(1, 'Une mission a besoin d’au moins un intervenant.'),
});

const orderSchema = z.object({
  object: z.string().trim().min(3, 'L’objet de la mission est obligatoire.').max(300),
  instructions: z.string().trim().max(4000).optional().or(z.literal('')),
  hseInstructions: z.string().trim().max(4000).optional().or(z.literal('')),
  transportMode: z
    .enum(['SERVICE_VEHICLE', 'PERSONAL_VEHICLE_AUTHORIZED', 'TAXI_ORGANIZED'])
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
});

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

function fullName(p: { firstName: string; lastName: string }): string {
  return `${p.lastName.toUpperCase()} ${p.firstName}`;
}

@ApiTags('Missions')
@Controller('missions')
class MissionsController {
  constructor(
    private readonly missions: MissionsService,
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
    private readonly affairs: AffairsService,
  ) {}

  @Get()
  @RequirePermission('mission', 'VIEW')
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput,
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const scopeLevel = this.scope.requireScope(user, 'mission', 'VIEW');

    // Le périmètre personnel passe par la table d'affectation.
    const scopeWhere =
      scopeLevel === 'OWN'
        ? { assignments: { some: { employeeId: user.employeeId ?? '' } } }
        : this.scope.buildWhere(user, 'mission', 'VIEW', MISSION_SCOPE);

    const baseWhere = { deletedAt: null, ...scopeWhere };

    const where = {
      ...baseWhere,
      ...(status ? { status: status as never } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(query.q
        ? {
            OR: [
              { number: { contains: query.q, mode: 'insensitive' as const } },
              { objective: { contains: query.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rows, statusCounts, departments] = await Promise.all([
      this.prisma.mission.findMany({
        where,
        orderBy: { plannedStartDate: 'desc' },
        take: query.limit + 1,
        ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
        include: {
          affair: {
            select: { id: true, number: true, title: true, client: { select: { name: true } } },
          },
          site: { select: { name: true, city: true } },
          department: { select: { code: true } },
          vehicle: { select: { plate: true } },
          missionOrder: { select: { number: true, status: true } },
          assignments: {
            include: { employee: { select: { matricule: true, firstName: true, lastName: true } } },
          },
          _count: { select: { reports: true } },
        },
      }),
      this.prisma.mission.groupBy({ by: ['status'], where: baseWhere, _count: true }),
      this.prisma.department.findMany({
        where: { companyId: { in: user.companyIds } },
        orderBy: { code: 'asc' },
        select: { id: true, code: true, name: true },
      }),
    ]);

    const hasMore = rows.length > query.limit;
    const items = (hasMore ? rows.slice(0, query.limit) : rows).map((m) => ({
      id: m.id,
      number: m.number,
      objective: m.objective,
      status: m.status,
      affair: m.affair,
      site: m.site,
      department: m.department?.code ?? null,
      vehicle: m.vehicle?.plate ?? null,
      missionOrder: m.missionOrder,
      plannedStartDate: m.plannedStartDate,
      plannedEndDate: m.plannedEndDate,
      actualEndDate: m.actualEndDate,
      reportDueDate: m.reportDueDate,
      inspectors: m.assignments.map((a) => fullName(a.employee)),
      reportCount: m._count.reports,
    }));

    return {
      items,
      nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
      facets: {
        statuses: statusCounts.map((s) => ({ value: s.status, count: s._count })),
        departments,
      },
    };
  }

  /** Affaires ouvrables et intervenants disponibles, pour le formulaire. */
  @Get('options')
  @RequirePermission('mission', 'CREATE')
  async options(@CurrentUser() user: RequestUser) {
    const companyId = user.companyIds[0];
    if (!companyId) return { affairs: [], departments: [], employees: [] };

    const [affairs, departments, employees] = await Promise.all([
      this.prisma.affair.findMany({
        where: {
          deletedAt: null,
          status: { in: ['PROSPECT', 'IN_PROGRESS'] },
          commercialStatus: { not: 'PERDUE_ANNULEE' },
          ...this.affairs.affairWhere(user, 'VIEW'),
        },
        orderBy: { number: 'desc' },
        take: 200,
        select: {
          id: true,
          number: true,
          title: true,
          departmentId: true,
          client: { select: { name: true } },
          projects: { select: { sites: { select: { id: true, name: true, city: true } } } },
        },
      }),
      this.prisma.department.findMany({
        where: { companyId },
        orderBy: { code: 'asc' },
        select: { id: true, code: true, name: true },
      }),
      this.prisma.employee.findMany({
        where: { companyId, deletedAt: null, status: 'ACTIVE' },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        select: {
          id: true,
          matricule: true,
          firstName: true,
          lastName: true,
          position: true,
          isInspector: true,
          department: { select: { code: true } },
          certifications: { select: { method: true, level: true, expiresAt: true } },
        },
      }),
    ]);

    return {
      affairs: affairs.map((a) => ({
        id: a.id,
        number: a.number,
        title: a.title,
        client: a.client.name,
        departmentId: a.departmentId,
        sites: a.projects.flatMap((p) => p.sites),
      })),
      departments,
      employees: employees.map((e) => ({
        id: e.id,
        matricule: e.matricule,
        name: fullName(e),
        position: e.position,
        department: e.department?.code ?? null,
        isInspector: e.isInspector,
        certifications: e.certifications.map((c) => ({
          method: c.method,
          level: c.level,
          expiresAt: c.expiresAt,
        })),
      })),
    };
  }

  @Get(':id')
  @RequirePermission('mission', 'VIEW')
  async detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const mission = await this.missions.get(user, id);

    // Un geste n'est ouvert que si l'utilisateur en a le droit ET si l'état de
    // la mission le permet. Les deux conditions, pas une seule : sinon l'écran
    // propose un bouton que l'API refusera.
    const allowed = (resource: 'mission' | 'mission_order', action: 'CREATE' | 'UPDATE' | 'APPROVE') =>
      user.permissions.some((perm) => perm.resource === resource && perm.action === action);

    return {
      id: mission.id,
      number: mission.number,
      status: mission.status,
      objective: mission.objective,
      instructions: mission.instructions,
      serviceType: mission.serviceType,
      billable: mission.billable,
      plannedStartDate: mission.plannedStartDate,
      plannedEndDate: mission.plannedEndDate,
      actualStartDate: mission.actualStartDate,
      actualEndDate: mission.actualEndDate,
      reportDueDate: mission.reportDueDate,
      affair: {
        id: mission.affair.id,
        number: mission.affair.number,
        title: mission.affair.title,
        client: mission.affair.client.name,
      },
      department: mission.department,
      site: mission.site,
      team: mission.assignments.map((a) => ({
        employeeId: a.employeeId,
        matricule: a.employee.matricule,
        name: fullName(a.employee),
        role: a.role,
        plannedDays: Number(a.plannedDays),
      })),
      missionOrder: mission.missionOrder
        ? {
            id: mission.missionOrder.id,
            number: mission.missionOrder.number,
            status: mission.missionOrder.status,
            object: mission.missionOrder.object,
            instructions: mission.missionOrder.instructions,
            hseInstructions: mission.missionOrder.hseInstructions,
            transportMode: mission.missionOrder.transportMode,
            signedAt: mission.missionOrder.signedAt,
            signatureHash: mission.missionOrder.signatureHash,
          }
        : null,
      inspections: mission.inspections,
      reports: mission.reports,
      expenseLines: mission.expenseLines.map((l) => ({
        id: l.id,
        date: l.date,
        amount: Number(l.amount),
        status: l.status,
        category: l.category.label,
        expenseReport: l.expenseReport,
      })),
      /**
       * Gestes réellement ouverts. Les conditions sont celles que le service
       * applique : aucun bouton n'est affiché qui serait refusé au clic.
       */
      actions: {
        assign:
          allowed('mission', 'UPDATE') &&
          !['COMPLETED', 'CLOSED', 'CANCELLED'].includes(mission.status) &&
          (!mission.missionOrder || mission.missionOrder.status === 'DRAFT'),
        issueOrder:
          allowed('mission_order', 'CREATE') &&
          mission.assignments.length > 0 &&
          (!mission.missionOrder || mission.missionOrder.status === 'DRAFT'),
        signOrder:
          allowed('mission_order', 'APPROVE') && mission.missionOrder?.status === 'APPROVED',
      },
    };
  }

  @Post()
  @RequirePermission('mission', 'CREATE')
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(missionSchema)) body: z.infer<typeof missionSchema>,
    @Req() req: Request,
  ) {
    return this.missions.create(user, body, ctx(req));
  }

  @Post(':id/assignments')
  @RequirePermission('mission', 'UPDATE')
  assign(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(assignSchema)) body: z.infer<typeof assignSchema>,
    @Req() req: Request,
  ) {
    return this.missions.assign(user, id, body.assignments, ctx(req));
  }

  @Post(':id/order')
  @RequirePermission('mission_order', 'CREATE')
  issueOrder(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(orderSchema)) body: z.infer<typeof orderSchema>,
    @Req() req: Request,
  ) {
    return this.missions.issueOrder(user, id, body, ctx(req));
  }

  @Post(':id/order/sign')
  @RequirePermission('mission_order', 'APPROVE')
  signOrder(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.missions.signOrder(user, id, ctx(req));
  }

  /** Pièce imprimable de l'ordre signé — voir MissionsService.orderPdf. */
  @Get(':id/order/pdf')
  @RequirePermission('mission_order', 'VIEW')
  async orderPdf(@CurrentUser() user: RequestUser, @Param('id') id: string, @Res() res: Response) {
    const content = await this.missions.orderPdf(user, id);
    const mission = await this.missions.get(user, id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(content.byteLength));
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${mission.missionOrder?.number ?? mission.number}.pdf"`,
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(content);
  }
}

@Module({
  // Le périmètre d une affaire est défini une seule fois, dans son module.
  imports: [AffairsModule],
  controllers: [MissionsController],
  providers: [MissionsService],
  exports: [MissionsService],
})
export class MissionsModule {}
