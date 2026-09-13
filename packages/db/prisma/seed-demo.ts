/**
 * ═══════════════════════════════════════════════════════════════════════
 *  JEU DE SIMULATION — DONNÉES ENTIÈREMENT FICTIVES
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Génère un exercice complet (janvier → aujourd'hui) pour démontrer la
 * plateforme : affaires, missions, pointage, rapports, attachements,
 * factures, frais, flotte, étalonnages et non-conformités.
 *
 * Aucune donnée ne correspond à la réalité d'I2S TESTING. Le paramètre
 * `demo.enabled` est positionné à `true` : l'application affiche alors un
 * bandeau permanent « données de démonstration » (cahier des charges §21).
 *
 *   npm run db:demo          charge le jeu
 *   npm run db:demo -- --reset   purge puis recharge
 */
import { randomBytes } from 'node:crypto';
import { hash } from '@node-rs/argon2';
import { PrismaClient, Prisma } from '@prisma/client';
import { DEFAULT_PATTERNS, type NumberScope } from '@i2s/contracts';
import {
  AFFAIRS,
  CERTIFICATIONS,
  CLIENTS,
  DEVICES,
  EMPLOYEES,
  MISSION_LABELS,
  NON_CONFORMITIES,
  CONTROL_LOCATIONS,
  MISSION_FORMS,
  OPPORTUNITIES,
  WON_OPPORTUNITIES,
  PILOT_INITIALS,
  PO_NUMBER_FORMATS,
  ROUTINE_AFFAIRS,
  VEHICLES,
  makeRandom,
  type Random,
} from './demo/fixtures';
import { TEMPLATES } from './demo/templates';
import { attachInspections } from './demo/attach-inspections';

const prisma = new PrismaClient();
const rng = makeRandom();

const TODAY = startOfDay(new Date());
const YEAR = TODAY.getUTCFullYear();
const DEMO_DOMAIN = 'demo.i2s-testing.ma';

/** Taux d'occupation visé par inspecteur — pilote le volume de jours non affectés. */
const OCCUPANCY: Record<string, number> = {
  C0101: 0.4, C0102: 0.82, C0103: 0.45, C0104: 0.8, C0105: 0.68, C0106: 0.85, C0107: 0.76,
  E0201: 0.35, E0202: 0.78, E0203: 0.83, E0204: 0.55, E0205: 0.72,
  T0301: 0.45, T0302: 0.8, T0303: 0.74,
};

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Le jeu de démonstration ne doit pas être chargé en production.');
  }

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  JEU DE SIMULATION I2S OPS — DONNÉES FICTIVES            ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const company = await prisma.company.findUnique({ where: { code: 'I2S' } });
  if (!company) {
    throw new Error('Référentiels absents. Lancez d’abord « npm run db:seed ».');
  }

  await purge();

  const departments = await prisma.department.findMany({ where: { companyId: company.id } });
  const deptId = new Map(departments.map((d) => [d.code, d.id]));

  const workingDays = await loadWorkingDays(company.id);
  if (workingDays.length === 0) {
    throw new Error('Calendrier ouvré absent. Lancez « npm run db:seed ».');
  }
  console.log(`  Calendrier : ${workingDays.length} jours ouvrés du 1er janvier à aujourd'hui`);

  const employees = await createEmployees(company.id, deptId);
  const demoPassword = await createUsers(company.id, deptId, employees);
  await createCertifications(employees);
  const clients = await createClients(company.id);
  await createOpportunities(clients, deptId, employees);
  const affairs = await createAffairs(company.id, clients, deptId, employees);
  await createWonOpportunities(affairs, deptId, employees);
  const vehicles = await createVehicles(company.id, deptId, employees);
  await createDevices(company.id, deptId, employees);

  const missions = await createMissionsAndTimesheets(
    affairs,
    employees,
    departments,
    workingDays,
    vehicles,
  );

  await createReports(missions, employees, workingDays);
  const attachments = await createAttachments(affairs, missions, employees);
  await createInvoices(company.id, affairs, attachments);
  await createExpenses(company.id, employees, affairs, missions);
  await createNonConformities(affairs, employees);
  await createTemplates();
  const attached = await attachInspections(prisma, company.id, rng);
  console.log(`  ${attached} saisies rattachées aux rapports en circuit`);
  await createNotifications(employees);
  await syncNumberSequences(company.id);

  await prisma.setting.upsert({
    where: { companyId_key: { companyId: company.id, key: 'demo.enabled' } },
    update: { value: true },
    create: { companyId: company.id, key: 'demo.enabled', value: true },
  });
  await prisma.setting.upsert({
    where: { companyId_key: { companyId: company.id, key: 'demo.generatedAt' } },
    update: { value: TODAY.toISOString() },
    create: { companyId: company.id, key: 'demo.generatedAt', value: TODAY.toISOString() },
  });

  await summary(demoPassword);
}

/* ═══════════════════════════════════════════════════════════════════
 *  Recalage des compteurs
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * Aligne les séquences sur les numéros que le jeu vient d'écrire.
 *
 * Les pièces de démonstration sont numérotées directement, sans passer par le
 * service de numérotation. Sans ce recalage, la première pièce créée depuis
 * l'application repartirait à 0001 et heurterait un numéro déjà pris — la
 * contrainte d'unicité fait alors échouer la soumission d'un rapport.
 */
async function syncNumberSequences(companyId: string) {
  /** Dernier rang utilisé : le groupe de chiffres le plus à droite du numéro. */
  const lastRank = (numbers: Array<{ number: string }>): number =>
    numbers.reduce((max, row) => {
      const groups = row.number.match(/d+/g);
      const tail = groups?.[groups.length - 1];
      const rank = tail ? Number.parseInt(tail, 10) : 0;
      return Number.isFinite(rank) && rank > max ? rank : max;
    }, 0);

  const used: Array<{ scope: NumberScope; rows: Array<{ number: string }> }> = [
    { scope: 'AFFAIR', rows: await prisma.affair.findMany({ select: { number: true } }) },
    { scope: 'MISSION', rows: await prisma.mission.findMany({ select: { number: true } }) },
    { scope: 'MISSION_ORDER', rows: await prisma.missionOrder.findMany({ select: { number: true } }) },
    { scope: 'REPORT', rows: await prisma.report.findMany({ select: { number: true } }) },
    { scope: 'ATTACHMENT', rows: await prisma.attachmentSheet.findMany({ select: { number: true } }) },
    { scope: 'INVOICE', rows: await prisma.invoice.findMany({ select: { number: true } }) },
    { scope: 'NON_CONFORMITY', rows: await prisma.nonConformity.findMany({ select: { number: true } }) },
    { scope: 'OFFER', rows: await prisma.offer.findMany({ select: { number: true } }) },
  ];

  let recalibrated = 0;

  for (const { scope, rows } of used) {
    if (rows.length === 0) continue;

    const next = lastRank(rows) + 1;
    await prisma.numberSequence.upsert({
      where: { companyId_scope_year: { companyId, scope, year: YEAR } },
      update: { next },
      create: { companyId, scope, year: YEAR, pattern: DEFAULT_PATTERNS[scope], next, padding: 4 },
    });
    recalibrated += 1;
  }

  console.log(`  ${recalibrated} compteurs recalés sur les numéros du jeu`);
}

/* ═══════════════════════════════════════════════════════════════════
 *  Purge
 * ═══════════════════════════════════════════════════════════════════ */

async function purge() {
  console.log('→ Purge du jeu précédent');

  // Le journal d'audit n'est jamais purgé : il est en ajout seul par conception.
  await prisma.department.updateMany({ data: { managerId: null } });

  await prisma.advanceSettlement.deleteMany();
  await prisma.advance.deleteMany();
  await prisma.expenseApproval.deleteMany();
  await prisma.expenseLine.deleteMany();
  await prisma.expenseReport.deleteMany();

  await prisma.dunning.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.creditNote.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoiceAttachment.deleteMany();
  await prisma.invoice.deleteMany();

  await prisma.attachmentLine.deleteMany();
  await prisma.attachmentSheet.deleteMany();

  await prisma.reportDistribution.deleteMany();
  await prisma.reportCheck.deleteMany();
  await prisma.report.deleteMany();

  await prisma.nonConformity.deleteMany();
  await prisma.finding.deleteMany();
  await prisma.inspectionDevice.deleteMany();
  await prisma.inspection.deleteMany();

  await prisma.timesheetDay.deleteMany();

  await prisma.missionOrderApproval.deleteMany();
  await prisma.missionOrder.deleteMany();
  await prisma.missionAssignment.deleteMany();
  await prisma.vehicleBooking.deleteMany();
  await prisma.mission.deleteMany();

  await prisma.site.deleteMany();
  await prisma.project.deleteMany();
  await prisma.affairBudgetLine.deleteMany();
  await prisma.affairRate.deleteMany();
  await prisma.affair.deleteMany();

  await prisma.followUp.deleteMany();
  await prisma.offerLine.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.tender.deleteMany();
  await prisma.opportunity.deleteMany();

  await prisma.asset.deleteMany();
  await prisma.calibrationRecord.deleteMany();
  await prisma.measuringDevice.deleteMany();

  await prisma.fuelLog.deleteMany();
  await prisma.vehicleMaintenance.deleteMany();
  await prisma.vehicleInsurance.deleteMany();
  await prisma.vehicle.deleteMany();

  await prisma.contact.deleteMany();
  await prisma.client.deleteMany();

  await prisma.leaveRequest.deleteMany();
  await prisma.training.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.employeeSkill.deleteMany();
  await prisma.employeeDailyCost.deleteMany();

  await prisma.user.deleteMany({ where: { email: { endsWith: `@${DEMO_DOMAIN}` } } });
  await prisma.notification.deleteMany();
  await prisma.employee.deleteMany();

  await prisma.numberSequence.deleteMany();
}

