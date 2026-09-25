import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { TemplateSchema, TemplateSection } from '@i2s/contracts';
import { applyFormulas } from '@i2s/calc';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import type { RequestUser } from '../common/types';

export interface InspectionData {
  [sectionKey: string]: unknown;
}

/**
 * Sources d'en-tête que le serveur sait résoudre depuis la mission. L'écran
 * de saisie les affiche en lecture seule : elles ne peuvent venir que d'ici.
 */
const SERVER_AUTOFILL = ['client', 'affairNumber', 'site', 'inspector', 'date'] as const;
type ServerAutofill = (typeof SERVER_AUTOFILL)[number];
type AutofillValues = Partial<Record<ServerAutofill, string>>;

export interface ValidationIssue {
  section: string;
  field?: string;
  message: string;
  /** Un blocage interdit la soumission ; un avertissement est seulement signalé. */
  blocking: boolean;
}

@Injectable()
export class InspectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly numbering: NumberingService,
  ) {}

  /* ── Lecture ──────────────────────────────────────────────────── */

  async get(user: RequestUser, id: string) {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: {
        template: true,
        inspector: { select: { id: true, matricule: true, firstName: true, lastName: true } },
        devices: { include: { measuringDevice: true } },
        report: { select: { id: true, number: true, status: true } },
        mission: {
          include: {
            affair: {
              include: {
                client: { select: { name: true } },
                company: { select: { id: true } },
              },
            },
            site: { select: { name: true, city: true } },
          },
        },
      },
    });

    if (!inspection) throw new NotFoundException('Inspection introuvable.');

    // Périmètre personnel : un inspecteur ne voit que ses propres saisies.
    const ownOnly = user.permissions.some(
      (p) => p.resource === 'inspection' && p.action === 'VIEW' && p.scope === 'OWN',
    );
    if (ownOnly && inspection.inspectorId !== user.employeeId) {
      throw new ForbiddenException('Cette inspection ne vous est pas affectée.');
    }

    return inspection;
  }

  /* ── Création ─────────────────────────────────────────────────── */

  async create(
    user: RequestUser,
    input: { missionId: string; templateId: string; assetId?: string; date?: Date },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    if (!user.employeeId) {
      throw new ForbiddenException(
        'Votre compte n’est rattaché à aucun employé : impossible de signer une inspection.',
      );
    }

    const [mission, template, inspector] = await Promise.all([
      this.prisma.mission.findFirst({
        where: { id: input.missionId, deletedAt: null },
        include: {
          assignments: true,
          affair: { select: { number: true, client: { select: { name: true } } } },
          site: { select: { name: true } },
        },
      }),
      this.prisma.inspectionTemplate.findUnique({ where: { id: input.templateId } }),
      this.prisma.employee.findUnique({
        where: { id: user.employeeId },
        select: { firstName: true, lastName: true },
      }),
    ]);

    if (!mission) throw new NotFoundException('Mission introuvable.');
    if (!inspector) throw new NotFoundException('Employé introuvable.');
    if (!template) throw new NotFoundException('Formulaire introuvable.');

    if (template.status !== 'PUBLISHED') {
      throw new BadRequestException(
        'Ce formulaire n’est pas publié : il ne peut pas servir à une inspection.',
      );
    }

    // L'ordre de mission signé conditionne le démarrage (docs/05, W2).
    const order = await this.prisma.missionOrder.findUnique({
      where: { missionId: mission.id },
      select: { status: true, number: true },
    });
    if (!order || !['SIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(order.status)) {
      throw new BadRequestException(
        'L’ordre de mission doit être signé avant de saisir une inspection.',
      );
    }

    const date = input.date ?? new Date();
    const initialData = this.applyAutofill(
      template.schema as unknown as TemplateSchema,
      {},
      this.autofillValues({
        client: mission.affair.client.name,
        affairNumber: mission.affair.number,
        site: mission.site?.name ?? null,
        inspector: `${inspector.lastName.toUpperCase()} ${inspector.firstName}`,
        date,
      }),
    );

    const inspection = await this.prisma.inspection.create({
      data: {
        missionId: mission.id,
        templateId: template.id,
        // La version est figée : le rapport sera toujours rendu avec elle.
        templateVersion: template.version,
        assetId: input.assetId ?? null,
        inspectorId: user.employeeId,
        date,
        data: initialData as never,
        status: 'DRAFT',
      },
    });

    await this.audit.record(
      {
        entity: 'inspection',
        entityId: inspection.id,
        action: 'CREATE',
        after: {
          mission: mission.number,
          template: `${template.formCode} v${template.version}`,
        },
      },
      { user, ...ctx },
    );

    return inspection;
  }

  /* ── Enregistrement du brouillon ──────────────────────────────── */

  async saveDraft(
    user: RequestUser,
    id: string,
    data: InspectionData,
    deviceIds: string[] | undefined,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const inspection = await this.get(user, id);

    if (inspection.status !== 'DRAFT') {
      throw new BadRequestException(
        'Cette inspection a été soumise : elle n’est plus modifiable. Créez une révision.',
      );
    }
    if (inspection.inspectorId !== user.employeeId) {
      throw new ForbiddenException('Seul l’inspecteur affecté peut modifier cette saisie.');
    }

    // L'en-tête est réappliqué à chaque enregistrement : le navigateur ne le
    // renvoie pas (il l'affiche en lecture seule) et un brouillon doit rester
    // aligné sur sa mission jusqu'à la soumission, qui le fige.
    const schema = inspection.template.schema as unknown as TemplateSchema;

    const withHeader = this.applyAutofill(
      schema,
      data,
      this.autofillValues({
        client: inspection.mission.affair.client.name,
        affairNumber: inspection.mission.affair.number,
        site: inspection.mission.site?.name ?? null,
        inspector: `${inspection.inspector.lastName.toUpperCase()} ${inspection.inspector.firstName}`,
        date: inspection.date,
      }),
    );

    // Le sélecteur d'instruments est le champ de saisie du poste de mesure :
    // sa valeur se lit dans la sélection, pas dans une case à remplir en plus.
    const selectedIds = deviceIds ?? inspection.devices.map((d) => d.measuringDeviceId);
    const selected =
      selectedIds.length > 0
        ? await this.prisma.measuringDevice.findMany({
            where: { id: { in: selectedIds } },
            orderBy: { code: 'asc' },
            select: {
              id: true,
              code: true,
              brand: true,
              model: true,
              serialNumber: true,
              calibrationValidUntil: true,
            },
          })
        : [];

    // Les champs calculés sont résolus ici, au dernier moment : ce qui sera
    // imprimé au rapport ne dépend pas de ce que le navigateur a envoyé.
    const merged = applyFormulas(
      schema.sections ?? [],
      this.applyDeviceFields(schema, withHeader, selected),
    ) as InspectionData;

    await this.prisma.$transaction(async (tx) => {
      await tx.inspection.update({
        where: { id },
        data: { data: merged as never },
      });

      if (deviceIds) {
        await tx.inspectionDevice.deleteMany({ where: { inspectionId: id } });
        if (selected.length > 0) {
          await tx.inspectionDevice.createMany({
            data: selected.map((d) => ({
              inspectionId: id,
              measuringDeviceId: d.id,
              // L'étalonnage est figé au moment du rattachement : le rapport
              // garde l'état constaté, même si la fiche évolue ensuite.
              calibrationValidAt: d.calibrationValidUntil,
            })),
          });
        }
      }
    });

    return this.validate(id);
  }

  /* ── Pré-remplissage de l'en-tête ─────────────────────────────── */

  private autofillValues(source: {
    client: string;
    affairNumber: string;
    site: string | null;
    inspector: string;
    date: Date;
  }): AutofillValues {
    const values: AutofillValues = {
      client: source.client,
      affairNumber: source.affairNumber,
      inspector: source.inspector,
      date: source.date.toLocaleDateString('fr-FR'),
    };

    // Un site absent n'est pas rempli : mieux vaut un champ réclamé par la
    // validation qu'un tiret enregistré comme s'il était un lieu de contrôle.
    if (source.site) values.site = source.site;

    return values;
  }

  /**
   * Recopie l'en-tête de la mission dans les données du formulaire.
   *
   * L'inspecteur ne ressaisit pas ces valeurs — l'écran les affiche en lecture
   * seule. Sans cette recopie elles n'existeraient nulle part : la validation
   * les réclamerait et le rapport émis n'en garderait aucune trace.
   */
  private applyAutofill(
    schema: TemplateSchema,
    data: InspectionData,
    values: AutofillValues,
  ): InspectionData {
    const next: InspectionData = { ...data };

    for (const section of schema.sections ?? []) {
      if (section.repeatable) continue;

      for (const field of section.fields ?? []) {
        const source = field.autofill;
        if (!source || !SERVER_AUTOFILL.includes(source as ServerAutofill)) continue;

        const value = values[source as ServerAutofill];
        if (value === undefined) continue;

        const current = (next[section.key] ?? {}) as Record<string, unknown>;
        next[section.key] = { ...current, [field.key]: value };
      }
    }

    return next;
  }

  /**
   * Recopie les instruments sélectionnés dans les champs de type « device ».
   *
   * Ces champs n'ont pas de contrôle propre à l'écran — le sélecteur
   * d'instruments en tient lieu. Sans cette recopie ils resteraient vides et
   * la validation réclamerait indéfiniment une valeur qu'aucun champ ne permet
   * de saisir.
   */
  private applyDeviceFields(
    schema: TemplateSchema,
    data: InspectionData,
    devices: Array<{
      code: string;
      brand: string | null;
      model: string | null;
      serialNumber: string | null;
    }>,
  ): InspectionData {
    const label = devices
      .map((d) => {
        const designation = [d.brand, d.model].filter(Boolean).join(' ');
        const serial = d.serialNumber ? ` n° ${d.serialNumber}` : '';
        return `${d.code}${designation ? ` — ${designation}` : ''}${serial}`;
      })
      .join(' ; ');

    const next: InspectionData = { ...data };

    for (const section of schema.sections ?? []) {
      if (section.type !== 'devices') continue;

      for (const field of section.fields ?? []) {
        if (field.type !== 'device') continue;
        const current = (next[section.key] ?? {}) as Record<string, unknown>;
        next[section.key] = { ...current, [field.key]: label };
      }
    }

    return next;
  }

  /* ── Validation ───────────────────────────────────────────────── */

  /**
   * Contrôle le contenu d'une inspection contre le schéma de son formulaire.
   *
   * Deux règles sont bloquantes et viennent du métier, pas de l'ergonomie :
   *   — un instrument hors étalonnage à la date de l'essai invalide le rapport ;
   *   — un point de contrôle non conforme interdit une conclusion « sans réserve ».
   */
  async validate(id: string): Promise<{ issues: ValidationIssue[]; canSubmit: boolean }> {
    const inspection = await this.prisma.inspection.findUniqueOrThrow({
      where: { id },
      include: {
        template: true,
        devices: { include: { measuringDevice: true } },
      },
    });

    const schema = inspection.template.schema as unknown as TemplateSchema;
    const data = (inspection.data ?? {}) as Record<string, unknown>;
    const issues: ValidationIssue[] = [];

    for (const section of schema.sections ?? []) {
      const value = data[section.key];

      // Champs obligatoires des blocs de saisie
      for (const field of section.fields ?? []) {
        if (!field.required) continue;
        const sectionValue = (value ?? {}) as Record<string, unknown>;
        const raw = sectionValue[field.key];
        if (raw === undefined || raw === null || raw === '') {
          issues.push({
            section: section.label.fr,
            field: field.label.fr,
            message: 'Champ obligatoire non renseigné.',
            blocking: true,
          });
        }
      }

      // Colonnes obligatoires des tableaux : sans ce contrôle, une ligne
      // d'indication entièrement vide passait pour une mesure faite.
      const requiredColumns = (section.columns ?? []).filter((c) => c.required);
      if (requiredColumns.length > 0 && Array.isArray(value)) {
        for (const [index, row] of (value as Record<string, unknown>[]).entries()) {
          const manquants = requiredColumns.filter((c) => {
            const raw = row?.[c.key];
            return raw === undefined || raw === null || raw === '';
          });
          if (manquants.length > 0) {
            issues.push({
              section: section.label.fr,
              field: `Ligne ${index + 1}`,
              message: `Colonne(s) obligatoire(s) non renseignée(s) : ${manquants
                .map((c) => c.label.fr)
                .join(', ')}.`,
              blocking: true,
            });
          }
        }
      }

      // Points de contrôle sans réponse : une check-list vide valait
      // jusqu'ici rapport complet, alors qu'aucun point n'avait été examiné.
      if (section.type === 'checklist') {
        const verdicts = (value ?? {}) as Record<string, unknown>;
        const points = (section.groups ?? []).flatMap((group) => group.points);
        const sansReponse = points.filter((point) => {
          const raw = verdicts[point.key];
          return raw === undefined || raw === null || raw === '';
        });
        if (sansReponse.length > 0) {
          issues.push({
            section: section.label.fr,
            message:
              sansReponse.length === points.length
                ? `Aucun des ${points.length} points de contrôle n’a été renseigné.`
                : `${sansReponse.length} point(s) de contrôle sans réponse, dont « ${sansReponse[0].label.fr} ».`,
            blocking: true,
          });
        }
      }

      // Critères d'acceptation non tranchés — même exigence que la check-list.
      if (section.type === 'criteria') {
        const decisions = (value ?? {}) as Record<string, { applicable?: boolean; conform?: boolean | null }>;
        const sansDecision = (section.criteria ?? []).filter((criterion) => {
          const state = decisions[criterion.key];
          if (!state) return true;
          return state.applicable !== false && (state.conform === undefined || state.conform === null);
        });
        if (sansDecision.length > 0) {
          issues.push({
            section: section.label.fr,
            message: `${sansDecision.length} critère(s) non tranché(s), dont « ${sansDecision[0].label.fr} ».`,
            blocking: true,
          });
        }
      }

      // Conclusion : une inspection sans conclusion ne conclut rien.
      if (section.type === 'verdict' && (value === undefined || value === null || value === '')) {
        issues.push({
          section: section.label.fr,
          message: 'Conclusion non renseignée.',
          blocking: true,
        });
      }

      // Lignes minimales d'un tableau répétable
      if (section.repeatable && typeof section.minRows === 'number' && section.minRows > 0) {
        const rows = Array.isArray(value) ? value : [];
        if (rows.length < section.minRows) {
          issues.push({
            section: section.label.fr,
            message: `Au moins ${section.minRows} ligne(s) attendue(s), ${rows.length} saisie(s).`,
            blocking: true,
          });
        }
      }

      // Tolérances : hors plage, l'indication doit être signalée
      for (const column of section.columns ?? []) {
        if (!column.tolerance) continue;
        const rows = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
        for (const [index, row] of rows.entries()) {
          const raw = Number(row[column.key]);
          if (!Number.isFinite(raw)) continue;
          const { min, max } = column.tolerance;
          if ((min !== undefined && raw < min) || (max !== undefined && raw > max)) {
            issues.push({
              section: section.label.fr,
              field: `${column.label.fr}, ligne ${index + 1}`,
              message: `Valeur hors tolérance (${raw} ${column.unit ?? ''}).`,
              blocking: false,
            });
          }
        }
      }
    }

    // ── Étalonnage : règle bloquante ─────────────────────────────
    const inspectionDay = startOfDay(inspection.date);
    for (const link of inspection.devices) {
      const validUntil = link.measuringDevice.calibrationValidUntil;
      if (!validUntil || startOfDay(validUntil) < inspectionDay) {
        issues.push({
          section: 'Matériel utilisé',
          field: link.measuringDevice.code,
          message: validUntil
            ? `Étalonnage expiré le ${validUntil.toLocaleDateString('fr-FR')}, avant la date de l’essai.`
            : 'Aucun étalonnage enregistré pour cet instrument.',
          blocking: true,
        });
      }
    }

    if (
      inspection.template.paradigm !== 'CRITERIA' &&
      inspection.devices.length === 0 &&
      (schema.sections ?? []).some((s: TemplateSection) => s.type === 'devices')
    ) {
      issues.push({
        section: 'Matériel utilisé',
        message: 'Aucun instrument de mesure sélectionné.',
        blocking: true,
      });
    }

    // ── Cohérence verdict / conclusion ───────────────────────────
    const checklistSections = (schema.sections ?? []).filter((s) => s.type === 'checklist');
    const conclusionSection = (schema.sections ?? []).find((s) => s.type === 'verdict');

    if (checklistSections.length > 0 && conclusionSection) {
      const hasNonConformity = checklistSections.some((section) => {
        const verdicts = (data[section.key] ?? {}) as Record<string, string>;
        return Object.values(verdicts).includes('NC');
      });

      const conclusion = data[conclusionSection.key];
      if (hasNonConformity && typeof conclusion === 'string' && /sans réserve/i.test(conclusion)) {
        issues.push({
          section: conclusionSection.label.fr,
          message:
            'Au moins un point est non conforme : la conclusion « sans réserve » n’est pas recevable.',
          blocking: true,
        });
      }
    }

    return { issues, canSubmit: !issues.some((i) => i.blocking) };
  }

  /* ── Soumission ───────────────────────────────────────────────── */

  /**
   * Soumet l'inspection et ouvre le rapport correspondant.
   * Le rapport part au statut « Soumis » : il devra être vérifié par une
   * personne distincte du rédacteur avant émission (docs/05, W4).
   */
  async submit(
    user: RequestUser,
    id: string,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const inspection = await this.get(user, id);

    if (inspection.status !== 'DRAFT') {
      throw new BadRequestException('Cette inspection a déjà été soumise.');
    }
    if (inspection.inspectorId !== user.employeeId) {
      throw new ForbiddenException('Seul l’inspecteur affecté peut soumettre cette saisie.');
    }

    const { issues, canSubmit } = await this.validate(id);
    if (!canSubmit) {
      throw new BadRequestException({
        message: 'L’inspection ne peut pas être soumise en l’état.',
        errors: issues
          .filter((i) => i.blocking)
          .map((i) => ({ field: i.field ?? i.section, message: i.message })),
      });
    }

    const companyId = inspection.mission.affair.companyId;
    const formCode = inspection.template.formCode;

    // Après un renvoi en correction, la saisie est redevenue modifiable mais le
    // rapport existe déjà : on le renvoie en vérification au lieu d'en créer un
    // second — un numéro de rapport ne se dédouble pas parce qu'on a corrigé
    // une faute de frappe.
    const existing = await this.prisma.report.findUnique({
      where: { inspectionId: inspection.id },
      select: { id: true, number: true, status: true, revision: true },
    });

    const resubmission = existing !== null;

    const report = await this.prisma.$transaction(async (tx) => {
      await tx.inspection.update({ where: { id }, data: { status: 'SUBMITTED' } });

      if (existing) {
        return tx.report.update({
          where: { id: existing.id },
          data: {
            status: 'SUBMITTED',
            submittedAt: new Date(),
            checkedAt: null,
            // La grille du passage précédent ne vaut plus : elle portait sur
            // une version que le rédacteur vient de reprendre.
            checks: { deleteMany: {} },
            // L'indice de révision n'avance pas ici : il désigne la pièce
            // remise au client, et c'est l'ouverture d'une révision qui
            // l'incrémente. Une reprise avant émission reste l'indice 0.
          },
        });
      }

      const number = await this.numbering.next(companyId, 'REPORT', { formCode }, tx);

      return tx.report.create({
        data: {
          number,
          inspectionId: inspection.id,
          missionId: inspection.missionId,
          affairId: inspection.mission.affairId,
          templateId: inspection.templateId,
          authorId: inspection.inspectorId,
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });
    });

    await this.audit.record(
      {
        entity: 'inspection',
        entityId: id,
        action: resubmission ? 'RESUBMIT' : 'SUBMIT',
        after: { report: report.number, revision: report.revision, warnings: issues.length },
        companyId,
      },
      { user, ...ctx },
    );

    return { report, warnings: issues.filter((i) => !i.blocking) };
  }
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
