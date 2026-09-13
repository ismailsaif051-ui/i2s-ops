/**
 * Charge le parc d'équipements des clients de démonstration.
 *
 * Séparé du jeu principal : il se rejoue seul, sans repasser par les affaires
 * et les missions. Les équipements existants ne sont pas dupliqués.
 *
 *   npm run db:demo:assets
 */
import { PrismaClient } from '@prisma/client';
import { ASSET_TEMPLATES } from './demo/assets';

const prisma = new PrismaClient();

/** Aujourd'hui, à minuit UTC — la référence de toutes les échéances. */
function today(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function addYears(date: Date, years: number): Date {
  const next = new Date(date);
  next.setUTCFullYear(next.getUTCFullYear() + years);
  return next;
}

/**
 * Répartit les échéances autour d'aujourd'hui.
 *
 * Un parc réel n'est jamais entièrement à jour : quelques contrôles sont
 * échus, d'autres arrivent à terme, la majorité est en règle. C'est ce que
 * l'écran doit montrer.
 */
function nextDue(index: number, intervalM: number): Date {
  const base = today();

  if (index % 7 === 0) return addMonths(base, -2); // échu
  if (index % 7 === 1) return addMonths(base, 1); // sous 60 jours
  if (index % 7 === 2) return addMonths(base, 2);
  return addMonths(base, Math.max(3, Math.round(intervalM / 2)));
}

async function main() {
  const clients = await prisma.client.findMany({
    where: { deletedAt: null },
    select: { id: true, code: true, name: true },
  });
  const byCode = new Map(clients.map((c) => [c.code, c]));

  let created = 0;
  let skipped = 0;
  const missing = new Set<string>();

  for (const [index, template] of ASSET_TEMPLATES.entries()) {
    const client = byCode.get(template.client);
    if (!client) {
      missing.add(template.client);
      continue;
    }

    const existing = await prisma.asset.findFirst({
      where: { clientId: client.id, tag: template.tag, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    // Un site du client, quand il en a un : l'équipement vit quelque part.
    const site = await prisma.site.findFirst({
      where: { project: { affair: { clientId: client.id } } },
      select: { id: true },
    });

    await prisma.asset.create({
      data: {
        clientId: client.id,
        siteId: site?.id ?? null,
        tag: template.tag,
        type: template.type,
        brand: template.brand ?? null,
        model: template.model ?? null,
        serialNumber: template.serialPrefix
          ? `${template.serialPrefix}-${String(10_000 + index * 137).slice(0, 5)}`
          : null,
        commissioningDate: addYears(today(), -template.ageYears),
        inspectionIntervalM: template.intervalM,
        regulatoryRef: template.regulatoryRef,
        nextInspectionDue: nextDue(index, template.intervalM),
      },
    });
    created += 1;
  }

  console.log(`${created} équipement(s) créé(s), ${skipped} déjà présent(s)`);
  if (missing.size > 0) {
    console.log(`clients introuvables, équipements ignorés : ${[...missing].join(', ')}`);
  }

  const total = await prisma.asset.count({ where: { deletedAt: null } });
  const late = await prisma.asset.count({
    where: { deletedAt: null, nextInspectionDue: { lt: today() } },
  });
  console.log(`parc : ${total} équipements · ${late} contrôle(s) échu(s)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
