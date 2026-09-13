/**
 * Rattache une saisie aux rapports du jeu de démonstration.
 *
 * Les rapports de démonstration sont créés directement, sans passer par la
 * saisie terrain. Sans ce rattrapage, ouvrir un rapport ne montre qu'un
 * en-tête vide : on ne peut ni relire ce qui a été mesuré, ni renvoyer le
 * rapport en correction — le rédacteur n'aurait rien à reprendre.
 *
 * Le contenu est produit à partir du schéma du formulaire lui-même, donc les
 * trois paradigmes (mesures, check-list, critères) sont couverts.
 */
import type { PrismaClient } from '@prisma/client';
import { fillInspection } from './inspection-data';
import type { Random } from './fixtures';

/** Statuts pour lesquels une saisie doit exister et être consultable. */
const NEEDS_INSPECTION = ['DRAFT', 'SUBMITTED', 'UNDER_CHECK', 'CORRECTION'] as const;

export async function attachInspections(
  prisma: PrismaClient,
  companyId: string,
  rng: Random,
): Promise<number> {
  const templates = await prisma.inspectionTemplate.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { formCode: 'asc' },
  });
  if (templates.length === 0) return 0;

  const reports = await prisma.report.findMany({
    where: { inspectionId: null, status: { in: [...NEEDS_INSPECTION] } },
    include: {
      mission: {
        select: {
          id: true,
          actualEndDate: true,
          plannedStartDate: true,
          site: { select: { name: true } },
        },
      },
      affair: { select: { number: true, client: { select: { name: true } } } },
      author: { select: { firstName: true, lastName: true } },
    },
  });

  const devices = await prisma.measuringDevice.findMany({
    where: { companyId, deletedAt: null },
    select: {
      id: true,
      code: true,
      brand: true,
      model: true,
      serialNumber: true,
      calibrationValidUntil: true,
    },
    orderBy: { code: 'asc' },
  });

  let created = 0;

  for (const report of reports) {
    // Le formulaire se lit dans le numéro : PR01-F02-26-0255.
    const template =
      templates.find((t) => report.number.startsWith(t.formCode)) ?? templates[0]!;

    const date = report.mission.actualEndDate ?? report.mission.plannedStartDate ?? new Date();

    // Un instrument encore étalonné à la date de l'essai : un rapport de
    // démonstration ne doit pas naître bloqué par sa propre règle métier.
    const usable = devices.filter(
      (d) => d.calibrationValidUntil !== null && d.calibrationValidUntil >= date,
    );
    if (usable.length === 0) continue;

    const device = rng.pick(usable);
    const designation = [device.brand, device.model].filter(Boolean).join(' ');
    const deviceLabel = `${device.code}${designation ? ` — ${designation}` : ''}${
      device.serialNumber ? ` n° ${device.serialNumber}` : ''
    }`;

    // Un rapport renvoyé en correction porte l'écart qui l'a fait renvoyer.
    const withFinding = report.status === 'CORRECTION' || rng.chance(0.15);

    const data = fillInspection(
      template.schema as never,
      {
        client: report.affair.client.name,
        affairNumber: report.affair.number,
        site: report.mission.site?.name ?? null,
        inspector: `${report.author.lastName.toUpperCase()} ${report.author.firstName}`,
        date,
        deviceLabel,
        withFinding,
      },
      rng,
    );

    const inspection = await prisma.inspection.create({
      data: {
        missionId: report.missionId,
        templateId: template.id,
        templateVersion: template.version,
        inspectorId: report.authorId,
        date,
        data: data as never,
        status: report.status === 'DRAFT' || report.status === 'CORRECTION' ? 'DRAFT' : 'SUBMITTED',
        devices: {
          create: [
            {
              measuringDeviceId: device.id,
              calibrationValidAt: device.calibrationValidUntil,
            },
          ],
        },
      },
    });

    await prisma.report.update({
      where: { id: report.id },
      data: { inspectionId: inspection.id, templateId: template.id },
    });

    created += 1;
  }

  return created;
}
