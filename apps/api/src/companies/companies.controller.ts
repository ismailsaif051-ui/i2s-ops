import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { createDepartmentSchema, departmentOfForm } from '@i2s/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

@ApiTags('Référentiels')
@Controller()
export class CompaniesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Sociétés sur lesquelles l'utilisateur est habilité. */
  @Get('companies')
  async companies(@CurrentUser() user: RequestUser) {
    const isGroupWide = user.permissions.some(
      (p) => p.resource === 'setting' && p.scope === 'ALL',
    );
    return this.prisma.company.findMany({
      where: {
        deletedAt: null,
        ...(isGroupWide ? {} : { id: { in: user.companyIds } }),
      },
      orderBy: { code: 'asc' },
      select: { id: true, code: true, name: true, currency: true, vatRate: true, isActive: true },
    });
  }

  @Get('departments')
  @RequirePermission('employee', 'VIEW')
  departments(@CurrentUser() user: RequestUser) {
    return this.prisma.department.findMany({
      where: { deletedAt: null, companyId: { in: user.companyIds } },
      orderBy: { code: 'asc' },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { employees: true } },
      },
    });
  }

  @Post('departments')
  @RequirePermission('setting', 'CREATE')
  async createDepartment(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createDepartmentSchema))
    body: { companyId: string; code: string; name: string; managerId?: string },
    @Req() req: Request,
  ) {
    const created = await this.prisma.department.create({ data: body });
    await this.audit.record(
      { entity: 'department', entityId: created.id, action: 'CREATE', after: body },
      { user, ip: req.ip, userAgent: req.headers['user-agent'] },
    );
    return created;
  }

  @Patch('departments/:id')
  @RequirePermission('setting', 'UPDATE')
  async updateDepartment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createDepartmentSchema.partial().omit({ companyId: true })))
    body: { code?: string; name?: string; managerId?: string },
    @Req() req: Request,
  ) {
    const before = await this.prisma.department.findUniqueOrThrow({ where: { id } });
    const after = await this.prisma.department.update({ where: { id }, data: body });
    const changes = this.audit.diff(
      before as unknown as Record<string, unknown>,
      after as unknown as Record<string, unknown>,
    );
    await this.audit.record(
      { entity: 'department', entityId: id, action: 'UPDATE', ...changes },
      { user, ip: req.ip, userAgent: req.headers['user-agent'] },
    );
    return after;
  }

  /** Paramètres métier : barèmes, plafonds, délais, motifs de rejet. */
  @Get('settings')
  @RequirePermission('setting', 'VIEW')
  async settings(@CurrentUser() user: RequestUser) {
    const rows = await this.prisma.setting.findMany({
      where: { companyId: { in: user.companyIds } },
      orderBy: { key: 'asc' },
    });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  @Get('expense-categories')
  @RequirePermission('expense_report', 'VIEW')
  expenseCategories() {
    return this.prisma.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
    });
  }

  @Get('inspection-methods')
  @RequirePermission('inspection_template', 'VIEW')
  methods() {
    return this.prisma.inspectionMethod.findMany({
      orderBy: { code: 'asc' },
      include: { department: { select: { code: true } } },
    });
  }

  /** Bibliothèque des formulaires d'inspection publiés. */
  @Get('inspection-templates')
  @RequirePermission('inspection_template', 'VIEW')
  async templates() {
    const rows = await this.prisma.inspectionTemplate.findMany({
      orderBy: [{ formCode: 'asc' }, { version: 'desc' }],
      include: {
        method: { select: { code: true, name: true, department: { select: { code: true } } } },
        _count: { select: { inspections: true, reports: true } },
      },
    });

    return {
      items: rows.map((t) => {
        const sections = (t.schema as { sections?: unknown[] })?.sections ?? [];
        return {
          id: t.id,
          formCode: t.formCode,
          version: t.version,
          title: t.title,
          titleEn: t.titleEn,
          paradigm: t.paradigm,
          status: t.status,
          applicationDate: t.applicationDate,
          method: t.method,
          // Le code QMS fait foi : un formulaire sans méthode reste rangé
          // dans son service au lieu de tomber dans « sans service ».
          department: t.method?.department?.code ?? departmentOfForm(t.formCode),
          sectionCount: sections.length,
          usageCount: t._count.inspections,
        };
      }),
    };
  }

  @Get('inspection-templates/:id')
  @RequirePermission('inspection_template', 'VIEW')
  async template(@Param('id') id: string) {
    const template = await this.prisma.inspectionTemplate.findUnique({
      where: { id },
      include: {
        method: { select: { code: true, name: true, standards: true, procedureRef: true } },
      },
    });
    if (!template) throw new NotFoundException('Formulaire introuvable.');
    return template;
  }
}