/* ═══════════════════════════════════════════════════════════════════
 *  Employés, coûts, comptes
 * ═══════════════════════════════════════════════════════════════════ */

type EmployeeRecord = { id: string; matricule: string; dept: string; isInspector: boolean; baseCost: number };

async function createEmployees(companyId: string, deptId: Map<string, string>) {
  const created = new Map<string, EmployeeRecord>();

  for (const e of EMPLOYEES) {
    const row = await prisma.employee.create({
      data: {
        companyId,
        matricule: e.matricule,
        firstName: e.firstName,
        lastName: e.lastName,
        departmentId: deptId.get(e.dept) ?? null,
        position: e.position,
        email: `${e.firstName}.${e.lastName}`.toLowerCase().replace(/[^a-z.]/g, '') + `@${DEMO_DOMAIN}`,
        phone: `06${rng.int(10, 99)}${rng.int(100000, 999999)}`,
        hireDate: new Date(Date.UTC(YEAR - rng.int(1, 12), rng.int(0, 11), rng.int(1, 28))),
        contractType: 'CDI',
        isInspector: e.isInspector,
      },
    });
    created.set(e.matricule, {
      id: row.id,
      matricule: e.matricule,
      dept: e.dept,
      isInspector: e.isInspector,
      baseCost: e.baseCost,
    });
  }

  // Hiérarchie
  for (const e of EMPLOYEES) {
    if (!e.managerMatricule) continue;
    await prisma.employee.update({
      where: { id: created.get(e.matricule)!.id },
      data: { managerId: created.get(e.managerMatricule)!.id },
    });
  }

  // Chefs de département
  for (const e of EMPLOYEES.filter((x) => x.roleCode === 'DEPT_HEAD')) {
    const id = deptId.get(e.dept);
    if (id) await prisma.department.update({ where: { id }, data: { managerId: created.get(e.matricule)!.id } });
  }

  // Coût journalier historisé : T1, T2, T3 — l'historique n'est jamais écrasé.
  const periods = [
    { from: new Date(Date.UTC(YEAR, 0, 1)), to: new Date(Date.UTC(YEAR, 2, 31)), factor: 1, label: 'Barème T1 — grille annuelle' },
    { from: new Date(Date.UTC(YEAR, 3, 1)), to: new Date(Date.UTC(YEAR, 5, 30)), factor: 1.03, label: 'Revalorisation trimestrielle T2 (+3 %)' },
    { from: new Date(Date.UTC(YEAR, 6, 1)), to: null, factor: 1.06, label: 'Revalorisation trimestrielle T3 (+3 %)' },
  ];

  const costs: Prisma.EmployeeDailyCostCreateManyInput[] = [];
  for (const e of EMPLOYEES) {
    const emp = created.get(e.matricule)!;
    for (const p of periods) {
      costs.push({
        employeeId: emp.id,
        validFrom: p.from,
        validTo: p.to,
        amount: new Prisma.Decimal(Math.round(e.baseCost * p.factor)),
        currency: 'MAD',
        reason: p.label,
      });
    }
  }
  await prisma.employeeDailyCost.createMany({ data: costs });

  console.log(`  ${created.size} employés, ${costs.length} périodes de coût journalier`);
  return created;
}

async function createUsers(
  companyId: string,
  deptId: Map<string, string>,
  employees: Map<string, EmployeeRecord>,
) {
  const password = process.env.DEMO_PASSWORD ?? `Demo${randomBytes(6).toString('base64url')}1`;
  const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });

  const roles = await prisma.role.findMany();
  const roleId = new Map(roles.map((r) => [r.code, r.id]));

  let count = 0;
  for (const e of EMPLOYEES) {
    const emp = employees.get(e.matricule)!;
    const email = `${e.roleCode.toLowerCase()}.${e.matricule.toLowerCase()}@${DEMO_DOMAIN}`;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        employeeId: emp.id,
        // Comptes de démonstration : pas de changement forcé, pour pouvoir
        // parcourir immédiatement chaque profil.
        mustChangePassword: false,
        lastLoginAt: rng.chance(0.7) ? addDays(TODAY, -rng.int(0, 20)) : null,
      },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: roleId.get(e.roleCode)!,
        companyId,
        departmentId: e.roleCode === 'DEPT_HEAD' ? (deptId.get(e.dept) ?? null) : null,
      },
    });
    count += 1;
  }

  console.log(`  ${count} comptes de démonstration (un par employé)`);
  return password;
}

async function createCertifications(employees: Map<string, EmployeeRecord>) {
  const rows: Prisma.CertificationCreateManyInput[] = CERTIFICATIONS.map((c) => {
    const expires = addMonths(TODAY, c.expiresInMonths);
    return {
      employeeId: employees.get(c.matricule)!.id,
      type: c.type,
      method: c.method,
      level: c.level,
      issuer: c.issuer,
      number: `${c.type.slice(0, 3).toUpperCase()}-${rng.int(10000, 99999)}`,
      issuedAt: addMonths(expires, -36),
      expiresAt: expires,
    };
  });
  await prisma.certification.createMany({ data: rows });

  const soon = rows.filter((r) => r.expiresAt! <= addMonths(TODAY, 2)).length;
  console.log(`  ${rows.length} certifications — ${soon} expirent sous 2 mois`);
}

/* ═══════════════════════════════════════════════════════════════════
 *  Commercial & affaires
 * ═══════════════════════════════════════════════════════════════════ */

async function createClients(companyId: string) {
  const map = new Map<string, string>();
  for (const c of CLIENTS) {
    const client = await prisma.client.create({
      data: {
        companyId,
        code: c.code,
        name: c.name,
        type: 'CLIENT',
        ice: String(rng.int(100000000000000, 999999999999999)),
        sector: c.sector,
        city: c.city,
        paymentTerms: c.paymentTerms,
        email: `contact@${c.code.toLowerCase()}.${DEMO_DOMAIN}`,
        phone: `05${rng.int(20, 39)}${rng.int(100000, 999999)}`,
        contacts: {
          create: c.contacts.map((ct, i) => ({
            firstName: ct.firstName,
            lastName: ct.lastName,
            role: ct.role,
            email: `${ct.firstName}.${ct.lastName}`.toLowerCase() + `@${c.code.toLowerCase()}.${DEMO_DOMAIN}`,
            phone: `06${rng.int(10, 99)}${rng.int(100000, 999999)}`,
            isPrimary: i === 0,
          })),
        },
      },
    });
    map.set(c.code, client.id);
  }
  console.log(`  ${map.size} clients et leurs contacts`);
  return map;
}

