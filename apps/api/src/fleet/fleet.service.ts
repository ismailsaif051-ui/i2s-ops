import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/types';

export const VEHICLE_TYPES = ['SERVICE', 'FUNCTION'] as const;
export const VEHICLE_OWNERSHIPS = ['OWNED', 'LLD', 'LCD'] as const;

export const VEHICLE_TYPE_LABELS: Record<(typeof VEHICLE_TYPES)[number], string> = {
  SERVICE: 'Véhicule de service',
  FUNCTION: 'Véhicule de fonction',
};

export const VEHICLE_OWNERSHIP_LABELS: Record<(typeof VEHICLE_OWNERSHIPS)[number], string> = {
  OWNED: 'En propriété',
  LLD: 'Location longue durée',
  LCD: 'Location courte durée',
};

export const vehicleCreateSchema = z.object({
  plate: z.string().trim().min(3, 'L’immatriculation est obligatoire.').max(20),
  brand: z.string().trim().max(60).nullable().optional(),
  model: z.string().trim().max(60).nullable().optional(),
  type: z.enum(VEHICLE_TYPES).optional(),
  ownership: z.enum(VEHICLE_OWNERSHIPS).optional(),
  departmentId: z.string().uuid().nullable().optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  monthlyFee: z.coerce.number().min(0).nullable().optional(),
  contractEndDate: z.coerce.date().nullable().optional(),
  currentKm: z.coerce.number().int().min(0).nullable().optional(),
});

export const vehicleUpdateSchema = vehicleCreateSchema.partial();

export const maintenanceSchema = z.object({
  type: z.string().trim().min(2, 'Précisez la nature de l’entretien.').max(80),
  date: z.coerce.date(),
  km: z.coerce.number().int().min(0).nullable().optional(),
  cost: z.coerce.number().min(0).nullable().optional(),
  provider: z.string().trim().max(120).nullable().optional(),
  nextDueKm: z.coerce.number().int().min(0).nullable().optional(),
  nextDueDate: z.coerce.date().nullable().optional(),
});

export const insuranceSchema = z.object({
  policyNumber: z.string().trim().min(1, 'Le numéro de police est obligatoire.').max(80),
  insurer: z.string().trim().max(120).nullable().optional(),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date(),
  premium: z.coerce.number().min(0).nullable().optional(),
});

export function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Flotte de véhicules.
 *
 * Les inspecteurs se déplacent : les véhicules portent l'assurance qui les
 * couvre et l'entretien qui les maintient en état. Un véhicule non assuré ne
 * doit pas partir en mission — c'est le seul point que le système bloque.
 */
