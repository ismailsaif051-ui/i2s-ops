import { Body, Controller, Get, Module, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { z } from 'zod';
import { CALIBRATION_RESULTS, DevicesService } from './devices.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

const listSchema = z.object({
  departmentId: z.string().uuid().optional(),
  /** `expired`, `due`, `available` — l'état qui intéresse, pas tout le parc. */
  state: z.enum(['expired', 'due', 'available', 'out']).optional(),
});

const createSchema = z.object({
  code: z.string().trim().min(2).max(30),
  type: z.string().trim().min(2).max(120),
  brand: z.string().trim().max(80).nullable().optional(),
  model: z.string().trim().max(80).nullable().optional(),
  serialNumber: z.string().trim().max(80).nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  holderId: z.string().uuid().nullable().optional(),
  calibrationIntervalM: z.coerce.number().int().min(1).max(60).optional(),
});

const updateSchema = createSchema.partial().omit({ code: true });

const calibrationSchema = z.object({
  date: z.coerce.date(),
  validUntil: z.coerce.date().nullable().optional(),
  provider: z.string().trim().max(120).nullable().optional(),
  certificateNumber: z
    .string()
    .trim()
    .min(1, 'Le numéro de certificat est la preuve de l’étalonnage : il est obligatoire.')
    .max(80),
  result: z.enum(CALIBRATION_RESULTS),
  cost: z.coerce.number().min(0).nullable().optional(),
  certificate: z
    .object({
      fileName: z.string().trim().min(1).max(200),
      // ~8 Mo de PDF une fois décodé : largement de quoi loger un certificat scanné.
      contentBase64: z.string().max(11_000_000),
    })
    .nullable()
    .optional(),
});

const reasonSchema = z.object({ reason: z.string().trim().min(3).max(500) });

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

@ApiTags('Parc de mesure')
@Controller('measuring-devices')
class DevicesController {
  constructor(
    private readonly devices: DevicesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @RequirePermission('measuring_device', 'VIEW')
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(listSchema)) query: z.infer<typeof listSchema>,
  ) {
    const rows = await this.prisma.measuringDevice.findMany({
      where: {
        deletedAt: null,
        companyId: { in: user.companyIds },
        ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      },
      orderBy: { calibrationValidUntil: 'asc' },
      include: {
        department: { select: { code: true } },
        holder: { select: { matricule: true, firstName: true, lastName: true } },
        calibrations: { orderBy: { date: 'desc' }, take: 1 },
      },
    });

    const today = startOfDay(new Date());
    const in60Days = new Date(today.getTime() + 60 * 86_400_000);

    const items = rows.map((d) => {
      const validUntil = d.calibrationValidUntil ? startOfDay(d.calibrationValidUntil) : null;
      const expired = validUntil === null || validUntil < today;

      return {
        id: d.id,
        code: d.code,
        type: d.type,
        brand: d.brand,
        model: d.model,
        serialNumber: d.serialNumber,
        department: d.department?.code ?? null,
        holder: d.holder ? `${d.holder.lastName.toUpperCase()} ${d.holder.firstName}` : null,
        calibrationValidUntil: d.calibrationValidUntil,
        calibrationIntervalM: d.calibrationIntervalM,
        status: d.status,
        lastCertificate: d.calibrations[0]?.certificateNumber ?? null,
        lastCalibrationDate: d.calibrations[0]?.date ?? null,
        /** Un instrument périmé ne peut plus fonder un rapport. */
        blocking: expired || d.status === 'OUT_OF_SERVICE',
        expired,
        dueSoon: !expired && validUntil !== null && validUntil <= in60Days,
        /** Jours restants avant échéance — négatif si elle est passée. */
        daysLeft:
          validUntil === null
            ? null
            : Math.round((validUntil.getTime() - today.getTime()) / 86_400_000),
      };
    });

    const filtered = query.state
      ? items.filter((d) =>
          query.state === 'expired'
            ? d.expired
            : query.state === 'due'
              ? d.dueSoon
              : query.state === 'out'
                ? d.status === 'OUT_OF_SERVICE'
                : !d.blocking,
        )
      : items;

    return {
      items: filtered,
      totals: {
        all: items.length,
        expired: items.filter((d) => d.expired).length,
        dueSoon: items.filter((d) => d.dueSoon).length,
        outOfService: items.filter((d) => d.status === 'OUT_OF_SERVICE').length,
      },
    };
  }

  @Get(':id')
  @RequirePermission('measuring_device', 'VIEW')
  async detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const device = await this.devices.get(user, id);
    const today = startOfDay(new Date());
    const validUntil = device.calibrationValidUntil
      ? startOfDay(device.calibrationValidUntil)
      : null;

    // Les inspections qui se sont appuyées sur cet instrument : c'est la
    // question qu'un auditeur pose quand un étalonnage se révèle non conforme.
    const uses = await this.prisma.inspectionDevice.findMany({
      where: { measuringDeviceId: id },
      orderBy: { inspection: { date: 'desc' } },
      take: 20,
      select: {
        calibrationValidAt: true,
        inspection: {
          select: {
            id: true,
            date: true,
            status: true,
            mission: { select: { number: true } },
            report: { select: { number: true, status: true } },
          },
        },
      },
    });

    return {
      id: device.id,
      code: device.code,
      type: device.type,
      brand: device.brand,
      model: device.model,
      serialNumber: device.serialNumber,
      department: device.department,
      holder: device.holder
        ? {
            id: device.holder.id,
            matricule: device.holder.matricule,
            name: `${device.holder.lastName.toUpperCase()} ${device.holder.firstName}`,
          }
        : null,
      calibrationValidUntil: device.calibrationValidUntil,
      calibrationIntervalM: device.calibrationIntervalM,
      status: device.status,
      expired: validUntil === null || validUntil < today,
      daysLeft:
        validUntil === null
          ? null
          : Math.round((validUntil.getTime() - today.getTime()) / 86_400_000),
      calibrations: device.calibrations.map((c) => ({
        id: c.id,
        date: c.date,
        validUntil: c.validUntil,
        provider: c.provider,
        certificateNumber: c.certificateNumber,
        result: c.result,
        cost: c.cost,
        hasDocument: c.documentId !== null,
        documentId: c.documentId,
      })),
      uses: uses.map((u) => ({
        inspectionId: u.inspection.id,
        date: u.inspection.date,
        mission: u.inspection.mission.number,
        report: u.inspection.report?.number ?? null,
        reportStatus: u.inspection.report?.status ?? null,
        calibrationValidAt: u.calibrationValidAt,
      })),
    };
  }

  @Post()
  @RequirePermission('measuring_device', 'CREATE')
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>,
    @Req() req: Request,
  ) {
    return this.devices.create(user, body, ctx(req));
  }

  @Patch(':id')
  @RequirePermission('measuring_device', 'UPDATE')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>,
    @Req() req: Request,
  ) {
    return this.devices.update(user, id, body, ctx(req));
  }

  @Post(':id/send-to-calibration')
  @RequirePermission('measuring_device', 'UPDATE')
  send(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.devices.sendToCalibration(user, id, ctx(req));
  }

  /** Le geste qui rend un instrument utilisable à nouveau. */
  @Post(':id/calibrations')
  @RequirePermission('measuring_device', 'UPDATE')
  calibrate(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(calibrationSchema)) body: z.infer<typeof calibrationSchema>,
    @Req() req: Request,
  ) {
    return this.devices.recordCalibration(user, id, body, ctx(req));
  }

  @Post(':id/out-of-service')
  @RequirePermission('measuring_device', 'APPROVE')
  retire(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reasonSchema)) body: { reason: string },
    @Req() req: Request,
  ) {
    return this.devices.setOutOfService(user, id, body.reason, ctx(req));
  }

  @Post(':id/return-to-service')
  @RequirePermission('measuring_device', 'APPROVE')
  restore(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.devices.returnToService(user, id, ctx(req));
  }
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

@Module({
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