async function createOpportunities(
  clients: Map<string, string>,
  deptId: Map<string, string>,
  employees: Map<string, EmployeeRecord>,
) {
  for (const [index, o] of OPPORTUNITIES.entries()) {
    // Une affaire perdue l'a été à une date passée : lui laisser une échéance
    // à venir la ferait ressortir comme encore à décider.
    const decidedAt =
      o.stage === 'LOST' ? addDays(TODAY, -rng.int(20, 120)) : addDays(TODAY, rng.int(15, 150));

    const opportunity = await prisma.opportunity.create({
      data: {
        // La demande est arrivée avant la décision, et jamais dans le futur :
        // sans cela, toutes les consultations porteraient la date du jour où
        // la base a été montée, et certaines seraient reçues après leur propre
        // date de remise.
        createdAt:
          decidedAt <= TODAY
            ? addDays(decidedAt, -rng.int(25, 90))
            : addDays(TODAY, -rng.int(10, 90)),
        clientId: clients.get(o.clientCode)!,
        departmentId: deptId.get(o.dept) ?? null,
        title: o.title,
        stage: o.stage,
        amount: new Prisma.Decimal(o.amount),
        probability: o.probability,
        expectedCloseDate: decidedAt,
        ownerId: employees.get(o.owner)!.id,
        lostCause: o.lostCause ?? null,
        lostReason: o.lostReason ?? null,
      },
    });

    if (o.tender) {
      await prisma.tender.create({
        data: {
          opportunityId: opportunity.id,
          reference: o.tender.reference,
          publisher: o.tender.publisher,
          submissionDeadline: addDays(TODAY, o.tender.deadlineInDays),
          openingDate: addDays(TODAY, o.tender.deadlineInDays + o.tender.openingAfterDays),
          guaranteeAmount: new Prisma.Decimal(o.tender.guarantee),
          // Le dossier n'est « déposé » que lorsqu'une offre est partie.
          status:
            o.stage === 'LOST'
              ? 'CLOSED'
              : ['OFFER_SENT', 'FOLLOW_UP', 'NEGOTIATION'].includes(o.stage)
                ? 'SUBMITTED'
                : 'IDENTIFIED',
        },
      });
    }

    // « Offre en préparation » sans offre serait une étape qui ment : le
    // dossier est en cours de chiffrage, l'offre existe donc, non envoyée.
    if (['OFFER_SENT', 'FOLLOW_UP', 'NEGOTIATION', 'LOST', 'OFFER_DRAFT'].includes(o.stage)) {
      await prisma.offer.create({
        data: {
          opportunityId: opportunity.id,
          number: `OFF-${String(YEAR % 100)}-${String(index + 1).padStart(4, '0')}`,
          version: 1,
          amountHT: new Prisma.Decimal(o.amount),
          validUntil: addDays(TODAY, 45),
          status:
            o.stage === 'LOST' ? 'REJECTED' : o.stage === 'OFFER_DRAFT' ? 'DRAFT' : 'SENT',
          // Une offre en préparation n'a pas de date d'envoi.
          sentAt: o.stage === 'OFFER_DRAFT' ? null : addDays(TODAY, -rng.int(10, 90)),
          lines: {
            create: [
              {
                position: 1,
                designation: o.title,
                unit: 'vacation',
                quantity: new Prisma.Decimal(rng.int(40, 180)),
                unitPrice: new Prisma.Decimal(rng.int(1500, 2400)),
                amountHT: new Prisma.Decimal(o.amount),
              },
            ],
          },
        },
      });
    }

    if (['FOLLOW_UP', 'NEGOTIATION'].includes(o.stage)) {
      await prisma.followUp.create({
        data: {
          opportunityId: opportunity.id,
          date: addDays(TODAY, -rng.int(3, 25)),
          channel: rng.pick(['EMAIL', 'PHONE', 'VISIT']),
          outcome: 'Relance effectuée, décision attendue.',
          nextActionDate: addDays(TODAY, rng.int(3, 20)),
        },
      });
    }
  }
  console.log(`  ${OPPORTUNITIES.length} opportunités commerciales`);
}

/**
 * L'histoire commerciale des affaires déjà gagnées.
 *
 * Une opportunité ne se déclare pas gagnée : c'est l'acceptation d'une offre
 * qui la gagne et qui ouvre l'affaire. Le jeu de simulation reconstitue donc
 * exactement cet état — offre acceptée, opportunité à 100 %, affaire rattachée
 * et bon de commande repris — plutôt qu'un état que l'application refuserait
 * elle-même de produire. Sans cela, l'entonnoir afficherait un taux de
 * transformation nul, ce qui serait faux.
 */
async function createWonOpportunities(
  affairs: AffairRecord[],
  deptId: Map<string, string>,
  employees: Map<string, EmployeeRecord>,
) {
  let created = 0;

  for (const [index, w] of WON_OPPORTUNITIES.entries()) {
    const record = affairs.find((a) => a.seq === w.affairSeq);
    if (!record) continue;

    const affair = await prisma.affair.findUnique({
      where: { id: record.id },
      select: { id: true, title: true, offerAmountHT: true, poAmountHT: true, poNumber: true },
    });
    if (!affair) continue;

    const offered = Number(affair.offerAmountHT ?? record.contractAmount);
    const ordered = Math.round(offered * (1 + w.negotiationRate / 100));
    const decidedAt = addDays(record.startDate, -w.daysBeforeStart);

    const opportunity = await prisma.opportunity.create({
      data: {
        createdAt: addDays(decidedAt, -rng.int(25, 90)),
        clientId: record.clientId,
        departmentId: deptId.get(record.dept) ?? null,
        title: affair.title,
        stage: 'WON',
        amount: new Prisma.Decimal(offered),
        probability: 100,
        expectedCloseDate: decidedAt,
        ownerId: employees.get(w.owner)!.id,
      },
    });

    if (w.tender) {
      await prisma.tender.create({
        data: {
          opportunityId: opportunity.id,
          reference: w.tender.reference,
          publisher: w.tender.publisher,
          submissionDeadline: addDays(TODAY, w.tender.deadlineInDays),
          openingDate: addDays(TODAY, w.tender.deadlineInDays + w.tender.openingAfterDays),
          guaranteeAmount: new Prisma.Decimal(w.tender.guarantee),
          status: 'AWARDED',
        },
      });
    }

    const offer = await prisma.offer.create({
      data: {
        opportunityId: opportunity.id,
        number: `OFF-${String(YEAR % 100)}-${String(OPPORTUNITIES.length + index + 1).padStart(4, '0')}`,
        version: 1,
        amountHT: new Prisma.Decimal(offered),
        validUntil: addDays(decidedAt, 45),
        status: 'ACCEPTED',
        sentAt: addDays(decidedAt, -rng.int(12, 40)),
        lines: {
          create: [
            {
              position: 1,
              designation: affair.title,
              unit: 'vacation',
              quantity: new Prisma.Decimal(rng.int(40, 180)),
              unitPrice: new Prisma.Decimal(rng.int(1500, 2400)),
              amountHT: new Prisma.Decimal(offered),
            },
          ],
        },
      },
    });

    for (let i = 0; i < w.followUps; i += 1) {
      await prisma.followUp.create({
        data: {
          opportunityId: opportunity.id,
          date: addDays(decidedAt, -rng.int(5, 30)),
          channel: rng.pick(['EMAIL', 'PHONE', 'VISIT']),
          outcome: rng.pick([
            'Point technique avec le client, périmètre confirmé.',
            'Relance sur la décision, arbitrage budgétaire en cours.',
            'Visite du site, planning d’intervention discuté.',
          ]),
          nextActionDate: null,
        },
      });
    }

    // L'affaire porte désormais son origine commerciale, comme le ferait
    // l'acceptation de l'offre depuis l'application.
    await prisma.affair.update({
      where: { id: affair.id },
      data: {
        opportunityId: opportunity.id,
        offerId: offer.id,
        offerAmountHT: new Prisma.Decimal(offered),
        poAmountHT: new Prisma.Decimal(ordered),
        poNumber: affair.poNumber ?? `BC ${rng.int(10000, 89999)}`,
        commercialStatus: 'GAGNEE',
      },
    });

    created += 1;
  }

  console.log(`  ${created} affaires rattachées à leur offre acceptée`);
}

interface AffairRecord {
  id: string;
  seq: number;
  number: string;
  dept: string;
  dailyRate: number;
  contractAmount: number;
  budgetMarginRate: number;
  clientId: string;
  siteId: string;
  projectId: string;
  startDate: Date;
  endDate: Date;
  troubled: boolean;
}

