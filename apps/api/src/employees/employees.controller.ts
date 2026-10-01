import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  can,
  createEmployeeSchema,
  paginationSchema,
  setDailyCostSchema,
  type CreateEmployeeInput,
  type PaginationInput,
  type SetDailyCostInput,
} from '@i2s/contracts';
import { EmployeesService } from './employees.service';
import { DailyCostService } from './daily-cost.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { buildXlsx, readXlsxRows, XLSX_CONTENT_TYPE } from '../common/xlsx';
import type { RequestUser } from '../common/types';

const importSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  contentBase64: z.string().min(1).max(11_000_000),
});

const costImportSchema = importSchema.extend({
  /** Sans lui : aperçu seulement, rien n'est écrit. */
  apply: z.boolean().default(false),
});

@ApiTags('Employés')
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employees: EmployeesService,
    private readonly dailyCost: DailyCostService,
  ) {}

  @Get()
  @RequirePermission('employee', 'VIEW')
  list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput,
  ) {
    return this.employees.list(user, query);
  }

  /** Extraction Excel — les employés du périmètre, sans le RIB. */
  @Get('export')
  @RequirePermission('employee', 'EXPORT')
  async export(@CurrentUser() user: RequestUser, @Res() res: Response) {
    const rows = await this.employees.exportRows(user);
    const showCost = can(user.permissions, 'daily_cost', 'VIEW');

    const content = await buildXlsx(
      'Employés',
      [
        { header: 'Matricule', key: 'matricule', width: 12 },
        { header: 'Nom', key: 'lastName', width: 18 },
        { header: 'Prénom', key: 'firstName', width: 16 },
        { header: 'Fonction', key: 'position', width: 24 },
        { header: 'Département', key: 'department', width: 14 },
        { header: 'Inspecteur', key: 'isInspector', width: 12 },
        { header: 'Statut', key: 'status', width: 12 },
        ...(showCost
          ? [{ header: 'Coût journalier', key: 'dailyCost', width: 16, numFmt: '#,##0.00' }]
          : []),
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Téléphone', key: 'phone', width: 16 },
        { header: 'Embauché le', key: 'hireDate', width: 14 },
        { header: 'Type de contrat', key: 'contractType', width: 16 },
      ],
      rows.map((e) => ({
        matricule: e.matricule,
        lastName: e.lastName.toUpperCase(),
        firstName: e.firstName,
        position: e.position ?? '',
        department: e.department?.code ?? '',
        isInspector: e.isInspector ? 'Oui' : 'Non',
        status: e.status,
        dailyCost: showCost && e.dailyCosts[0] ? Number(e.dailyCosts[0].amount) : null,
        email: e.email ?? '',
        phone: e.phone ?? '',
        hireDate: e.hireDate ? e.hireDate.toLocaleDateString('fr-FR') : '',
        contractType: e.contractType ?? '',
      })),
    );

    res.setHeader('Content-Type', XLSX_CONTENT_TYPE);
    res.setHeader('Content-Disposition', 'attachment; filename="employes.xlsx"');
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(content);
  }

  /**
   * Modèle de mise à jour des coûts : un employé par ligne avec son coût
   * actuel. On remplit « Nouveau coût journalier » et « Date d'effet » pour
   * ceux qui changent ; les lignes laissées vides sont ignorées. Pour
   * reprendre un historique, on ajoute une ligne par période.
   */
  @Get('daily-costs/template')
  @RequirePermission('daily_cost', 'UPDATE')
  async costTemplate(@CurrentUser() user: RequestUser, @Res() res: Response) {
    const rows = await this.employees.costTemplateRows(user);
    const content = await buildXlsx(
      'Coûts journaliers',
      [
        { header: 'Matricule', key: 'matricule', width: 12 },
        { header: 'Nom', key: 'lastName', width: 18 },
        { header: 'Prénom', key: 'firstName', width: 16 },
        { header: 'Département', key: 'department', width: 13 },
        { header: 'Coût actuel', key: 'current', width: 14, numFmt: '#,##0.00' },
        { header: 'En vigueur depuis', key: 'since', width: 17 },
        { header: 'Nouveau coût journalier', key: 'amount', width: 22, numFmt: '#,##0.00' },
        { header: 'Date d’effet', key: 'validFrom', width: 14 },
        { header: 'Motif', key: 'reason', width: 34 },
      ],
      rows.map((e) => ({
        matricule: e.matricule,
        lastName: e.lastName.toUpperCase(),
        firstName: e.firstName,
        department: e.department?.code ?? '',
        current: e.dailyCosts[0] ? Number(e.dailyCosts[0].amount) : null,
        since: e.dailyCosts[0]
          ? e.dailyCosts[0].validFrom.toLocaleDateString('fr-FR', { timeZone: 'UTC' })
          : '',
        amount: null,
        validFrom: '',
        reason: '',
      })),
    );

    res.setHeader('Content-Type', XLSX_CONTENT_TYPE);
    res.setHeader('Content-Disposition', 'attachment; filename="couts-journaliers.xlsx"');
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(content);
  }

  /** Mise à jour des coûts par classeur — aperçu, puis application tout ou rien. */
  @Post('daily-costs/import')
  @RequirePermission('daily_cost', 'UPDATE')
  async importCosts(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(costImportSchema)) body: z.infer<typeof costImportSchema>,
    @Req() req: Request,
  ) {
    const rows = await readXlsxRows(Buffer.from(body.contentBase64, 'base64'));
    return this.dailyCost.importSheet(user, body.fileName, rows, body.apply, ctx(req));
  }

  /** Import en masse — mêmes colonnes que l'export, matricule non écrasé. */
  @Post('import')
  @RequirePermission('employee', 'CREATE')
  async import(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(importSchema)) body: z.infer<typeof importSchema>,
    @Req() req: Request,
  ) {
    const buffer = Buffer.from(body.contentBase64, 'base64');
    const rows = await readXlsxRows(buffer);
    return this.employees.importRows(user, rows, ctx(req));
  }

  @Get(':id')
  @RequirePermission('employee', 'VIEW')
  async get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const employee = await this.employees.get(user, id);
    const canViewCost = can(user.permissions, 'daily_cost', 'VIEW');
    return {
      ...employee,
      // Le coût journalier dit le salaire : il ne sort que pour qui a le droit de le voir.
      dailyCosts: canViewCost ? employee.dailyCosts : [],
      costVisible: canViewCost,
      actions: {
        update: user.permissions.some((p) => p.resource === 'employee' && p.action === 'UPDATE'),
        setCost: can(user.permissions, 'daily_cost', 'UPDATE'),
      },
    };
  }

  @Post()
  @RequirePermission('employee', 'CREATE')
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createEmployeeSchema)) body: CreateEmployeeInput,
    @Req() req: Request,
  ) {
    return this.employees.create(user, body, ctx(req));
  }

  @Patch(':id')
  @RequirePermission('employee', 'UPDATE')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createEmployeeSchema.partial()))
    body: Partial<CreateEmployeeInput>,
    @Req() req: Request,
  ) {
    return this.employees.update(user, id, body, ctx(req));
  }

  @Get(':id/daily-costs')
  @RequirePermission('daily_cost', 'VIEW')
  async history(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    // Le périmètre de l'employé s'applique aussi à son historique de coûts.
    await this.employees.get(user, id);
    return this.dailyCost.history(id);
  }

  /**
   * Ouvre une nouvelle période de coût journalier.
   * N'écrase jamais l'historique — voir docs/09-CONTROLE-DE-GESTION.md §1.
   */
  @Post(':id/daily-costs')
  @RequirePermission('daily_cost', 'UPDATE')
  async setCost(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setDailyCostSchema.omit({ employeeId: true })))
    body: Omit<SetDailyCostInput, 'employeeId'>,
    @Req() req: Request,
  ) {
    await this.employees.get(user, id);
    return this.dailyCost.set({ ...body, employeeId: id }, user, ctx(req));
  }
}

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}
