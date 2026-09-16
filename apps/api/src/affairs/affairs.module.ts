import {
  Body,
  Controller,
  Get,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { paginationSchema, type PaginationInput } from '@i2s/contracts';
import { AffairsService } from './affairs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { buildXlsx, XLSX_CONTENT_TYPE } from '../common/xlsx';
import type { RequestUser } from '../common/types';

const COMMERCIAL_STATUSES = ['GAGNEE', 'SUIVANT_OP', 'PERDUE_ANNULEE', 'DP'] as const;
const WORKS_STATUSES = [
  'NON_DEMARRE',
  'EN_COURS',
  'A_FACTURER',
  'FAC_PARTIELLE',
  'FAC_TOTALE',
  'PERDU_ANNULE',
] as const;

const affairSchema = z.object({
  clientId: z.string().uuid('Choisissez un client.'),
  title: z.string().trim().min(3, 'La désignation est obligatoire.').max(240),
  /** Service pilote — obligatoire : c'est lui qui porte l'affaire. */
  departmentId: z.string().uuid('Choisissez le service pilote.'),
  departmentIds: z.array(z.string().uuid()).optional(),
  accountManagerId: z.string().uuid().optional().or(z.literal('')),
  pilotId: z.string().uuid().optional().or(z.literal('')),
  preparedById: z.string().uuid().optional().or(z.literal('')),
  controlLocation: z.string().trim().max(240).optional().or(z.literal('')),
  endClient: z.string().trim().max(160).optional().or(z.literal('')),
  engineeringOffice: z.string().trim().max(160).optional().or(z.literal('')),
  offerAmountHT: z.coerce.number().min(0).optional().nullable(),
  poAmountHT: z.coerce.number().min(0).optional().nullable(),
  poNumber: z.string().trim().max(80).optional().or(z.literal('')),
  commercialStatus: z.enum(COMMERCIAL_STATUSES).optional(),
  worksStatus: z.enum(WORKS_STATUSES).optional(),
  physicalFileOpened: z.boolean().optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  observation: z.string().trim().max(2000).optional().or(z.literal('')),
});

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

@ApiTags('Affaires')
@Controller('affairs')
class AffairsController {
  constructor(
    private readonly affairs: AffairsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @RequirePermission('affair', 'VIEW')
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput,
    @Query('commercialStatus') commercialStatus?: string,
    @Query('worksStatus') worksStatus?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const scopeWhere = this.affairs.affairWhere(user, 'VIEW');
    const baseWhere = { deletedAt: null, ...scopeWhere };

    const where = {
      ...baseWhere,
      ...(commercialStatus ? { commercialStatus: commercialStatus as never } : {}),
      ...(worksStatus ? { worksStatus: worksStatus as never } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(query.q
        ? {
            OR: [
              { number: { contains: query.q, mode: 'insensitive' as const } },
              { title: { contains: query.q, mode: 'insensitive' as const } },
              { client: { name: { contains: query.q, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [rows, total, commercialCounts, worksCounts, departments] = await Promise.all([
      this.prisma.affair.findMany({
        where,
        orderBy: { number: 'desc' },
        take: query.limit + 1,
        ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
        include: {
          client: { select: { id: true, name: true } },
          department: { select: { code: true } },
          accountManager: { select: { firstName: true, lastName: true } },
          _count: { select: { missions: true, reports: true, invoices: true } },
        },
      }),
      this.prisma.affair.count({ where }),
      this.prisma.affair.groupBy({ by: ['commercialStatus'], where: baseWhere, _count: true }),
      this.prisma.affair.groupBy({ by: ['worksStatus'], where: baseWhere, _count: true }),
      this.prisma.department.findMany({
        where: { companyId: { in: user.companyIds } },
        orderBy: { code: 'asc' },
        select: { id: true, code: true, name: true },
      }),
    ]);

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;

    // Chiffres consolidés en une requête par métrique plutôt qu'une par ligne.
    const ids = page.map((a) => a.id);
    const [invoiced, labour] = await Promise.all([
      this.prisma.invoice.groupBy({
        by: ['affairId'],
        where: { affairId: { in: ids }, status: { not: 'CANCELLED' } },
        _sum: { totalHT: true },
      }),
      this.prisma.timesheetDay.groupBy({
        by: ['affairId'],
        where: { affairId: { in: ids } },
        _sum: { dailyCostSnapshot: true },
        _count: true,
      }),
    ]);

    const invoicedBy = new Map(invoiced.map((i) => [i.affairId, Number(i._sum.totalHT ?? 0)]));
    const labourBy = new Map(
      labour.map((l) => [
        l.affairId,
        { cost: Number(l._sum.dailyCostSnapshot ?? 0), days: l._count },
      ]),
    );

    const items = page.map((a) => {
      const invoicedAmount = invoicedBy.get(a.id) ?? 0;
      const labourInfo = labourBy.get(a.id) ?? { cost: 0, days: 0 };
      const marginRate =
        invoicedAmount > 0
          ? Math.round(((invoicedAmount - labourInfo.cost) / invoicedAmount) * 1000) / 10
          : null;
      const budgetRate = a.budgetMarginRate === null ? null : Number(a.budgetMarginRate);

      return {
        id: a.id,
        number: a.number,
        title: a.title,
        status: a.status,
        commercialStatus: a.commercialStatus,
        worksStatus: a.worksStatus,
        pilotInitials: a.pilotInitials,
        poNumber: a.poNumber,
        offerAmount: a.offerAmountHT ? Number(a.offerAmountHT) : null,
        client: a.client,
        department: a.department?.code ?? null,
        accountManager: a.accountManager
          ? `${a.accountManager.lastName.toUpperCase()} ${a.accountManager.firstName}`
          : null,
        contractAmount: a.contractAmountHT ? Number(a.contractAmountHT) : null,
        invoiced: invoicedAmount,
        consumedDays: labourInfo.days,
        /** Marge indicative avant frais et véhicules — le détail est sur la fiche. */
        marginRate,
        budgetMarginRate: budgetRate,
        counts: a._count,
      };
    });

    return {
      items,
      total,
      nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
      facets: {
        commercialStatuses: commercialCounts.map((c) => ({
          value: c.commercialStatus,
          count: c._count,
        })),
        worksStatuses: worksCounts.map((w) => ({ value: w.worksStatus, count: w._count })),
        departments,
      },
    };
  }

  /** Extraction Excel — les affaires du périmètre (mêmes filtres que la liste), sans pagination. */
  @Get('export')
  @RequirePermission('affair', 'EXPORT')
  async export(
    @CurrentUser() user: RequestUser,
    @Res() res: Response,
    @Query('q') q?: string,
    @Query('commercialStatus') commercialStatus?: string,
    @Query('worksStatus') worksStatus?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const scopeWhere = this.affairs.affairWhere(user, 'VIEW');

    const rows = await this.prisma.affair.findMany({
      where: {
        deletedAt: null,
        ...scopeWhere,
        ...(commercialStatus ? { commercialStatus: commercialStatus as never } : {}),
        ...(worksStatus ? { worksStatus: worksStatus as never } : {}),
        ...(departmentId ? { departmentId } : {}),
        ...(q
          ? {
              OR: [
                { number: { contains: q, mode: 'insensitive' as const } },
                { title: { contains: q, mode: 'insensitive' as const } },
                { client: { name: { contains: q, mode: 'insensitive' as const } } },
              ],
            }
          : {}),
      },
      orderBy: { number: 'desc' },
      take: 5000,
      include: {
        client: { select: { name: true } },
        department: { select: { code: true } },
        accountManager: { select: { firstName: true, lastName: true } },
      },
    });

    const content = await buildXlsx(
      'Affaires',
      [
        { header: 'N° affaire', key: 'number', width: 14 },
        { header: 'Désignation', key: 'title', width: 40 },
        { header: 'Client', key: 'client', width: 26 },
        { header: 'Service pilote', key: 'department', width: 14 },
        { header: 'Chargé d’affaires', key: 'accountManager', width: 22 },
        { header: 'Statut commercial', key: 'commercialStatus', width: 18 },
        { header: 'Statut travaux', key: 'worksStatus', width: 16 },
        { header: 'N° bon de commande', key: 'poNumber', width: 18 },
        { header: 'Montant offre HT', key: 'offerAmount', width: 16, numFmt: '#,##0.00' },
        { header: 'Montant BC HT', key: 'poAmount', width: 16, numFmt: '#,##0.00' },
        { header: 'Début', key: 'startDate', width: 12 },
        { header: 'Fin', key: 'endDate', width: 12 },
      ],
      rows.map((a) => ({
        number: a.number,
        title: a.title,
        client: a.client?.name ?? '',
        department: a.department?.code ?? '',
        accountManager: a.accountManager
          ? `${a.accountManager.lastName.toUpperCase()} ${a.accountManager.firstName}`
          : '',
        commercialStatus: a.commercialStatus,
        worksStatus: a.worksStatus,
        poNumber: a.poNumber ?? '',
        offerAmount: a.offerAmountHT ? Number(a.offerAmountHT) : null,
        poAmount: a.poAmountHT ? Number(a.poAmountHT) : null,
        startDate: a.startDate ? a.startDate.toLocaleDateString('fr-FR') : '',
        endDate: a.endDate ? a.endDate.toLocaleDateString('fr-FR') : '',
      })),
    );

    res.setHeader('Content-Type', XLSX_CONTENT_TYPE);
    res.setHeader('Content-Disposition', 'attachment; filename="affaires.xlsx"');
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(content);
  }

  /**
   * Tout ce dont le formulaire d'ouverture a besoin, en un appel : listes de
   * choix et prochain Code Affaire, montré sans être consommé.
   */
  @Get('options')
  @RequirePermission('affair', 'CREATE')
  async options(@CurrentUser() user: RequestUser) {
    const companyId = user.companyIds[0];
    if (!companyId) return { clients: [], departments: [], employees: [], nextNumber: null };

    const [clients, departments, employees, nextNumber] = await Promise.all([
      this.prisma.client.findMany({
        where: { companyId, deletedAt: null },
        orderBy: { name: 'asc' },
        select: { id: true, code: true, name: true, type: true },
      }),
      this.prisma.department.findMany({
        where: { companyId },
        orderBy: { code: 'asc' },
        select: { id: true, code: true, name: true },
      }),
      this.prisma.employee.findMany({
        where: { companyId, deletedAt: null, status: 'ACTIVE' },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        select: {
          id: true,
          matricule: true,
          firstName: true,
          lastName: true,
          position: true,
          department: { select: { code: true } },
        },
      }),
      this.affairs.peekNextNumber(companyId),
    ]);

    return {
      clients,
      departments,
      employees: employees.map((e) => ({
        id: e.id,
        matricule: e.matricule,
        name: `${e.lastName.toUpperCase()} ${e.firstName}`,
        position: e.position,
        department: e.department?.code ?? null,
      })),
      nextNumber,
    };
  }

  @Get(':id')
  @RequirePermission('affair', 'VIEW')
  async get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const scopeWhere = this.affairs.affairWhere(user, 'VIEW');

    const affair = await this.prisma.affair.findFirst({
      where: { id, deletedAt: null, ...scopeWhere },
      include: {
        client: { select: { id: true, name: true, code: true, paymentTerms: true } },
        department: { select: { code: true, name: true } },
        accountManager: { select: { firstName: true, lastName: true } },
        budgetLines: true,
        projects: { include: { sites: true } },
        missions: {
          orderBy: { plannedStartDate: 'desc' },
          take: 30,
          include: {
            assignments: {
              include: {
                employee: { select: { matricule: true, firstName: true, lastName: true } },
              },
            },
          },
        },
        reports: { orderBy: { createdAt: 'desc' }, take: 20 },
        attachments: { orderBy: { periodStart: 'desc' } },
        invoices: { orderBy: { issueDate: 'desc' }, include: { payments: true } },
        nonConformities: { orderBy: { dueDate: 'asc' } },
      },
    });

    if (!affair) throw new NotFoundException('Affaire introuvable ou hors de votre périmètre.');
    return affair;
  }

  @Post()
  @RequirePermission('affair', 'CREATE')
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(affairSchema)) body: z.infer<typeof affairSchema>,
    @Req() req: Request,
  ) {
    return this.affairs.create(user, body, ctx(req));
  }

  @Patch(':id')
  @RequirePermission('affair', 'UPDATE')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(affairSchema.partial())) body: Partial<z.infer<typeof affairSchema>>,
    @Req() req: Request,
  ) {
    return this.affairs.update(user, id, body, ctx(req));
  }
}

@Module({
  controllers: [AffairsController],
  providers: [AffairsService],
  exports: [AffairsService],
})
export class AffairsModule {}