async function createAffairs(
  companyId: string,
  clients: Map<string, string>,
  deptId: Map<string, string>,
  employees: Map<string, EmployeeRecord>,
) {
  const records: AffairRecord[] = [];

  // Correspondance initiales → matricule, comme au registre « Suivi Cde Partagé ».
  const byInitials = new Map(
    Object.entries(PILOT_INITIALS).map(([matricule, initials]) => [initials, matricule]),
  );
  const resolve = (initials: string): string | null => {
    const matricule = byInitials.get(initials);
    return matricule ? (employees.get(matricule)?.id ?? null) : null;
  };

  for (const a of AFFAIRS) {
    const number = `${String(YEAR % 100)}/${String(a.seq).padStart(4, '0')}`;
    const startDate = new Date(Date.UTC(YEAR, a.startMonth - 1, 1));
    const endDate = new Date(Date.UTC(YEAR, a.startMonth - 1 + a.months, 0));
    const budget = Math.round(a.contractAmount * (1 - a.budgetMarginRate / 100));
    const offerAmount = a.offerAmount ?? a.contractAmount;
    const won = a.commercialStatus === 'GAGNEE';

    const affair = await prisma.affair.create({
      data: {
        companyId,
        number,
        clientId: clients.get(a.clientCode)!,
        title: a.title,
        departmentId: deptId.get(a.dept) ?? null,
        accountManagerId: employees.get(a.accountManager)!.id,
        pilotId: resolve(a.pilot),
        pilotInitials: a.pilot,
        preparedById: resolve(a.preparedBy),
        preparedByInitials: a.preparedBy,
        physicalFileOpened: a.physicalFileOpened,
        controlLocation: a.site.name,
        offerAmountHT: new Prisma.Decimal(offerAmount),
        poAmountHT: won ? new Prisma.Decimal(a.poAmount ?? a.contractAmount) : null,
        poNumber: a.poNumber ?? null,
        contractAmountHT: new Prisma.Decimal(a.contractAmount),
        budgetAmount: new Prisma.Decimal(budget),
        dailyRate: new Prisma.Decimal(a.dailyRate),
        budgetMarginRate: new Prisma.Decimal(a.budgetMarginRate),
        creationDate: startDate,
        startDate,
        endDate,
        commercialStatus: a.commercialStatus,
        worksStatus: a.worksStatus,
        status: a.status,
        observation: a.observation ?? null,
        purchaseOrderRef: a.poNumber ?? null,
        services: a.extraServices?.length
          ? {
              create: a.extraServices
                .map((code) => deptId.get(code))
                .filter((id): id is string => Boolean(id))
                .map((departmentId) => ({ departmentId })),
            }
          : undefined,
        budgetLines: {
          create: [
            { category: 'LABOUR', plannedAmount: new Prisma.Decimal(Math.round(budget * 0.62)) },
            { category: 'EXPENSES', plannedAmount: new Prisma.Decimal(Math.round(budget * 0.16)) },
            { category: 'VEHICLES', plannedAmount: new Prisma.Decimal(Math.round(budget * 0.1)) },
            { category: 'SUBCONTRACTING', plannedAmount: new Prisma.Decimal(Math.round(budget * 0.07)) },
            { category: 'OTHER', plannedAmount: new Prisma.Decimal(Math.round(budget * 0.05)) },
          ],
        },
        rates: {
          create: [
            {
              serviceType: a.dept,
              unit: 'vacation',
              unitPrice: new Prisma.Decimal(a.dailyRate),
              validFrom: startDate,
            },
          ],
        },
      },
    });

    const project = await prisma.project.create({
      data: {
        affairId: affair.id,
        code: 'P01',
        name: a.title,
        startDate,
        endDate,
        status: a.status === 'COMPLETED' ? 'CLOSED' : 'OPEN',
      },
    });

    const site = await prisma.site.create({
      data: {
        projectId: project.id,
        name: a.site.name,
        city: a.site.city,
        region: a.site.region,
        distanceFromHqKm: a.site.distanceKm,
        accessConstraints:
          a.site.distanceKm > 150
            ? 'Site éloigné — hébergement sur place, badge d’accès à demander 48 h à l’avance.'
            : 'Accès véhicule autorisé, badge visiteur à retirer à l’accueil.',
        hseRequirements: 'EPI complets, permis de travail, accueil sécurité obligatoire.',
      },
    });

    records.push({
      id: affair.id,
      seq: a.seq,
      number,
      dept: a.dept,
      dailyRate: a.dailyRate,
      contractAmount: a.contractAmount,
      budgetMarginRate: a.budgetMarginRate,
      clientId: clients.get(a.clientCode)!,
      siteId: site.id,
      projectId: project.id,
      startDate,
      endDate,
      troubled: a.troubled ?? false,
    });
  }

  const structuring = records.length;

  // ── Affaires courantes ──────────────────────────────────────────
  // Le registre réel est dominé par de courtes interventions ; on reproduit
  // cette distribution pour que les volumes et les moyennes soient crédibles.
  const clientCodes = [...clients.keys()];
  const pilots = Object.keys(PILOT_INITIALS);
  const currentMonth = TODAY.getUTCMonth();
  let seq = 100;

  for (let i = 0; i < 62; i += 1) {
    const template = rng.pick(ROUTINE_AFFAIRS);
    const dept = template.dept;
    const offerAmount = rng.int(template.min, template.max);

    // 60 % gagnées, 34 % en attente de commande, 6 % perdues ou annulées.
    const roll = rng.next();
    const commercialStatus =
      roll < 0.6 ? 'GAGNEE' : roll < 0.94 ? 'SUIVANT_OP' : 'PERDUE_ANNULEE';

    const month = rng.int(0, currentMonth);
    const startDate = new Date(Date.UTC(YEAR, month, rng.int(1, 26)));
    const durationDays = rng.int(template.days[0], template.days[1]);
    const endDate = addDays(startDate, durationDays + rng.int(2, 20));

    const worksStatus =
      commercialStatus === 'PERDUE_ANNULEE'
        ? 'PERDU_ANNULE'
        : commercialStatus === 'SUIVANT_OP'
          ? 'NON_DEMARRE'
          : endDate < addDays(TODAY, -45)
            ? rng.chance(0.8)
              ? 'FAC_TOTALE'
              : 'FAC_PARTIELLE'
            : endDate < TODAY
              ? rng.chance(0.5)
                ? 'A_FACTURER'
                : 'EN_COURS'
              : 'EN_COURS';

    const status =
      commercialStatus === 'PERDUE_ANNULEE'
        ? 'CANCELLED'
        : commercialStatus === 'SUIVANT_OP'
          ? 'PROSPECT'
          : worksStatus === 'FAC_TOTALE'
            ? 'COMPLETED'
            : 'IN_PROGRESS';

    seq += 1;
    const pilotMatricule = rng.pick(pilots);
    const preparerMatricule = rng.pick(pilots);
    const clientCode = rng.pick(clientCodes);
    const dailyRate = rng.int(1400, 2400);
    const budgetMarginRate = rng.int(18, 38);
    const won = commercialStatus === 'GAGNEE';

    const affair = await prisma.affair.create({
      data: {
        companyId,
        number: `${String(YEAR % 100)}/${String(seq).padStart(4, '0')}`,
        clientId: clients.get(clientCode)!,
        title: template.label,
        departmentId: deptId.get(dept) ?? null,
        accountManagerId: employees.get(rng.chance(0.7) ? 'A0009' : 'A0010')!.id,
        pilotId: employees.get(pilotMatricule)?.id ?? null,
        pilotInitials: PILOT_INITIALS[pilotMatricule] ?? null,
        preparedById: employees.get(preparerMatricule)?.id ?? null,
        preparedByInitials: PILOT_INITIALS[preparerMatricule] ?? null,
        physicalFileOpened: won && rng.chance(0.6),
        controlLocation: rng.pick(CONTROL_LOCATIONS),
        offerAmountHT: new Prisma.Decimal(offerAmount),
        poAmountHT: won ? new Prisma.Decimal(offerAmount) : null,
        poNumber: won ? makePoNumber() : null,
        contractAmountHT: won ? new Prisma.Decimal(offerAmount) : null,
        budgetAmount: new Prisma.Decimal(Math.round(offerAmount * (1 - budgetMarginRate / 100))),
        dailyRate: new Prisma.Decimal(dailyRate),
        budgetMarginRate: new Prisma.Decimal(budgetMarginRate),
        creationDate: startDate,
        startDate,
        endDate,
        commercialStatus,
        worksStatus,
        status,
        observation:
          commercialStatus === 'SUIVANT_OP'
            ? 'En attente du bon de commande client.'
            : commercialStatus === 'PERDUE_ANNULEE'
              ? rng.pick(['Prix non retenu.', 'Projet client annulé.', 'Délai incompatible.'])
              : null,
      },
    });

    // Les affaires gagnées portent un projet et un site, support des missions.
    if (won) {
      const project = await prisma.project.create({
        data: {
          affairId: affair.id,
          code: 'P01',
          name: template.label,
          startDate,
          endDate,
          status: worksStatus === 'FAC_TOTALE' ? 'CLOSED' : 'OPEN',
        },
      });
      const location = rng.pick(CONTROL_LOCATIONS);
      const site = await prisma.site.create({
        data: {
          projectId: project.id,
          name: location,
          city: location.split('—').pop()?.trim() ?? location,
          distanceFromHqKm: rng.int(5, 480),
          hseRequirements: 'EPI complets, accueil sécurité obligatoire.',
        },
      });

      records.push({
        id: affair.id,
        seq,
        number: affair.number,
        dept,
        dailyRate,
        contractAmount: offerAmount,
        budgetMarginRate,
        clientId: clients.get(clientCode)!,
        siteId: site.id,
        projectId: project.id,
        startDate,
        endDate,
        troubled: false,
      });
    }
  }

  console.log(
    `  ${records.length} affaires (${structuring} structurantes, ${records.length - structuring} courantes gagnées) + projets et sites`,
  );
  return records;
}

function makePoNumber(): string {
  const format = rng.pick(PO_NUMBER_FORMATS);
  return format
    .replace('{n}', String(rng.int(1000, 99999)))
    .replace('{s}', String(rng.int(10, 99)));
}

/* ═══════════════════════════════════════════════════════════════════
 *  Flotte & instruments
 * ═══════════════════════════════════════════════════════════════════ */

async function createVehicles(
  companyId: string,
  deptId: Map<string, string>,
  employees: Map<string, EmployeeRecord>,
) {
  const list: Array<{ id: string; dept: string }> = [];

  for (const v of VEHICLES) {
    const vehicle = await prisma.vehicle.create({
      data: {
        companyId,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        type: v.type,
        departmentId: deptId.get(v.dept) ?? null,
        assignedToId: v.assignedTo ? employees.get(v.assignedTo)!.id : null,
        ownership: v.ownership,
        monthlyFee: v.monthlyFee ? new Prisma.Decimal(v.monthlyFee) : null,
        contractEndDate: v.ownership === 'OWNED' ? null : addMonths(TODAY, rng.int(4, 30)),
        currentKm: v.km,
        status: 'AVAILABLE',
        insurances: {
          create: [
            {
              policyNumber: `POL-${rng.int(100000, 999999)}`,
              insurer: rng.pick(['Assurance Atlantique', 'Mutuelle Chaouia', 'Alliance Assurance']),
              validFrom: addMonths(TODAY, -rng.int(2, 10)),
              validTo: addMonths(TODAY, rng.int(2, 10)),
              premium: new Prisma.Decimal(rng.int(6000, 14000)),
            },
          ],
        },
        maintenances: {
          create: Array.from({ length: rng.int(1, 3) }, () => ({
            type: rng.pick(['Entretien périodique', 'Pneumatiques', 'Freins', 'Révision']),
            date: addDays(TODAY, -rng.int(20, 300)),
            km: v.km - rng.int(2000, 30000),
            cost: new Prisma.Decimal(rng.int(900, 6500)),
            provider: 'Garage partenaire',
            nextDueKm: v.km + rng.int(5000, 15000),
          })),
        },
      },
    });
    list.push({ id: vehicle.id, dept: v.dept });
  }

  console.log(`  ${list.length} véhicules avec assurances et entretiens`);
  return list;
}

