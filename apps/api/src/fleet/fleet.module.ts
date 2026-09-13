import { Body, Controller, Get, Module, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { z } from 'zod';
import {
  FleetService,
  VEHICLE_OWNERSHIPS,
  VEHICLE_TYPES,
  insuranceSchema,
  maintenanceSchema,
  startOfDay,
  vehicleCreateSchema,
  vehicleUpdateSchema,
} from './fleet.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

const listSchema = z.object({
  /** `uninsured` : sans couverture en cours. `due` : assurance ou entretien proche. */
  state: z.enum(['available', 'uninsured', 'due', 'out']).optional(),
});

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

@ApiTags('Flotte')
@Controller('vehicles')
class FleetController {
  constructor(
    private readonly fleet: FleetService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @RequirePermission('vehicle', 'VIEW')
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(listSchema)) query: z.infer<typeof listSchema>,
  ) {
    const rows = await this.prisma.vehicle.findMany({
      where: { deletedAt: null, companyId: { in: user.companyIds } },
      orderBy: { plate: 'asc' },
      include: {
        department: { select: { code: true } },
        assignedTo: { select: { matricule: true, firstName: true, lastName: true } },
        insurances: { orderBy: { validTo: 'desc' }, take: 1 },
        maintenances: { orderBy: { date: 'desc' }, take: 1 },
      },
    });

    const today = startOfDay(new Date());
    const in60Days = new Date(today.getTime() + 60 * 86_400_000);

    const items = rows.map((v) => {
      const insurance = v.insurances[0] ?? null;
      const insuredUntil = insurance ? startOfDay(insurance.validTo) : null;
      const uninsured = insuredUntil === null || insuredUntil < today;

      const maintenance = v.maintenances[0] ?? null;
      const nextDueDate = maintenance?.nextDueDate ? startOfDay(maintenance.nextDueDate) : null;
      const nextDueKm = maintenance?.nextDueKm ?? null;

      return {
        id: v.id,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        type: v.type,
        ownership: v.ownership,
        department: v.department?.code ?? null,
        assignedTo: v.assignedTo
          ? `${v.assignedTo.lastName.toUpperCase()} ${v.assignedTo.firstName}`
          : null,
        currentKm: v.currentKm,
        status: v.status,
        monthlyFee: v.monthlyFee === null ? null : Number(v.monthlyFee),
        contractEndDate: v.contractEndDate,
        insurancePolicy: insurance?.policyNumber ?? null,
        insuredUntil: insurance?.validTo ?? null,
        /** Sans couverture en cours, le véhicule ne doit pas rouler. */
        uninsured,
        insuranceDueSoon:
          !uninsured && insuredUntil !== null && insuredUntil <= in60Days,
        lastMaintenance: maintenance?.date ?? null,
        nextMaintenanceDate: maintenance?.nextDueDate ?? null,
        nextMaintenanceKm: nextDueKm,
        /** Entretien dû : par la date, ou par le compteur. */
        maintenanceDue:
          (nextDueDate !== null && nextDueDate <= today) ||
          (nextDueKm !== null && v.currentKm !== null && v.currentKm >= nextDueKm),
        contractEndingSoon:
          v.contractEndDate !== null &&
          startOfDay(v.contractEndDate) >= today &&
          startOfDay(v.contractEndDate) <= in60Days,
      };
    });

    const filtered = query.state
      ? items.filter((v) =>
          query.state === 'uninsured'
            ? v.uninsured
            : query.state === 'due'
              ? v.insuranceDueSoon || v.maintenanceDue
              : query.state === 'out'
                ? v.status === 'OUT_OF_SERVICE'
                : v.status === 'AVAILABLE' || v.status === 'IN_USE',
        )
      : items;

    return {
      items: filtered,
      totals: {
        all: items.length,
        uninsured: items.filter((v) => v.uninsured).length,
        insuranceDueSoon: items.filter((v) => v.insuranceDueSoon).length,
        maintenanceDue: items.filter((v) => v.maintenanceDue).length,
        monthlyCost: items.reduce((sum, v) => sum + (v.monthlyFee ?? 0), 0),
      },
      types: [...VEHICLE_TYPES],
      ownerships: [...VEHICLE_OWNERSHIPS],
    };
  }

  @Get(':id')
  @RequirePermission('vehicle', 'VIEW')
  async detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const vehicle = await this.fleet.get(user, id);
    const today = startOfDay(new Date());

    const insurance = vehicle.insurances[0] ?? null;
    const insuredUntil = insurance ? startOfDay(insurance.validTo) : null;

    return {
      id: vehicle.id,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      type: vehicle.type,
      ownership: vehicle.ownership,
      department: vehicle.department,
      assignedTo: vehicle.assignedTo
        ? {
            id: vehicle.assignedTo.id,
            matricule: vehicle.assignedTo.matricule,
            name: `${vehicle.assignedTo.lastName.toUpperCase()} ${vehicle.assignedTo.firstName}`,
          }
        : null,
      currentKm: vehicle.currentKm,
      status: vehicle.status,
      monthlyFee: vehicle.monthlyFee === null ? null : Number(vehicle.monthlyFee),
      contractEndDate: vehicle.contractEndDate,
      uninsured: insuredUntil === null || insuredUntil < today,
      insurances: vehicle.insurances.map((i) => ({
        id: i.id,
        policyNumber: i.policyNumber,
        insurer: i.insurer,
        validFrom: i.validFrom,
        validTo: i.validTo,
        premium: i.premium === null ? null : Number(i.premium),
        current: startOfDay(i.validFrom) <= today && startOfDay(i.validTo) >= today,
      })),
      maintenances: vehicle.maintenances.map((m) => ({
        id: m.id,
        type: m.type,
        date: m.date,
        km: m.km,
        cost: m.cost === null ? null : Number(m.cost),
        provider: m.provider,
        nextDueDate: m.nextDueDate,
        nextDueKm: m.nextDueKm,
      })),
      maintenanceCost: vehicle.maintenances.reduce((sum, m) => sum + Number(m.cost ?? 0), 0),
    };
  }

  @Post()
  @RequirePermission('vehicle', 'CREATE')
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(vehicleCreateSchema)) body: z.infer<typeof vehicleCreateSchema>,
    @Req() req: Request,
  ) {
    return this.fleet.create(user, body, ctx(req));
  }

  @Patch(':id')
  @RequirePermission('vehicle', 'UPDATE')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(vehicleUpdateSchema)) body: z.infer<typeof vehicleUpdateSchema>,
    @Req() req: Request,
  ) {
    return this.fleet.update(user, id, body, ctx(req));
  }

  @Post(':id/maintenances')
  @RequirePermission('vehicle', 'UPDATE')
  maintenance(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(maintenanceSchema)) body: z.infer<typeof maintenanceSchema>,
    @Req() req: Request,
  ) {
    return this.fleet.recordMaintenance(user, id, body, ctx(req));
  }

  @Post(':id/insurances')
  @RequirePermission('vehicle', 'UPDATE')
  insurance(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(insuranceSchema)) body: z.infer<typeof insuranceSchema>,
    @Req() req: Request,
  ) {
    return this.fleet.recordInsurance(user, id, body, ctx(req));
  }
}

@Module({
  controllers: [FleetController],
  providers: [FleetService],
  exports: [FleetService],
})
export class FleetModule {}
