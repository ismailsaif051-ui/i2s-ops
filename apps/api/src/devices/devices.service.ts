import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DocumentsService } from '../documents/documents.service';
import type { RequestUser } from '../common/types';

export const CALIBRATION_RESULTS = ['CONFORM', 'CONFORM_WITH_RESERVE', 'NON_CONFORM'] as const;
export type CalibrationResult = (typeof CALIBRATION_RESULTS)[number];

export interface CalibrationInput {
  date: Date;
  validUntil?: Date | null;
  provider?: string | null;
  certificateNumber: string;
  result: CalibrationResult;
  cost?: number | null;
  /** Certificat scanné, encodé en base64 — la pièce qui prouve l'étalonnage. */
  certificate?: { fileName: string; contentBase64: string } | null;
}

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly documents: DocumentsService,
  ) {}

  /* ── Lecture ──────────────────────────────────────────────────── */

  async get(user: RequestUser, id: string) {
    const device = await this.prisma.measuringDevice.findFirst({
      where: { id, deletedAt: null, companyId: { in: user.companyIds } },
      include: {
        department: { select: { id: true, code: true, name: true } },
        holder: { select: { id: true, matricule: true, firstName: true, lastName: true } },
        calibrations: { orderBy: { date: 'desc' } },
      },
    });

    if (!device) throw new NotFoundException('Instrument introuvable.');
    return device;
  }

  /* ── Création et mise à jour ──────────────────────────────────── */

  async create(
    user: RequestUser,
    input: {
      code: string;
      type: string;
      brand?: string | null;
      model?: string | null;
      serialNumber?: string | null;
      departmentId?: string | null;
      holderId?: string | null;
      calibrationIntervalM?: number;
    },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const companyId = user.companyIds[0];
    if (!companyId) throw new BadRequestException('Votre compte n’est rattaché à aucune société.');

    const existing = await this.prisma.measuringDevice.findFirst({
      where: { companyId, code: input.code, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException(`Le repère ${input.code} est déjà porté par un instrument.`);
    }

    const device = await this.prisma.measuringDevice.create({
      data: {
        companyId,
        code: input.code,
        type: input.type,
        brand: input.brand ?? null,
        model: input.model ?? null,
        serialNumber: input.serialNumber ?? null,
        departmentId: input.departmentId ?? null,
        holderId: input.holderId ?? null,
        calibrationIntervalM: input.calibrationIntervalM ?? 12,
        // Un instrument neuf n'est pas utilisable tant qu'il n'a pas de
        // certificat : sans étalonnage, aucun rapport ne peut s'appuyer sur lui.
        status: 'DUE_CALIBRATION',
      },
    });

    await this.audit.record(
      {
        entity: 'measuring_device',
        entityId: device.id,
        action: 'CREATE',
        after: { code: device.code, type: device.type },
        companyId,
      },
      { user, ...ctx },
    );

    return device;
  }

  async update(
    user: RequestUser,
    id: string,
    input: {
      type?: string;
      brand?: string | null;
      model?: string | null;
      serialNumber?: string | null;
      departmentId?: string | null;
      holderId?: string | null;
      calibrationIntervalM?: number;
    },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const device = await this.get(user, id);

    const updated = await this.prisma.measuringDevice.update({ where: { id }, data: input });

    await this.audit.record(
      {
        entity: 'measuring_device',
        entityId: id,
        action: 'UPDATE',
        before: this.audit.diff(device as never, updated as never).before,
        after: this.audit.diff(device as never, updated as never).after,
        companyId: device.companyId,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /* ── Départ en étalonnage ─────────────────────────────────────── */

  /**
   * L'instrument part au laboratoire. Il cesse d'être proposé à la saisie :
   * un appareil qui n'est pas dans les mains de l'inspecteur ne peut pas
   * avoir servi à mesurer.
   */
  async sendToCalibration(
    user: RequestUser,
    id: string,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const device = await this.get(user, id);

    if (device.status === 'IN_CALIBRATION') {
      throw new BadRequestException('Cet instrument est déjà au laboratoire.');
    }
    if (device.status === 'OUT_OF_SERVICE') {
      throw new BadRequestException(
        'Cet instrument est réformé. Remettez-le en service avant de l’envoyer à l’étalonnage.',
      );
    }

    const updated = await this.prisma.measuringDevice.update({
      where: { id },
      data: { status: 'IN_CALIBRATION' },
    });

    await this.audit.record(
      {
        entity: 'measuring_device',
        entityId: id,
        action: 'SEND_TO_CALIBRATION',
        before: { status: device.status },
        after: { status: updated.status },
        companyId: device.companyId,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /* ── Certificat d'étalonnage ──────────────────────────────────── */

  /**
   * Enregistre un certificat d'étalonnage.
   *
   * C'est cette opération qui rend un instrument utilisable à nouveau — et la
   * seule. Un certificat non conforme ne prolonge rien : l'appareil sort du
   * service, parce qu'un instrument qui a échoué à sa vérification ne peut
   * pas fonder un rapport.
   */
  async recordCalibration(
    user: RequestUser,
    id: string,
    input: CalibrationInput,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const device = await this.get(user, id);

    const date = startOfDay(input.date);
    const today = startOfDay(new Date());

    if (date > today) {
      throw new BadRequestException({
        message: 'Certificat refusé.',
        errors: [{ field: 'date', message: 'Un étalonnage ne se date pas dans le futur.' }],
      });
    }

    // À défaut d'échéance au certificat, l'intervalle de l'instrument fait foi.
    const validUntil = input.validUntil
      ? startOfDay(input.validUntil)
      : addMonths(date, device.calibrationIntervalM);

    if (validUntil <= date) {
      throw new BadRequestException({
        message: 'Certificat refusé.',
        errors: [
          { field: 'validUntil', message: 'L’échéance doit être postérieure à la date d’étalonnage.' },
        ],
      });
    }

    if (!input.certificateNumber.trim()) {
      throw new BadRequestException({
        message: 'Certificat refusé.',
        errors: [
          {
            field: 'certificateNumber',
            message: 'Le numéro de certificat est la preuve de l’étalonnage : il est obligatoire.',
          },
        ],
      });
    }

    const conform = input.result !== 'NON_CONFORM';
    const warnings: string[] = [];

    if (conform && validUntil <= today) {
      warnings.push(
        `L’échéance du certificat (${validUntil.toLocaleDateString('fr-FR')}) est déjà passée : l’instrument reste inutilisable.`,
      );
    }
    if (
      conform &&
      device.calibrationValidUntil &&
      validUntil < startOfDay(device.calibrationValidUntil)
    ) {
      warnings.push(
        'Ce certificat expire avant celui déjà enregistré : la validité de l’instrument n’est pas prolongée.',
      );
    }

    // Le certificat scanné rejoint la GED : sans lui, un auditeur n'a que
    // votre parole. Il est rattaché à l'instrument, pas au seul enregistrement.
    let documentId: string | null = null;
    if (input.certificate) {
      const content = Buffer.from(input.certificate.contentBase64, 'base64');
      if (content.byteLength === 0) {
        throw new BadRequestException('Le certificat joint est vide ou illisible.');
      }

      const stored = await this.documents.store(user, {
        companyId: device.companyId,
        type: 'CALIBRATION_CERTIFICATE',
        fileName: input.certificate.fileName,
        mimeType: 'application/pdf',
        content,
        extension: '.pdf',
        entityType: 'calibration',
        entityId: device.id,
        departmentId: device.departmentId,
        tags: ['étalonnage', device.code],
        comment: `${input.certificateNumber} — ${date.toLocaleDateString('fr-FR')}`,
      });
      documentId = stored.id;
    }

    const record = await this.prisma.$transaction(async (tx) => {
      const created = await tx.calibrationRecord.create({
        data: {
          deviceId: id,
          date,
          validUntil,
          provider: input.provider?.trim() || null,
          certificateNumber: input.certificateNumber.trim(),
          result: input.result,
          cost: input.cost ?? null,
          documentId,
        },
      });

      await tx.measuringDevice.update({
        where: { id },
        data: conform
          ? {
              // La validité ne recule pas : un certificat rétroactif ne raccourcit
              // pas une échéance déjà acquise.
              calibrationValidUntil:
                device.calibrationValidUntil && device.calibrationValidUntil > validUntil
                  ? device.calibrationValidUntil
                  : validUntil,
              status: device.status === 'OUT_OF_SERVICE' ? 'OUT_OF_SERVICE' : 'AVAILABLE',
            }
          : { status: 'OUT_OF_SERVICE' },
      });

      return created;
    });

    if (!conform) {
      warnings.push(
        'Étalonnage non conforme : l’instrument est sorti du service et ne peut plus fonder un rapport.',
      );
    }
    if (conform && device.status === 'OUT_OF_SERVICE') {
      warnings.push(
        'L’instrument est réformé : le certificat est enregistré, mais il faut le remettre en service pour l’utiliser.',
      );
    }

    await this.audit.record(
      {
        entity: 'measuring_device',
        entityId: id,
        action: 'CALIBRATE',
        before: {
          validUntil: device.calibrationValidUntil,
          status: device.status,
        },
        after: {
          certificate: input.certificateNumber,
          result: input.result,
          validUntil,
          document: documentId,
        },
        companyId: device.companyId,
      },
      { user, ...ctx },
    );

    return { record, warnings };
  }

  /* ── Réforme et remise en service ─────────────────────────────── */

  async setOutOfService(
    user: RequestUser,
    id: string,
    reason: string,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const device = await this.get(user, id);

    if (!reason.trim()) {
      throw new BadRequestException({
        message: 'Sortie du service refusée.',
        errors: [{ field: 'reason', message: 'Le motif est obligatoire.' }],
      });
    }

    const updated = await this.prisma.measuringDevice.update({
      where: { id },
      data: { status: 'OUT_OF_SERVICE' },
    });

    await this.audit.record(
      {
        entity: 'measuring_device',
        entityId: id,
        action: 'OUT_OF_SERVICE',
        before: { status: device.status },
        after: { status: updated.status },
        reason,
        companyId: device.companyId,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /**
   * Remet un instrument en service.
   *
   * Refusé si son étalonnage a expiré : la remise en service ne remplace pas
   * un certificat.
   */
  async returnToService(
    user: RequestUser,
    id: string,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const device = await this.get(user, id);

    if (device.status !== 'OUT_OF_SERVICE') {
      throw new BadRequestException('Cet instrument n’est pas réformé.');
    }

    const today = startOfDay(new Date());
    if (!device.calibrationValidUntil || startOfDay(device.calibrationValidUntil) < today) {
      throw new BadRequestException(
        'Étalonnage expiré : enregistrez un certificat valide avant la remise en service.',
      );
    }

    const updated = await this.prisma.measuringDevice.update({
      where: { id },
      data: { status: 'AVAILABLE' },
    });

    await this.audit.record(
      {
        entity: 'measuring_device',
        entityId: id,
        action: 'RETURN_TO_SERVICE',
        before: { status: device.status },
        after: { status: updated.status },
        companyId: device.companyId,
      },
      { user, ...ctx },
    );

    return updated;
  }
}

/* ── Dates ────────────────────────────────────────────────────────── */

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}