async function createDevices(
  companyId: string,
  deptId: Map<string, string>,
  employees: Map<string, EmployeeRecord>,
) {
  let expired = 0;
  let dueSoon = 0;

  for (const d of DEVICES) {
    const validUntil = addMonths(TODAY, d.calibrationOffsetMonths);
    const isExpired = d.calibrationOffsetMonths < 0;
    const isDueSoon = !isExpired && d.calibrationOffsetMonths <= 1;
    if (isExpired) expired += 1;
    if (isDueSoon) dueSoon += 1;

    await prisma.measuringDevice.create({
      data: {
        companyId,
        code: d.code,
        type: d.type,
        brand: d.brand,
        model: d.model,
        serialNumber: d.serial,
        departmentId: deptId.get(d.dept) ?? null,
        holderId: d.holderMatricule ? employees.get(d.holderMatricule)!.id : null,
        calibrationValidUntil: validUntil,
        calibrationIntervalM: 12,
        status: isExpired ? 'EXPIRED' : isDueSoon ? 'DUE_CALIBRATION' : 'AVAILABLE',
        calibrations: {
          create: [
            {
              date: addMonths(validUntil, -12),
              provider: rng.pick(['LNCM', 'Métrologie Atlantique', 'Cal-Service Maroc']),
              certificateNumber: `CAL-${YEAR - 1}-${rng.int(1000, 9999)}`,
              validUntil,
              result: 'CONFORM',
              cost: new Prisma.Decimal(rng.int(800, 3500)),
            },
          ],
        },
      },
    });
  }

  console.log(
    `  ${DEVICES.length} instruments de mesure — ${expired} périmés (usage bloqué), ${dueSoon} à étalonner sous 30 jours`,
  );
}

/* ═══════════════════════════════════════════════════════════════════
 *  Missions & pointage — le cœur du pilotage
 * ═══════════════════════════════════════════════════════════════════ */

interface MissionRecord {
  id: string;
  number: string;
  affairId: string;
  affairSeq: number;
  dept: string;
  inspectorId: string;
  inspectorMatricule: string;
  start: Date;
  end: Date;
  billableDays: number;
  status: string;
  /** Libellé de la mission — il désigne le modèle de rapport qu'elle produit. */
  label: string;
  timesheetIds: string[];
}

async function createMissionsAndTimesheets(
  affairs: AffairRecord[],
  employees: Map<string, EmployeeRecord>,
  departments: Array<{ id: string; code: string }>,
  workingDays: Date[],
  vehicles: Array<{ id: string; dept: string }>,
) {
  const deptIdByCode = new Map(departments.map((d) => [d.code, d.id]));
  const inspectors = EMPLOYEES.filter((e) => e.isInspector);

  const missions: MissionRecord[] = [];
  const timesheets: Prisma.TimesheetDayCreateManyInput[] = [];
  let missionSeq = 0;

  const costLookup = await buildCostLookup(employees);

  for (const inspector of inspectors) {
    const emp = employees.get(inspector.matricule)!;
    const occupancy = OCCUPANCY[inspector.matricule] ?? 0.7;
    const isDeptHead = inspector.position.startsWith('Chef');
    const deptAffairs = affairs.filter((a) => a.dept === inspector.dept);
    const deptVehicles = vehicles.filter((v) => v.dept === inspector.dept);

    // Une à deux périodes de congé dans l'année.
    const leaveBlocks = buildLeaveBlocks(workingDays.length, rng);
    const trainingDays = new Set(
      Array.from({ length: rng.int(2, 5) }, () => rng.int(0, workingDays.length - 1)),
    );

    let index = 0;
    while (index < workingDays.length) {
      const day = workingDays[index]!;

      if (leaveBlocks.some(([from, to]) => index >= from && index <= to)) {
        timesheets.push(makeDay(emp.id, day, 'LEAVE', null, null, costLookup, false));
        index += 1;
        continue;
      }

      if (trainingDays.has(index)) {
        timesheets.push(makeDay(emp.id, day, 'TRAINING', null, null, costLookup, false));
        index += 1;
        continue;
      }

      if (rng.next() < occupancy) {
        // Bloc de mission
        const length = Math.min(rng.int(3, 10), workingDays.length - index);
        const affair = deptAffairs.length
          ? pickAffairForDate(deptAffairs, day, rng)
          : null;

        if (!affair) {
          timesheets.push(
            makeDay(emp.id, day, isDeptHead ? 'OTHER' : 'UNASSIGNED', null, null, costLookup, false),
          );
          index += 1;
          continue;
        }

        missionSeq += 1;
        const start = workingDays[index]!;
        const end = workingDays[index + length - 1]!;
        const number = `MIS-${String(YEAR % 100)}-${String(missionSeq).padStart(4, '0')}`;
        const isPast = end < addDays(TODAY, -1);

        const mission = await prisma.mission.create({
          data: {
            number,
            affairId: affair.id,
            projectId: affair.projectId,
            siteId: affair.siteId,
            departmentId: deptIdByCode.get(inspector.dept) ?? null,
            serviceType: inspector.dept,
            status: isPast ? 'CLOSED' : 'IN_PROGRESS',
            billable: true,
            objective: rng.pick(MISSION_LABELS[inspector.dept] ?? ['Intervention technique']),
            instructions:
              'Se présenter à l’accueil sécurité, retirer le permis de travail et respecter le plan de prévention du site.',
            plannedStartDate: start,
            plannedEndDate: end,
            actualStartDate: start,
            actualEndDate: isPast ? end : null,
            reportDueDate: addWorkingDays(workingDays, index + length - 1, 21),
            vehicleId: deptVehicles.length ? rng.pick(deptVehicles).id : null,
            assignments: {
              create: {
                employeeId: emp.id,
                role: 'LEAD',
                plannedDays: new Prisma.Decimal(length),
                actualDays: new Prisma.Decimal(length),
                dailyCostSnapshot: new Prisma.Decimal(costLookup(emp.id, start)),
              },
            },
          },
        });

        await prisma.missionOrder.create({
          data: {
            number: number.replace('MIS', 'OM'),
            missionId: mission.id,
            object: mission.objective ?? 'Intervention technique',
            instructions: mission.instructions,
            hseInstructions: 'EPI obligatoires. Consignation électrique avant intervention.',
            status: isPast ? 'COMPLETED' : 'SIGNED',
            signedAt: addDays(start, -2),
            signatureHash: randomBytes(32).toString('hex'),
            signatureIp: `10.0.${rng.int(0, 254)}.${rng.int(1, 254)}`,
          },
        });

        let billableDays = 0;
        const blockDays: Prisma.TimesheetDayCreateManyInput[] = [];
        for (let k = 0; k < length; k += 1) {
          const d = workingDays[index + k]!;
          const month = d.getUTCMonth();
          // Les intempéries sont concentrées sur l'hiver.
          const weatherRate = month <= 2 || month >= 10 ? 0.09 : 0.02;
          let category: string;
          if (rng.next() < weatherRate) category = 'WEATHER';
          else if (rng.next() < 0.06) category = 'SITE_WAITING';
          else {
            category = 'MISSION_BILLABLE';
            billableDays += 1;
          }
          blockDays.push(
            makeDay(
              emp.id,
              d,
              category,
              mission.id,
              affair.id,
              costLookup,
              category === 'MISSION_BILLABLE',
            ),
          );
        }
        timesheets.push(...blockDays);

        missions.push({
          id: mission.id,
          number,
          affairId: affair.id,
          affairSeq: affair.seq,
          dept: inspector.dept,
          inspectorId: emp.id,
          inspectorMatricule: inspector.matricule,
          start,
          end,
          billableDays,
          status: mission.status,
          label: mission.objective ?? '',
          timesheetIds: [],
        });

        index += length;
      } else {
        // Journée sans affectation — c'est ici que naît le coût d'inactivité.
        const gap = Math.min(rng.int(1, 4), workingDays.length - index);
        for (let k = 0; k < gap; k += 1) {
          timesheets.push(
            makeDay(
              emp.id,
              workingDays[index + k]!,
              isDeptHead ? 'OTHER' : 'UNASSIGNED',
              null,
              null,
              costLookup,
              false,
            ),
          );
        }
        index += gap;
      }
    }
  }

  // Insertion par lots
  for (let i = 0; i < timesheets.length; i += 1000) {
    await prisma.timesheetDay.createMany({ data: timesheets.slice(i, i + 1000), skipDuplicates: true });
  }

  const unassigned = timesheets.filter((t) => t.category === 'UNASSIGNED').length;
  const billable = timesheets.filter((t) => t.category === 'MISSION_BILLABLE').length;
  console.log(
    `  ${missions.length} missions et ordres de mission signés\n` +
      `  ${timesheets.length} journées pointées — ${billable} facturables, ${unassigned} non affectées`,
  );

  return missions;
}

