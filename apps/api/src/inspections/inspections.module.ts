import { Body, Controller, Get, Module, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { z } from 'zod';
import { InspectionsService } from './inspections.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

const createSchema = z.object({
  missionId: z.string().uuid(),
  templateId: z.string().uuid(),
  assetId: z.string().uuid().optional(),
  date: z.coerce.date().optional(),
});

const saveSchema = z.object({
  data: z.record(z.unknown()),
  deviceIds: z.array(z.string().uuid()).optional(),
});

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

@ApiTags('Inspections')
@Controller('inspections')
class InspectionsController {
  constructor(
    private readonly inspections: InspectionsService,
    private readonly prisma: PrismaService,
  ) {}

  /** Missions sur lesquelles l'utilisateur peut ouvrir une inspection. */
  @Get('eligible-missions')
  @RequirePermission('inspection', 'CREATE')
  async eligibleMissions(@CurrentUser() user: RequestUser) {
    const rows = await this.prisma.mission.findMany({
      where: {
        deletedAt: null,
        status: { in: ['ORDER_ISSUED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'] },
        missionOrder: { status: { in: ['SIGNED', 'IN_PROGRESS', 'COMPLETED'] } },
        ...(user.employeeId ? { assignments: { some: { employeeId: user.employeeId } } } : {}),
      },
      orderBy: { plannedStartDate: 'desc' },
      take: 60,
      include: {
        affair: { select: { number: true, client: { select: { name: true } } } },
        site: { select: { name: true } },
        department: { select: { code: true } },
      },
    });

    return {
      items: rows.map((m) => ({
        id: m.id,
        number: m.number,
        objective: m.objective,
        affairNumber: m.affair.number,
        client: m.affair.client.name,
        site: m.site?.name ?? null,
        department: m.department?.code ?? null,
        start: m.plannedStartDate,
        end: m.plannedEndDate,
      })),
    };
  }

  @Get(':id')
  @RequirePermission('inspection', 'VIEW')
  async get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const inspection = await this.inspections.get(user, id);
    const validation = await this.inspections.validate(id);

    return {
      id: inspection.id,
      status: inspection.status,
      date: inspection.date,
      data: inspection.data,
      template: {
        id: inspection.template.id,
        formCode: inspection.template.formCode,
        version: inspection.templateVersion,
        title: inspection.template.title,
        titleEn: inspection.template.titleEn,
        paradigm: inspection.template.paradigm,
        schema: inspection.template.schema,
      },
      inspector: {
        id: inspection.inspector.id,
        name: `${inspection.inspector.lastName.toUpperCase()} ${inspection.inspector.firstName}`,
        matricule: inspection.inspector.matricule,
      },
      mission: {
        id: inspection.mission.id,
        number: inspection.mission.number,
        objective: inspection.mission.objective,
        affairNumber: inspection.mission.affair.number,
        client: inspection.mission.affair.client.name,
        site: inspection.mission.site?.name ?? null,
      },
      devices: inspection.devices.map((d) => ({
        id: d.measuringDevice.id,
        code: d.measuringDevice.code,
        type: d.measuringDevice.type,
        brand: d.measuringDevice.brand,
        model: d.measuringDevice.model,
        serialNumber: d.measuringDevice.serialNumber,
        calibrationValidUntil: d.measuringDevice.calibrationValidUntil,
      })),
      report: inspection.report,
      validation,
      editable: inspection.status === 'DRAFT' && inspection.inspectorId === user.employeeId,
    };
  }

  @Post()
  @RequirePermission('inspection', 'CREATE')
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createSchema))
    body: { missionId: string; templateId: string; assetId?: string; date?: Date },
    @Req() req: Request,
  ) {
    return this.inspections.create(user, body, ctx(req));
  }

  @Put(':id')
  @RequirePermission('inspection', 'UPDATE')
  save(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(saveSchema))
    body: { data: Record<string, unknown>; deviceIds?: string[] },
    @Req() req: Request,
  ) {
    return this.inspections.saveDraft(user, id, body.data, body.deviceIds, ctx(req));
  }

  @Post(':id/submit')
  @RequirePermission('inspection', 'UPDATE')
  submit(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.inspections.submit(user, id, ctx(req));
  }

  /** Instruments sélectionnables, avec leur état d'étalonnage à la date voulue. */
  @Get('devices/available')
  @RequirePermission('measuring_device', 'VIEW')
  async availableDevices(
    @CurrentUser() user: RequestUser,
    @Query('date') dateRaw?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const at = dateRaw ? new Date(dateRaw) : new Date();
    const rows = await this.prisma.measuringDevice.findMany({
      where: {
        deletedAt: null,
        companyId: { in: user.companyIds },
        ...(departmentId ? { departmentId } : {}),
      },
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        type: true,
        brand: true,
        model: true,
        serialNumber: true,
        calibrationValidUntil: true,
        department: { select: { code: true } },
      },
    });

    return {
      items: rows.map((d) => ({
        ...d,
        department: d.department?.code ?? null,
        /** Utilisable seulement si l'étalonnage couvre la date de l'essai. */
        usable: d.calibrationValidUntil ? d.calibrationValidUntil >= at : false,
      })),
    };
  }
}

@Module({
  controllers: [InspectionsController],
  providers: [InspectionsService],
})
export class InspectionsModule {}