@Injectable()
export class FleetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async get(user: RequestUser, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, deletedAt: null, companyId: { in: user.companyIds } },
      include: {
        department: { select: { id: true, code: true, name: true } },
        assignedTo: { select: { id: true, matricule: true, firstName: true, lastName: true } },
        maintenances: { orderBy: { date: 'desc' } },
        insurances: { orderBy: { validTo: 'desc' } },
      },
    });

    if (!vehicle) throw new NotFoundException('Véhicule introuvable.');
    return vehicle;
  }

  async create(
    user: RequestUser,
    input: z.infer<typeof vehicleCreateSchema>,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const companyId = user.companyIds[0];
    if (!companyId) throw new BadRequestException('Votre compte n’est rattaché à aucune société.');

    const plate = input.plate.trim().toUpperCase();
    const existing = await this.prisma.vehicle.findFirst({
      where: { companyId, plate, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException(`L’immatriculation ${plate} est déjà enregistrée.`);
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        companyId,
        plate,
        brand: input.brand?.trim() || null,
        model: input.model?.trim() || null,
        type: input.type ?? 'SERVICE',
        ownership: input.ownership ?? 'OWNED',
        departmentId: input.departmentId ?? null,
        assignedToId: input.assignedToId ?? null,
        monthlyFee: input.monthlyFee ?? null,
        contractEndDate: input.contractEndDate ?? null,
        currentKm: input.currentKm ?? null,
        // Sans assurance enregistrée, le véhicule n'est pas prêt à rouler.
        status: 'OUT_OF_SERVICE',
      },
    });

    await this.audit.record(
      {
        entity: 'vehicle',
        entityId: vehicle.id,
        action: 'CREATE',
        after: { plate: vehicle.plate, type: vehicle.type, ownership: vehicle.ownership },
        companyId,
      },
      { user, ...ctx },
    );

    return vehicle;
  }

  async update(
    user: RequestUser,
    id: string,
    input: z.infer<typeof vehicleUpdateSchema>,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const vehicle = await this.get(user, id);

    // Le kilométrage ne recule pas : une saisie inférieure est une faute de
    // frappe, et elle fausserait les échéances d'entretien.
    if (
      input.currentKm !== undefined &&
      input.currentKm !== null &&
      vehicle.currentKm !== null &&
      input.currentKm < vehicle.currentKm
    ) {
      throw new BadRequestException({
        message: 'Mise à jour refusée.',
        errors: [
          {
            field: 'currentKm',
            message: `Le compteur affichait déjà ${vehicle.currentKm} km : il ne peut pas reculer.`,
          },
        ],
      });
    }

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: {
        plate: input.plate?.trim().toUpperCase(),
        brand: input.brand ?? undefined,
        model: input.model ?? undefined,
        type: input.type,
        ownership: input.ownership,
        departmentId: input.departmentId ?? undefined,
        assignedToId: input.assignedToId ?? undefined,
        monthlyFee: input.monthlyFee ?? undefined,
        contractEndDate: input.contractEndDate ?? undefined,
        currentKm: input.currentKm ?? undefined,
      },
    });

    await this.audit.record(
      {
        entity: 'vehicle',
        entityId: id,
        action: 'UPDATE',
        before: { assignedToId: vehicle.assignedToId, currentKm: vehicle.currentKm },
        after: { assignedToId: updated.assignedToId, currentKm: updated.currentKm },
        companyId: vehicle.companyId,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /* ── Entretien ────────────────────────────────────────────────── */

  async recordMaintenance(
    user: RequestUser,
    id: string,
    input: z.infer<typeof maintenanceSchema>,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const vehicle = await this.get(user, id);
    const date = startOfDay(input.date);

    if (date > startOfDay(new Date())) {
      throw new BadRequestException({
        message: 'Entretien refusé.',
        errors: [{ field: 'date', message: 'Un entretien ne se date pas dans le futur.' }],
      });
    }
    if (input.km !== undefined && input.km !== null && vehicle.currentKm !== null && input.km < vehicle.currentKm) {
      throw new BadRequestException({
        message: 'Entretien refusé.',
        errors: [
          {
            field: 'km',
            message: `Le compteur affiche ${vehicle.currentKm} km : l’entretien ne peut pas être relevé en deçà.`,
          },
        ],
      });
    }

    const maintenance = await this.prisma.$transaction(async (tx) => {
      const created = await tx.vehicleMaintenance.create({
        data: {
          vehicleId: id,
          type: input.type.trim(),
          date,
          km: input.km ?? null,
          cost: input.cost ?? null,
          provider: input.provider?.trim() || null,
          nextDueKm: input.nextDueKm ?? null,
          nextDueDate: input.nextDueDate ? startOfDay(input.nextDueDate) : null,
        },
      });

      // Le relevé du garage fait foi : il met le compteur à jour.
      if (input.km !== undefined && input.km !== null) {
        await tx.vehicle.update({ where: { id }, data: { currentKm: input.km } });
      }
      // Un véhicule qui sort de l'atelier redevient disponible.
      if (vehicle.status === 'MAINTENANCE') {
        await tx.vehicle.update({ where: { id }, data: { status: 'AVAILABLE' } });
      }

      return created;
    });

    await this.audit.record(
      {
        entity: 'vehicle',
        entityId: id,
        action: 'MAINTENANCE',
        after: { type: maintenance.type, date, km: input.km, cost: input.cost },
        companyId: vehicle.companyId,
      },
      { user, ...ctx },
    );

    return maintenance;
  }

  /* ── Assurance ────────────────────────────────────────────────── */

  /**
   * Enregistre une police d'assurance.
   *
   * C'est ce qui rend un véhicule utilisable : sans couverture en cours, il
   * reste hors service, et aucune bonne volonté ne l'en sort.
   */
  async recordInsurance(
    user: RequestUser,
    id: string,
    input: z.infer<typeof insuranceSchema>,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const vehicle = await this.get(user, id);
    const from = startOfDay(input.validFrom);
    const to = startOfDay(input.validTo);

    if (to <= from) {
      throw new BadRequestException({
        message: 'Police refusée.',
        errors: [{ field: 'validTo', message: 'La fin de validité doit suivre le début.' }],
      });
    }

    const today = startOfDay(new Date());
    const warnings: string[] = [];
    if (to < today) {
      warnings.push(
        `La police expire le ${to.toLocaleDateString('fr-FR')} : le véhicule reste hors service.`,
      );
    }

    const insurance = await this.prisma.$transaction(async (tx) => {
      const created = await tx.vehicleInsurance.create({
        data: {
          vehicleId: id,
          policyNumber: input.policyNumber.trim(),
          insurer: input.insurer?.trim() || null,
          validFrom: from,
          validTo: to,
          premium: input.premium ?? null,
        },
      });

      // Couverture en cours et véhicule non réformé : il peut rouler.
      if (to >= today && from <= today && vehicle.status === 'OUT_OF_SERVICE') {
        await tx.vehicle.update({ where: { id }, data: { status: 'AVAILABLE' } });
      }

      return created;
    });

    await this.audit.record(
      {
        entity: 'vehicle',
        entityId: id,
        action: 'INSURANCE',
        after: { policy: insurance.policyNumber, validTo: to },
        companyId: vehicle.companyId,
      },
      { user, ...ctx },
    );

    return { insurance, warnings };
  }
}