function makeDay(
  employeeId: string,
  date: Date,
  category: string,
  missionId: string | null,
  affairId: string | null,
  cost: (id: string, at: Date) => number,
  billable: boolean,
): Prisma.TimesheetDayCreateManyInput {
  return {
    employeeId,
    date,
    category: category as Prisma.TimesheetDayCreateManyInput['category'],
    missionId,
    affairId,
    hours: new Prisma.Decimal(category === 'LEAVE' || category === 'SICK' ? 0 : 8),
    billable,
    status: date < addDays(TODAY, -7) ? 'VALIDATED' : 'DRAFT',
    dailyCostSnapshot: new Prisma.Decimal(cost(employeeId, date)),
  };
}

function buildLeaveBlocks(total: number, r: Random): Array<[number, number]> {
  const blocks: Array<[number, number]> = [];
  const count = r.int(1, 2);
  for (let i = 0; i < count; i += 1) {
    const start = r.int(Math.floor((total / (count + 1)) * i) + 10, Math.floor((total / (count + 1)) * (i + 1)));
    const length = r.int(5, 11);
    blocks.push([start, Math.min(start + length - 1, total - 1)]);
  }
  return blocks;
}

function pickAffairForDate(affairs: AffairRecord[], day: Date, r: Random): AffairRecord | null {
  const active = affairs.filter((a) => day >= a.startDate && day <= a.endDate);
  if (active.length === 0) return affairs.length ? r.pick(affairs) : null;
  // L'affaire en difficulté concentre volontairement plus de missions.
  const troubled = active.find((a) => a.troubled);
  if (troubled && r.chance(0.35)) return troubled;
  return r.pick(active);
}

async function buildCostLookup(employees: Map<string, EmployeeRecord>) {
  const rows = await prisma.employeeDailyCost.findMany({
    where: { employeeId: { in: [...employees.values()].map((e) => e.id) } },
    orderBy: { validFrom: 'asc' },
  });
  const byEmployee = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byEmployee.get(row.employeeId) ?? [];
    list.push(row);
    byEmployee.set(row.employeeId, list);
  }
  return (employeeId: string, at: Date): number => {
    const list = byEmployee.get(employeeId) ?? [];
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const row = list[i]!;
      if (row.validFrom <= at && (!row.validTo || row.validTo >= at)) return Number(row.amount);
    }
    return 0;
  };
}

/* ═══════════════════════════════════════════════════════════════════
 *  Rapports
 * ═══════════════════════════════════════════════════════════════════ */

async function createReports(
  missions: MissionRecord[],
  employees: Map<string, EmployeeRecord>,
  workingDays: Date[],
) {
  const heads = new Map(
    EMPLOYEES.filter((e) => e.position.startsWith('Chef')).map((e) => [e.dept, employees.get(e.matricule)!.id]),
  );

  /**
   * Un rapport est vérifié par quelqu'un d'autre que son rédacteur — c'est la
   * règle affichée par l'application. Quand le rédacteur est le chef de son
   * propre département, la vérification remonte à un autre chef.
   */
  const pickChecker = (dept: string, authorId: string): string | null => {
    const head = heads.get(dept);
    if (head && head !== authorId) return head;
    return [...heads.entries()].find(([, id]) => id !== authorId)?.[1] ?? null;
  };

  // Le type de chaque rapport : le modèle du référentiel qualité, par code.
  const templateIds = new Map<string, string>();
  for (const t of await prisma.inspectionTemplate.findMany({
    select: { id: true, formCode: true },
    orderBy: { version: 'desc' },
  })) {
    if (!templateIds.has(t.formCode)) templateIds.set(t.formCode, t.id);
  }

  const closed = missions.filter((m) => m.status === 'CLOSED');
  let seq = 0;
  let onTime = 0;
  let late = 0;

  for (const mission of closed) {
    if (rng.chance(0.12)) continue; // quelques missions sans rapport encore rédigé
    seq += 1;

    const formCode = MISSION_FORMS[mission.label] ?? FORM_BY_DEPT[mission.dept] ?? 'PR01-F17';
    const dueIndex = workingDays.findIndex((d) => d.getTime() === mission.end.getTime());
    const due = addWorkingDays(workingDays, Math.max(dueIndex, 0), 21);
    const deliveryLag = rng.chance(0.78) ? rng.int(4, 19) : rng.int(23, 40);
    const delivered = addDays(mission.end, deliveryLag);

    if (delivered > TODAY) continue;
    if (delivered <= due) onTime += 1;
    else late += 1;

    const status = delivered < addDays(TODAY, -20) ? 'ARCHIVED' : 'ISSUED';

    await prisma.report.create({
      data: {
        number: `${formCode}-${String(YEAR % 100)}-${String(seq).padStart(4, '0')}`,
        missionId: mission.id,
        templateId: templateIds.get(formCode) ?? null,
        affairId: mission.affairId,
        authorId: mission.inspectorId,
        checkerId: pickChecker(mission.dept, mission.inspectorId),
        status,
        revision: 0,
        submittedAt: addDays(mission.end, Math.max(1, deliveryLag - 4)),
        checkedAt: addDays(mission.end, Math.max(2, deliveryLag - 2)),
        issuedAt: delivered,
        deliveredAt: delivered,
        checks: {
          create: [
            { criterion: 'Complétude des champs obligatoires du formulaire', applicable: true, conform: true },
            { criterion: 'Instrument de mesure en cours de validité d’étalonnage', applicable: true, conform: true },
            { criterion: 'Cohérence des résultats avec le critère d’acceptation', applicable: true, conform: true },
            { criterion: 'Visas rédacteur et vérificateur présents', applicable: true, conform: true },
          ],
        },
      },
    });
  }

  // Quelques rapports en cours de circuit, pour alimenter les files d'attente.
  const running = missions.filter((m) => m.status === 'IN_PROGRESS').slice(0, 9);
  for (const [i, mission] of running.entries()) {
    const formCode = MISSION_FORMS[mission.label] ?? FORM_BY_DEPT[mission.dept] ?? 'PR01-F17';
    const status = rng.pick(['DRAFT', 'SUBMITTED', 'UNDER_CHECK', 'CORRECTION'] as const);
    await prisma.report.create({
      data: {
        number: `${formCode}-${String(YEAR % 100)}-${String(seq + i + 1).padStart(4, '0')}`,
        missionId: mission.id,
        templateId: templateIds.get(formCode) ?? null,
        affairId: mission.affairId,
        authorId: mission.inspectorId,
        checkerId: pickChecker(mission.dept, mission.inspectorId),
        status,
        // Un rapport engagé dans le circuit porte forcément sa date de
        // soumission : c'est elle qui fait courir le délai de remise.
        submittedAt: status === 'DRAFT' ? null : addDays(TODAY, -rng.int(1, 6)),
      },
    });
  }

  const rate = onTime + late > 0 ? Math.round((onTime / (onTime + late)) * 100) : 0;
  console.log(
    `  ${onTime + late} rapports émis — taux de respect du délai de 21 jours ouvrés : ${rate} %`,
  );
}

const FORM_BY_DEPT: Record<string, string> = {
  CND: 'PR01-F02',
  EILM: 'PR02-F40',
  CTC: 'PR03-F01',
};

/* ═══════════════════════════════════════════════════════════════════
 *  Attachements & facturation
 * ═══════════════════════════════════════════════════════════════════ */

interface AttachmentRecord {
  id: string;
  affairId: string;
  month: number;
  totalHT: number;
  status: string;
}

