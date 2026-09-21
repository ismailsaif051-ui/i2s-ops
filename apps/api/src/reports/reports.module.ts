import { Body, Controller, Get, Module, NotFoundException, Param, Post, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import {
  CHECK_DECISIONS,
  departmentOfForm,
  DISTRIBUTION_CHANNELS,
  REPORT_CHECK_CRITERIA,
  REPORT_STATUSES,
  REPORT_STATUS_LABELS,
} from '@i2s/contracts';
import { REPORT_SCOPE, ReportsService, isOnTime } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeService } from '../rbac/scope.service';
import { DocumentsService } from '../documents/documents.service';
import { AssetsModule } from '../assets/assets.module';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

/** Un champ de filtre laissé vide dans le formulaire n'est pas un filtre. */
const blank = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalId = z.preprocess(blank, z.string().uuid().optional());

const listSchema = z.object({
  /** Recherche libre : numéro de rapport, numéro ou objet d'affaire, client. */
  q: z.preprocess(blank, z.string().trim().max(120).optional()),
  status: z.preprocess(blank, z.enum(REPORT_STATUSES).optional()),
  /** Type de rapport : le modèle du référentiel qualité (PR01-F02…). */
  templateId: optionalId,
  departmentId: optionalId,
  authorId: optionalId,
  clientId: optionalId,
  /** Date du contrôle — pas la date de saisie, qui ne dit rien au métier. */
  from: z.preprocess(blank, z.coerce.date().optional()),
  to: z.preprocess(blank, z.coerce.date().optional()),
  /** Seulement les rapports hors délai : remis en retard, ou attendus et pas remis. */
  late: z.preprocess(blank, z.enum(['1']).optional()),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const checkSchema = z.object({
  checks: z
    .array(
      z.object({
        criterion: z.string().trim().min(1).max(300),
        applicable: z.boolean(),
        conform: z.boolean().nullable(),
        comment: z.string().trim().max(2000).nullable().optional(),
      }),
    )
    .min(1),
  decision: z.enum(CHECK_DECISIONS),
  reason: z.string().trim().max(2000).nullable().optional(),
});

const reviseSchema = z.object({
  reason: z.string().trim().min(3, 'Le motif de la révision est obligatoire.').max(2000),
});

const deliverSchema = z.object({
  channel: z.enum(DISTRIBUTION_CHANNELS),
  sentAt: z.coerce.date().optional(),
});

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

function fullName(person: { firstName: string; lastName: string }): string {
  return `${person.lastName.toUpperCase()} ${person.firstName}`;
}

@ApiTags('Rapports')
@Controller('reports')
class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
    private readonly documents: DocumentsService,
  ) {}

  @Get()
  @RequirePermission('report', 'VIEW')
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(listSchema)) query: z.infer<typeof listSchema>,
  ) {
    const scopeWhere = this.scope.buildWhere(
      user,
      'report',
      'VIEW',
      REPORT_SCOPE,
    ) as Prisma.ReportWhereInput;

    // Les filtres s'ajoutent au périmètre, ils ne le remplacent jamais : un
    // filtre sur un service ne doit pas ouvrir les rapports d'un autre service.
    const filters: Prisma.ReportWhereInput[] = [];
    if (query.status) filters.push({ status: query.status });
    if (query.templateId) filters.push({ templateId: query.templateId });
    if (query.departmentId) filters.push({ mission: { departmentId: query.departmentId } });
    if (query.authorId) filters.push({ authorId: query.authorId });
    if (query.clientId) filters.push({ affair: { clientId: query.clientId } });
    if (query.q) {
      const contains = { contains: query.q, mode: 'insensitive' as const };
      filters.push({
        OR: [
          { number: contains },
          { affair: { number: contains } },
          { affair: { title: contains } },
          { affair: { client: { name: contains } } },
        ],
      });
    }
    if (query.from || query.to) {
      const range = {
        ...(query.from ? { gte: startOfDay(query.from) } : {}),
        ...(query.to ? { lt: new Date(startOfDay(query.to).getTime() + 86_400_000) } : {}),
      };
      // Date du contrôle : celle de la saisie terrain quand elle existe, sinon
      // la fin réelle de la mission.
      filters.push({
        OR: [
          { inspection: { is: { date: range } } },
          { inspectionId: null, mission: { actualEndDate: range } },
        ],
      });
    }

    const where: Prisma.ReportWhereInput = { AND: [scopeWhere, ...filters] };

    // « Hors délai » compare deux dates de deux tables : il se calcule après
    // lecture. On lit donc plus large, puis on ne garde que les rapports concernés.
    const take = query.late ? 2000 : query.limit;

    const [rows, count, facetRows] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: [{ mission: { actualEndDate: 'desc' } }, { number: 'desc' }],
        take,
        include: {
          template: { select: { id: true, formCode: true, title: true } },
          affair: {
            select: { number: true, title: true, client: { select: { id: true, name: true } } },
          },
          mission: {
            select: {
              number: true,
              reportDueDate: true,
              actualEndDate: true,
              department: { select: { code: true } },
            },
          },
          inspection: { select: { date: true } },
          author: { select: { id: true, firstName: true, lastName: true } },
          checker: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      query.late ? Promise.resolve(0) : this.prisma.report.count({ where }),
      // Les choix des listes viennent du périmètre entier, pas de la sélection :
      // un filtre posé ne doit pas faire disparaître les autres options.
      this.prisma.report.findMany({
        where: scopeWhere,
        select: {
          status: true,
          template: { select: { id: true, formCode: true, title: true } },
          author: { select: { id: true, firstName: true, lastName: true } },
          mission: { select: { department: { select: { id: true, code: true, name: true } } } },
          affair: { select: { client: { select: { id: true, name: true } } } },
        },
      }),
    ]);

    const today = startOfDay(new Date());

    let items = rows.map((r) => {
      const due = r.mission.reportDueDate;
      const onTime = isOnTime(r.deliveredAt, due);
      // Attendu, pas encore remis, échéance passée : le retard court encore.
      const overdueDays =
        !r.deliveredAt && due && startOfDay(due) < today
          ? Math.round((today.getTime() - startOfDay(due).getTime()) / 86_400_000)
          : 0;

      return {
        id: r.id,
        number: r.number,
        status: r.status,
        revision: r.revision,
        /** Le type de rapport : le modèle du référentiel qualité. */
        type: r.template
          ? {
              id: r.template.id,
              formCode: r.template.formCode,
              title: r.template.title,
              department: departmentOfForm(r.template.formCode),
            }
          : null,
        affair: { number: r.affair.number, title: r.affair.title },
        client: r.affair.client,
        department: r.mission.department?.code ?? null,
        mission: {
          number: r.mission.number,
          reportDueDate: r.mission.reportDueDate,
          actualEndDate: r.mission.actualEndDate,
        },
        controlDate: r.inspection?.date ?? r.mission.actualEndDate,
        author: fullName(r.author),
        checker: r.checker ? fullName(r.checker) : null,
        submittedAt: r.submittedAt,
        issuedAt: r.issuedAt,
        deliveredAt: r.deliveredAt,
        /** Le rapport a-t-il été remis dans le délai QMS de 21 jours ouvrés ? */
        onTime,
        overdueDays,
        late: onTime === false || overdueDays > 0,
        /**
         * Ce que l'utilisateur peut faire ici et maintenant. Calculé côté
         * serveur : la liste n'affiche pas une action que l'API refuserait.
         */
        canCheck:
          ['SUBMITTED', 'UNDER_CHECK'].includes(r.status) &&
          r.authorId !== user.employeeId &&
          (!r.checkerId || r.checkerId === user.employeeId),
        isAuthor: r.authorId === user.employeeId,
      };
    });

    if (query.late) items = items.filter((i) => i.late);
    const total = query.late ? items.length : count;
    items = items.slice(0, query.limit);

    /* ── Les choix des listes, avec leur nombre de rapports ─────── */

    const templates = new Map<
      string,
      { id: string; formCode: string; title: string; department: string | null; count: number }
    >();
    const statuses = new Map<string, number>();
    const departments = new Map<string, { id: string; code: string; name: string; count: number }>();
    const authors = new Map<string, { id: string; name: string; count: number }>();
    const clients = new Map<string, { id: string; name: string; count: number }>();
    let untyped = 0;

    for (const r of facetRows) {
      statuses.set(r.status, (statuses.get(r.status) ?? 0) + 1);

      if (r.template) {
        const t = templates.get(r.template.id) ?? {
          ...r.template,
          department: departmentOfForm(r.template.formCode),
          count: 0,
        };
        t.count += 1;
        templates.set(r.template.id, t);
      } else {
        untyped += 1;
      }

      const dept = r.mission.department;
      if (dept) {
        const d = departments.get(dept.id) ?? { ...dept, count: 0 };
        d.count += 1;
        departments.set(dept.id, d);
      }

      const a = authors.get(r.author.id) ?? { id: r.author.id, name: fullName(r.author), count: 0 };
      a.count += 1;
      authors.set(r.author.id, a);

      const c = clients.get(r.affair.client.id) ?? { ...r.affair.client, count: 0 };
      c.count += 1;
      clients.set(r.affair.client.id, c);
    }

    const byName = (x: { name: string }, y: { name: string }) => x.name.localeCompare(y.name, 'fr');

    return {
      items,
      /** Nombre de rapports correspondant aux filtres, au-delà de ceux affichés. */
      total,
      facets: {
        templates: [...templates.values()].sort((x, y) => x.formCode.localeCompare(y.formCode)),
        statuses: REPORT_STATUSES.filter((s) => statuses.has(s)).map((s) => ({
          value: s,
          label: REPORT_STATUS_LABELS[s],
          count: statuses.get(s) ?? 0,
        })),
        departments: [...departments.values()].sort((x, y) => x.code.localeCompare(y.code)),
        authors: [...authors.values()].sort(byName),
        clients: [...clients.values()].sort(byName),
        /** Rapports sans type : anciens rapports non rattachés à un modèle. */
        untyped,
      },
    };
  }

  /** Grille de vérification en vigueur, pour que le front n'invente rien. */
  @Get('check-criteria')
  @RequirePermission('report', 'VIEW')
  criteria() {
    return { items: [...REPORT_CHECK_CRITERIA] };
  }

  @Get(':id')
  @RequirePermission('report', 'VIEW')
  async detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const report = await this.reports.get(user, id);
    const inspection = report.inspection;

    const delay = await this.reports.deliveryDelay(
      report.affair.companyId,
      report.mission.actualEndDate,
      report.deliveredAt,
    );

    const canApprove = user.permissions.some(
      (p) => p.resource === 'report' && p.action === 'APPROVE',
    );
    const canExport = user.permissions.some(
      (p) => p.resource === 'report' && p.action === 'EXPORT',
    );
    const isAuthor = report.authorId === user.employeeId;

    return {
      id: report.id,
      number: report.number,
      status: report.status,
      revision: report.revision,
      revisionReason: report.revisionReason,
      /** Le type de rapport : le modèle du référentiel qualité. */
      type: report.template
        ? { id: report.template.id, formCode: report.template.formCode, title: report.template.title }
        : null,
      submittedAt: report.submittedAt,
      checkedAt: report.checkedAt,
      issuedAt: report.issuedAt,
      deliveredAt: report.deliveredAt,
      dueDate: report.mission.reportDueDate,
      /** Jours ouvrés écoulés entre la fin du terrain et la remise. */
      deliveryDelay: delay,
      onTime: isOnTime(report.deliveredAt, report.mission.reportDueDate),
      author: { id: report.author.id, name: fullName(report.author), matricule: report.author.matricule },
      checker: report.checker
        ? { id: report.checker.id, name: fullName(report.checker), matricule: report.checker.matricule }
        : null,
      affair: {
        id: report.affair.id,
        number: report.affair.number,
        title: report.affair.title,
        client: report.affair.client.name,
      },
      mission: {
        id: report.mission.id,
        number: report.mission.number,
        objective: report.mission.objective,
        site: report.mission.site?.name ?? null,
        department: report.mission.department?.code ?? null,
      },
      checks: report.checks.map((c) => ({
        criterion: c.criterion,
        applicable: c.applicable,
        conform: c.conform,
        comment: c.comment,
        checkedAt: c.checkedAt,
      })),
      distributions: report.distributions.map((d) => ({
        channel: d.channel,
        sentAt: d.sentAt,
        acknowledgedAt: d.acknowledgedAt,
      })),
      /** La saisie d'origine, rendue en lecture seule sous le rapport. */
      inspection: inspection
        ? {
            id: inspection.id,
            status: inspection.status,
            date: inspection.date,
            data: inspection.data,
            template: {
              formCode: inspection.template.formCode,
              version: inspection.templateVersion,
              title: inspection.template.title,
              titleEn: inspection.template.titleEn,
              paradigm: inspection.template.paradigm,
              schema: inspection.template.schema,
            },
            inspector: {
              name: fullName(inspection.inspector),
              matricule: report.author.matricule,
            },
            mission: {
              number: report.mission.number,
              objective: report.mission.objective,
              affairNumber: report.affair.number,
              client: report.affair.client.name,
              site: report.mission.site?.name ?? null,
            },
            devices: inspection.devices.map((d) => ({
              id: d.measuringDevice.id,
              code: d.measuringDevice.code,
              type: d.measuringDevice.type,
              brand: d.measuringDevice.brand,
              model: d.measuringDevice.model,
              serialNumber: d.measuringDevice.serialNumber,
              calibrationValidUntil: d.calibrationValidAt,
            })),
          }
        : null,
      /**
       * Actions réellement ouvertes. Le front n'affiche pas de bouton mort :
       * chaque condition ci-dessous est celle que le service applique.
       */
      actions: {
        take:
          canApprove &&
          !isAuthor &&
          ['SUBMITTED', 'UNDER_CHECK'].includes(report.status) &&
          (!report.checkerId || report.checkerId === user.employeeId),
        check:
          canApprove &&
          !isAuthor &&
          report.status === 'UNDER_CHECK' &&
          report.checkerId === user.employeeId,
        issue: canExport && report.status === 'VALIDATED',
        deliver: canExport && ['ISSUED', 'ARCHIVED'].includes(report.status),
        revise:
          user.permissions.some((p) => p.resource === 'report' && p.action === 'UPDATE') &&
          ['ISSUED', 'ARCHIVED'].includes(report.status),
      },
      criteria: [...REPORT_CHECK_CRITERIA],
      /** Le PDF n'existe qu'à partir de l'émission. */
      pdf: report.pdfDocumentId ? { fileName: `${report.number}.pdf` } : null,
    };
  }

  /**
   * Sert la pièce remise au client.
   *
   * Elle passe par le rapport, pas par la GED : c'est le droit sur le rapport
   * qui décide, et le périmètre déjà appliqué à sa lecture vaut ici aussi.
   */
  @Get(':id/pdf')
  @RequirePermission('report', 'VIEW')
  async pdf(@CurrentUser() user: RequestUser, @Param('id') id: string, @Res() res: Response) {
    const report = await this.reports.get(user, id);
    if (!report.pdfDocumentId) {
      throw new NotFoundException('Ce rapport n’a pas encore été émis : aucune pièce à remettre.');
    }

    const { document, content } = await this.documents.download(user, report.pdfDocumentId);

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Length', String(content.byteLength));
    res.setHeader('Content-Disposition', `inline; filename="${report.number}.pdf"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(content);
  }

  @Post(':id/take')
  @RequirePermission('report', 'APPROVE')
  take(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.reports.take(user, id, ctx(req));
  }

  @Post(':id/check')
  @RequirePermission('report', 'APPROVE')
  check(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(checkSchema)) body: z.infer<typeof checkSchema>,
    @Req() req: Request,
  ) {
    return this.reports.check(user, id, body, ctx(req));
  }

  @Post(':id/revise')
  @RequirePermission('report', 'UPDATE')
  revise(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reviseSchema)) body: z.infer<typeof reviseSchema>,
    @Req() req: Request,
  ) {
    return this.reports.revise(user, id, body, ctx(req));
  }

  @Post(':id/issue')
  @RequirePermission('report', 'EXPORT')
  issue(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.reports.issue(user, id, ctx(req));
  }

  @Post(':id/deliver')
  @RequirePermission('report', 'EXPORT')
  deliver(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(deliverSchema)) body: z.infer<typeof deliverSchema>,
    @Req() req: Request,
  ) {
    return this.reports.deliver(user, id, body, ctx(req));
  }
}

@Module({
  imports: [AssetsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