async function createAttachments(
  affairs: AffairRecord[],
  missions: MissionRecord[],
  employees: Map<string, EmployeeRecord>,
) {
  const created: AttachmentRecord[] = [];
  const currentMonth = TODAY.getUTCMonth();
  let seq = 0;

  for (const affair of affairs) {
    for (let month = 0; month <= currentMonth; month += 1) {
      const monthMissions = missions.filter(
        (m) => m.affairId === affair.id && m.end.getUTCMonth() === month && m.billableDays > 0,
      );
      if (monthMissions.length === 0) continue;

      seq += 1;
      const monthsAgo = currentMonth - month;
      const status = monthsAgo >= 2 ? 'INVOICED' : monthsAgo === 1 ? 'VALIDATED' : 'SUBMITTED';

      const lines = monthMissions.map((m) => ({
        missionId: m.id,
        employeeId: m.inspectorId,
        designation: `${m.number} — ${m.billableDays} jour(s) de vacation`,
        days: new Prisma.Decimal(m.billableDays),
        unitRate: new Prisma.Decimal(affair.dailyRate),
        amountHT: new Prisma.Decimal(m.billableDays * affair.dailyRate),
      }));

      const totalHT = monthMissions.reduce((sum, m) => sum + m.billableDays * affair.dailyRate, 0);

      const sheet = await prisma.attachmentSheet.create({
        data: {
          number: `ATT-${String(YEAR % 100)}-${String(seq).padStart(4, '0')}`,
          affairId: affair.id,
          clientId: affair.clientId,
          periodStart: new Date(Date.UTC(YEAR, month, 1)),
          periodEnd: new Date(Date.UTC(YEAR, month + 1, 0)),
          status: status as Prisma.AttachmentSheetCreateInput['status'],
          totalHT: new Prisma.Decimal(totalHT),
          submittedAt: new Date(Date.UTC(YEAR, month + 1, 3)),
          validatedAt: status === 'SUBMITTED' ? null : new Date(Date.UTC(YEAR, month + 1, 8)),
          lines: { create: lines },
        },
      });

      created.push({ id: sheet.id, affairId: affair.id, month, totalHT, status });
    }
  }

  console.log(`  ${created.length} attachements`);
  return created;
}

async function createInvoices(
  companyId: string,
  affairs: AffairRecord[],
  attachments: AttachmentRecord[],
) {
  const byAffairMonth = new Map<string, AttachmentRecord[]>();
  for (const a of attachments.filter((x) => x.status === 'INVOICED')) {
    const key = `${a.affairId}:${a.month}`;
    byAffairMonth.set(key, [...(byAffairMonth.get(key) ?? []), a]);
  }

  const affairById = new Map(affairs.map((a) => [a.id, a]));
  let seq = 0;
  let paid = 0;
  let overdue = 0;

  for (const [key, group] of byAffairMonth) {
    const [affairId, monthRaw] = key.split(':');
    const month = Number(monthRaw);
    const affair = affairById.get(affairId!)!;
    seq += 1;

    const totalHT = group.reduce((s, g) => s + g.totalHT, 0);
    const totalTTC = Math.round(totalHT * 1.2);
    const issueDate = new Date(Date.UTC(YEAR, month + 1, 10));
    const dueDate = addDays(issueDate, 45);
    const isPaid = rng.chance(0.62);
    const isOverdue = !isPaid && dueDate < TODAY;
    if (isPaid) paid += 1;
    if (isOverdue) overdue += 1;

    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        number: `F-${String(YEAR % 100)}-${String(seq).padStart(4, '0')}`,
        clientId: affair.clientId,
        affairId: affair.id,
        issueDate,
        dueDate,
        totalHT: new Prisma.Decimal(totalHT),
        vatRate: new Prisma.Decimal(20),
        totalTTC: new Prisma.Decimal(totalTTC),
        status: isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'SENT',
        lines: {
          create: [
            {
              position: 1,
              designation: `Prestations ${affair.dept} — ${new Date(Date.UTC(YEAR, month, 1)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
              quantity: new Prisma.Decimal(Math.round(totalHT / affair.dailyRate)),
              unitPrice: new Prisma.Decimal(affair.dailyRate),
              amountHT: new Prisma.Decimal(totalHT),
              vatRate: new Prisma.Decimal(20),
            },
          ],
        },
        attachments: { create: group.map((g) => ({ attachmentSheetId: g.id })) },
      },
    });

    if (isPaid) {
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          date: addDays(dueDate, -rng.int(0, 20)),
          amount: new Prisma.Decimal(totalTTC),
          method: 'TRANSFER',
          bankReference: `VIR-${rng.int(100000, 999999)}`,
          reconciledAt: addDays(dueDate, -rng.int(0, 18)),
        },
      });
    } else if (isOverdue) {
      await prisma.dunning.create({
        data: {
          invoiceId: invoice.id,
          level: 1,
          sentAt: addDays(dueDate, 5),
          channel: 'EMAIL',
        },
      });
    }
  }

  console.log(`  ${seq} factures — ${paid} encaissées, ${overdue} échues avec relance`);
}

/* ═══════════════════════════════════════════════════════════════════
 *  Notes de frais
 * ═══════════════════════════════════════════════════════════════════ */

async function createExpenses(
  companyId: string,
  employees: Map<string, EmployeeRecord>,
  affairs: AffairRecord[],
  missions: MissionRecord[],
) {
  const categories = await prisma.expenseCategory.findMany({ where: { isActive: true } });
  const byCode = new Map(categories.map((c) => [c.code, c]));
  const currentMonth = TODAY.getUTCMonth();
  const months = [currentMonth - 2, currentMonth - 1, currentMonth].filter((m) => m >= 0);

  const statusByAge: Record<number, string> = {
    2: 'PAID',
    1: 'APPROVED_DG',
    0: 'SUBMITTED',
  };

  let reports = 0;
  let lines = 0;
  let overCap = 0;

  for (const inspector of EMPLOYEES.filter((e) => e.isInspector)) {
    const emp = employees.get(inspector.matricule)!;

    for (const month of months) {
      const age = currentMonth - month;
      const monthMissions = missions.filter(
        (m) => m.inspectorMatricule === inspector.matricule && m.end.getUTCMonth() === month,
      );
      if (monthMissions.length === 0) continue;

      const status = statusByAge[age] ?? 'DRAFT';
      const created: Prisma.ExpenseLineCreateWithoutExpenseReportInput[] = [];

      for (const mission of monthMissions) {
        const affair = affairs.find((a) => a.id === mission.affairId);
        const far = affair ? affair.seq % 3 === 0 : false;

        const picks: Array<[string, number]> = [
          ['CARBURANT', rng.int(180, 520)],
          ['PEAGE', rng.int(30, 120)],
        ];
        if (far) picks.push(['HEBERGEMENT', 150 * Math.min(mission.billableDays, 4)]);
        if (far) picks.push(['INDEMNITE_DEPLACEMENT', 100 * Math.min(mission.billableDays, 5)]);
        if (rng.chance(0.3)) picks.push(['PARKING', rng.int(20, 60)]);
        if (rng.chance(0.15)) picks.push(['PETIT_OUTILLAGE', rng.int(120, 380)]);

        for (const [code, amount] of picks) {
          const category = byCode.get(code);
          if (!category) continue;

          // Un dépassement volontaire par-ci par-là, pour montrer l'alerte.
          const finalAmount =
            category.capAmount && rng.chance(0.06)
              ? Number(category.capAmount) + rng.int(50, 200)
              : amount;

          const cap = category.capAmount ? Number(category.capAmount) : null;
          const exceeds =
            cap !== null &&
            ((category.capType === 'DAILY' && finalAmount > cap * mission.billableDays) ||
              (category.capType === 'MONTHLY' && finalAmount > cap) ||
              (category.capType === 'PER_NIGHT' && finalAmount > cap * 5));
          if (exceeds) overCap += 1;

          created.push({
            date: addDays(mission.start, rng.int(0, Math.max(0, mission.billableDays - 1))),
            category: { connect: { id: category.id } },
            affair: affair ? { connect: { id: affair.id } } : undefined,
            mission: { connect: { id: mission.id } },
            clientSiteLabel: affair?.number ?? null,
            serviceType: mission.dept,
            description: `${category.label} — ${mission.number}`,
            amount: new Prisma.Decimal(finalAmount),
            comment: exceeds ? 'Dépassement justifié par la durée de la mission.' : null,
            status: status === 'PAID' || status === 'APPROVED_DG' ? 'ACCEPTED' : 'PENDING',
            capWarning: exceeds ? `Plafond ${cap} DH dépassé` : null,
          });
        }
      }

      if (created.length === 0) continue;

      const totalGross = created.reduce((s, l) => s + Number(l.amount), 0);

      await prisma.expenseReport.create({
        data: {
          number: `NF-${String(YEAR % 100)}-${String(month + 1).padStart(2, '0')}-${inspector.matricule}`,
          companyId,
          employeeId: emp.id,
          periodMonth: new Date(Date.UTC(YEAR, month, 1)),
          type: 'MISSION',
          status: status as Prisma.ExpenseReportCreateInput['status'],
          totalGross: new Prisma.Decimal(totalGross),
          advanceDeduction: new Prisma.Decimal(0),
          netPayable: new Prisma.Decimal(totalGross),
          paymentMethod: 'TRANSFER',
          paidAt: status === 'PAID' ? new Date(Date.UTC(YEAR, month + 1, 15)) : null,
          bankReference: status === 'PAID' ? `VIR-${rng.int(100000, 999999)}` : null,
          lines: { create: created },
          approvals: {
            create: buildApprovals(status, month),
          },
        },
      });

      reports += 1;
      lines += created.length;
    }
  }

  console.log(`  ${reports} notes de frais, ${lines} lignes — ${overCap} dépassements de plafond signalés`);
}

function buildApprovals(status: string, month: number): Prisma.ExpenseApprovalCreateWithoutExpenseReportInput[] {
  const steps: Array<[number, string]> = [
    [1, 'DEPT_HEAD'],
    [2, 'HR'],
    [3, 'CONTROLLER'],
    [4, 'DG'],
  ];
  const reached =
    status === 'PAID' ? 4 : status === 'APPROVED_DG' ? 4 : status === 'READY_TO_PAY' ? 4 : status === 'SUBMITTED' ? 1 : 0;

  return steps.slice(0, reached).map(([step, roleCode]) => ({
    step,
    roleCode,
    decision: 'APPROVED' as const,
    decidedAt: new Date(Date.UTC(YEAR, month + 1, 3 + step)),
  }));
}

/* ═══════════════════════════════════════════════════════════════════
 *  Formulaires d'inspection
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * Publie trois formulaires réels, un par paradigme. Le versionnement est
 * immuable : republier crée une version, ne modifie jamais un rapport émis.
 */
async function createTemplates() {
  const methods = await prisma.inspectionMethod.findMany();
  const methodByCode = new Map(methods.map((m) => [m.code, m.id]));

  for (const template of TEMPLATES) {
    await prisma.inspectionTemplate.upsert({
      where: { formCode_version: { formCode: template.formCode, version: template.version } },
      update: {
        title: template.title,
        titleEn: template.titleEn ?? null,
        paradigm: template.paradigm,
        schema: template.schema as never,
        status: 'PUBLISHED',
      },
      create: {
        formCode: template.formCode,
        version: template.version,
        title: template.title,
        titleEn: template.titleEn ?? null,
        methodId: methodByCode.get(template.methodCode) ?? null,
        paradigm: template.paradigm,
        applicationDate: new Date(template.applicationDate),
        status: 'PUBLISHED',
        schema: template.schema as never,
      },
    });
  }

  const sections = TEMPLATES.reduce(
    (n, t) => n + ((t.schema as { sections: unknown[] }).sections?.length ?? 0),
    0,
  );
  console.log(`  ${TEMPLATES.length} formulaires d'inspection publiés (${sections} sections)`);
}

/* ═══════════════════════════════════════════════════════════════════
 *  Non-conformités & notifications
 * ═══════════════════════════════════════════════════════════════════ */

async function createNonConformities(affairs: AffairRecord[], employees: Map<string, EmployeeRecord>) {
  const byseq = new Map(affairs.map((a) => [a.seq, a.id]));

  for (const [i, nc] of NON_CONFORMITIES.entries()) {
    await prisma.nonConformity.create({
      data: {
        number: `NC-${String(YEAR % 100)}-${String(i + 1).padStart(4, '0')}`,
        affairId: byseq.get(nc.affairSeq) ?? null,
        description: nc.description,
        severity: nc.severity,
        ownerId: employees.get(nc.owner)!.id,
        dueDate: addDays(TODAY, nc.dueInDays),
        status: nc.status,
        correctiveAction:
          nc.status === 'CLOSED'
            ? 'Réparation réalisée et contrôle de confirmation effectué.'
            : 'Action corrective en cours de définition avec le client.',
        closedAt: nc.status === 'CLOSED' ? addDays(TODAY, nc.dueInDays + 3) : null,
      },
    });
  }
  console.log(`  ${NON_CONFORMITIES.length} non-conformités`);
}

async function createNotifications(employees: Map<string, EmployeeRecord>) {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: `@${DEMO_DOMAIN}` } },
    include: { userRoles: { include: { role: true } } },
  });

  const dg = users.find((u) => u.userRoles.some((r) => r.role.code === 'DG'));
  const cndHead = users.find((u) => u.email.includes('c0101'));

  const rows: Prisma.NotificationCreateManyInput[] = [];

  if (dg) {
    rows.push(
      { userId: dg.id, type: 'MARGE', title: 'Affaire 26/0001 sous la marge budgétée', body: 'Marge réelle très en deçà des 22 % prévus. Frais de mission et jours d’attente non facturés en cause.', level: 'danger', link: '/affaires' },
      { userId: dg.id, type: 'FRAIS', title: 'Notes de frais en attente de votre validation finale', body: 'Plusieurs notes de frais ont franchi les visas RH et contrôle de gestion.', level: 'warning', link: '/finance/notes-de-frais' },
      { userId: dg.id, type: 'IMPAYE', title: 'Factures échues', body: 'Des factures ont dépassé leur échéance et ont fait l’objet d’une première relance.', level: 'danger', link: '/finance/encaissements' },
      { userId: dg.id, type: 'INACTIVITE', title: 'Jours non affectés en hausse ce mois', body: 'Le coût d’inactivité progresse par rapport au mois précédent.', level: 'warning', link: '/pilotage/jours-non-affectes' },
    );
  }

  if (cndHead) {
    rows.push(
      { userId: cndHead.id, type: 'CERTIFICATION', title: 'Certification MT niveau 2 expire sous 30 jours', body: 'A. HOUARI — planifier la requalification avec la RH.', level: 'warning', link: '/ressources/employes' },
      { userId: cndHead.id, type: 'ETALONNAGE', title: 'Instrument UT-003 périmé', body: 'Le mesureur d’épaisseur 26MG ne peut plus être utilisé pour émettre un rapport.', level: 'danger', link: '/operations/parc-mesure' },
      { userId: cndHead.id, type: 'RAPPORT', title: 'Rapports en attente de vérification', body: 'Des rapports soumis attendent votre visa de conformité.', level: 'warning', link: '/operations/rapports' },
      { userId: cndHead.id, type: 'INACTIVITE', title: 'Inspecteur non affecté depuis plusieurs jours', body: 'M. BENALI est sans affectation. Coût d’inactivité en cours d’accumulation.', level: 'warning', link: '/pilotage/jours-non-affectes' },
    );
  }

  await prisma.notification.createMany({ data: rows });
  console.log(`  ${rows.length} notifications`);
}

/* ═══════════════════════════════════════════════════════════════════
 *  Utilitaires
 * ═══════════════════════════════════════════════════════════════════ */

async function loadWorkingDays(companyId: string): Promise<Date[]> {
  const rows = await prisma.workCalendarDay.findMany({
    where: {
      companyId,
      isWorkingDay: true,
      date: { gte: new Date(Date.UTC(YEAR, 0, 1)), lte: TODAY },
    },
    orderBy: { date: 'asc' },
    select: { date: true },
  });
  return rows.map((r) => r.date);
}

function addWorkingDays(workingDays: Date[], fromIndex: number, count: number): Date {
  const target = Math.min(fromIndex + count, workingDays.length - 1);
  return workingDays[target] ?? workingDays[workingDays.length - 1]!;
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

async function summary(password: string) {
  const [employees, missions, timesheets, unassigned, reports, invoices, expenses] = await Promise.all([
    prisma.employee.count(),
    prisma.mission.count(),
    prisma.timesheetDay.count(),
    prisma.timesheetDay.count({ where: { category: 'UNASSIGNED' } }),
    prisma.report.count(),
    prisma.invoice.count(),
    prisma.expenseReport.count(),
  ]);

  const idleCost = await prisma.timesheetDay.aggregate({
    where: { category: 'UNASSIGNED' },
    _sum: { dailyCostSnapshot: true },
  });

  console.log('\n┌──────────────────────────────────────────────────────────┐');
  console.log('│  JEU DE SIMULATION CHARGÉ                                 │');
  console.log('├──────────────────────────────────────────────────────────┤');
  console.log(`│  Employés                    ${String(employees).padStart(6)}                      │`);
  console.log(`│  Missions                    ${String(missions).padStart(6)}                      │`);
  console.log(`│  Journées pointées           ${String(timesheets).padStart(6)}                      │`);
  console.log(`│  dont non affectées          ${String(unassigned).padStart(6)}                      │`);
  console.log(`│  Coût d'inactivité       ${String(Math.round(Number(idleCost._sum.dailyCostSnapshot ?? 0))).padStart(10)} DH                   │`);
  console.log(`│  Rapports                    ${String(reports).padStart(6)}                      │`);
  console.log(`│  Factures                    ${String(invoices).padStart(6)}                      │`);
  console.log(`│  Notes de frais              ${String(expenses).padStart(6)}                      │`);
  console.log('└──────────────────────────────────────────────────────────┘\n');

  console.log('  Comptes de démonstration — mot de passe commun :');
  console.log(`     ${password}\n`);
  console.log('  Quelques profils à essayer :');
  console.log(`     dg.a0001@${DEMO_DOMAIN}                Direction Générale`);
  console.log(`     dept_head.c0101@${DEMO_DOMAIN}         Chef de département CND`);
  console.log(`     controller.a0003@${DEMO_DOMAIN}        Contrôle de gestion`);
  console.log(`     account_manager.a0009@${DEMO_DOMAIN}   Chargé d'affaires`);
  console.log(`     inspector.c0102@${DEMO_DOMAIN}         Inspecteur CND`);
  console.log(`     raf.a0005@${DEMO_DOMAIN}               RAF\n`);
  console.log('  ⚠ Toutes ces données sont fictives. L\'application affiche un');
  console.log('    bandeau permanent tant que le jeu de démonstration est chargé.\n');
}

main()
  .catch((error) => {
    console.error('\n✗ Chargement du jeu de simulation en échec :', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
