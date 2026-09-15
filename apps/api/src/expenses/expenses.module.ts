import { Body, Controller, Delete, Get, Module, Param, Post, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { EXPENSE_SCOPE, EXPENSE_STEPS, ExpensesService } from './expenses.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeService } from '../rbac/scope.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

const MONTH = /^\d{4}-\d{2}$/;

const listSchema = z.object({
  status: z.string().trim().max(30).optional(),
  month: z.string().regex(MONTH, 'Mois attendu au format AAAA-MM.').optional(),
  limit: z.coerce.number().int().min(1).max(300).default(100),
});

const openSchema = z.object({
  month: z.string().regex(MONTH, 'Mois attendu au format AAAA-MM.'),
  type: z.enum(['MISSION', 'OFF_MISSION']).default('MISSION'),
  employeeId: z.string().uuid().optional(),
});

const lineSchema = z.object({
  date: z.coerce.date(),
  categoryId: z.string().uuid(),
  amount: z.coerce.number().positive('Le montant doit être positif.'),
  affairId: z.string().uuid().nullable().optional(),
  missionId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  description: z.string().trim().max(300).nullable().optional(),
  comment: z.string().trim().max(500).nullable().optional(),
  receipt: z
    .object({
      fileName: z.string().trim().min(1).max(200),
      contentBase64: z.string().max(11_000_000),
    })
    .nullable()
    .optional(),
});

const decideSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().trim().max(1000).nullable().optional(),
});

const paySchema = z.object({
  paidAt: z.coerce.date().nullable().optional(),
  paymentMethod: z.enum(['TRANSFER', 'CASH', 'CHECK']).optional(),
  bankReference: z.string().trim().max(80).nullable().optional(),
});

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

@ApiTags('Notes de frais')
@Controller('expense-reports')
class ExpensesController {
  constructor(
    private readonly expenses: ExpensesService,
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
  ) {}

  @Get()
  @RequirePermission('expense_report', 'VIEW')
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(listSchema)) query: z.infer<typeof listSchema>,
  ) {
    const rows = await this.prisma.expenseReport.findMany({
      where: {
        companyId: { in: user.companyIds },
        ...(query.status ? { status: query.status as never } : {}),
        ...(query.month
          ? { periodMonth: new Date(`${query.month}-01T00:00:00.000Z`) }
          : {}),
        ...this.scope.buildWhere(user, 'expense_report', 'VIEW', EXPENSE_SCOPE),
      },
      orderBy: [{ periodMonth: 'desc' }, { number: 'asc' }],
      take: query.limit,
      include: {
        employee: {
          select: {
            matricule: true,
            firstName: true,
            lastName: true,
            department: { select: { code: true } },
          },
        },
        _count: { select: { lines: true } },
        lines: { where: { capWarning: { not: null } }, select: { id: true } },
      },
    });

    return {
      items: rows.map((r) => ({
        id: r.id,
        number: r.number,
        employee: `${r.employee.lastName.toUpperCase()} ${r.employee.firstName}`,
        matricule: r.employee.matricule,
        department: r.employee.department?.code ?? null,
        periodMonth: r.periodMonth,
        month: r.periodMonth.toISOString().slice(0, 7),
        type: r.type,
        status: r.status,
        lineCount: r._count.lines,
        capWarnings: r.lines.length,
        totalGross: Number(r.totalGross),
        advanceDeduction: Number(r.advanceDeduction),
        netPayable: Number(r.netPayable),
        paidAt: r.paidAt,
        isMine: r.employeeId === user.employeeId,
      })),
    };
  }

  /** Catégories de dépense et leurs plafonds — le front n'invente rien. */
  @Get('categories')
  @RequirePermission('expense_report', 'VIEW')
  async categories() {
    const rows = await this.prisma.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
    });

    return {
      items: rows.map((c) => ({
        id: c.id,
        code: c.code,
        label: c.label,
        capType: c.capType,
        capAmount: c.capAmount === null ? null : Number(c.capAmount),
        requiresReceipt: c.requiresReceipt,
      })),
    };
  }

  /** Notes en attente d'une décision de l'utilisateur. */
  @Get('pending')
  @RequirePermission('expense_report', 'APPROVE')
  async pending(@CurrentUser() user: RequestUser) {
    return { items: await this.expenses.pending(user) };
  }

  @Get(':id')
  @RequirePermission('expense_report', 'VIEW')
  async detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const report = await this.expenses.get(user, id);
    const { issues, canSubmit } = await this.expenses.check(id);

    const step = EXPENSE_STEPS.find((s) => s.from === report.status);
    const isAuthor = report.employeeId === user.employeeId;
    const editable = ['DRAFT', 'REJECTED'].includes(report.status) && isAuthor;

    return {
      id: report.id,
      number: report.number,
      status: report.status,
      type: report.type,
      month: report.periodMonth.toISOString().slice(0, 7),
      employee: {
        id: report.employee.id,
        matricule: report.employee.matricule,
        name: `${report.employee.lastName.toUpperCase()} ${report.employee.firstName}`,
        department: report.employee.department?.code ?? null,
      },
      totalGross: Number(report.totalGross),
      advanceDeduction: Number(report.advanceDeduction),
      netPayable: Number(report.netPayable),
      paidAt: report.paidAt,
      bankReference: report.bankReference,
      rejectReason: report.rejectReason,
      lines: report.lines.map((l) => ({
        id: l.id,
        date: l.date,
        category: { id: l.category.id, code: l.category.code, label: l.category.label },
        amount: Number(l.amount),
        affair: l.affair?.number ?? null,
        mission: l.mission?.number ?? null,
        department: l.department?.code ?? null,
        description: l.description,
        comment: l.comment,
        hasReceipt: l.receiptDocumentId !== null,
        status: l.status,
      })),
      approvals: report.approvals.map((a) => ({
        step: a.step,
        roleCode: a.roleCode,
        decision: a.decision,
        comment: a.comment,
        decidedAt: a.decidedAt,
      })),
      /** Ce qui bloque la soumission, et ce qui n'est qu'un signalement. */
      issues,
      /** Étape courante du circuit, et qui la franchit. */
      currentStep: step ? { label: step.label, roles: [...step.roles] } : null,
      actions: {
        edit: editable,
        submit: editable && canSubmit,
        decide:
          step !== undefined &&
          step.roles.some((r) => user.roleCodes.includes(r)) &&
          (!isAuthor || user.roleCodes.includes('ADMIN')),
        pay:
          report.status === 'READY_TO_PAY' &&
          (user.roleCodes.includes('RAF') || user.roleCodes.includes('ADMIN')),
      },
    };
  }

  /** Pièce imprimable de la note — voir ExpensesService.pdf. */
  @Get(':id/pdf')
  @RequirePermission('expense_report', 'VIEW')
  async pdf(@CurrentUser() user: RequestUser, @Param('id') id: string, @Res() res: Response) {
    const content = await this.expenses.pdf(user, id);
    const report = await this.expenses.get(user, id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(content.byteLength));
    res.setHeader('Content-Disposition', `inline; filename="${report.number}.pdf"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(content);
  }

  /**
   * Missions imputables à cette note : celles de l'intéressé, dont l'ordre est
   * signé, et qui touchent le mois de la note. Proposer les autres reviendrait
   * à laisser choisir ce que le serveur refusera.
   */
  @Get(':id/missions')
  @RequirePermission('expense_report', 'VIEW')
  async missions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const report = await this.expenses.get(user, id);

    const from = new Date(report.periodMonth);
    const to = new Date(
      Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0),
    );

    const rows = await this.prisma.mission.findMany({
      where: {
        deletedAt: null,
        assignments: { some: { employeeId: report.employeeId } },
        missionOrder: { status: { in: ['SIGNED', 'IN_PROGRESS', 'COMPLETED'] } },
        plannedStartDate: { lte: new Date(to.getTime() + 86_400_000) },
        plannedEndDate: { gte: new Date(from.getTime() - 86_400_000) },
      },
      orderBy: { plannedStartDate: 'desc' },
      take: 60,
      select: {
        id: true,
        number: true,
        plannedStartDate: true,
        plannedEndDate: true,
        affair: { select: { number: true, client: { select: { name: true } } } },
      },
    });

    return {
      items: rows.map((m) => ({
        id: m.id,
        number: m.number,
        client: m.affair.client.name,
        affairNumber: m.affair.number,
        start: m.plannedStartDate,
        end: m.plannedEndDate,
      })),
    };
  }

  @Post()
  @RequirePermission('expense_report', 'CREATE')
  open(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(openSchema)) body: z.infer<typeof openSchema>,
    @Req() req: Request,
  ) {
    return this.expenses.open(user, body, ctx(req));
  }

  @Post(':id/lines')
  @RequirePermission('expense_report', 'UPDATE')
  addLine(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(lineSchema)) body: z.infer<typeof lineSchema>,
    @Req() req: Request,
  ) {
    return this.expenses.addLine(user, id, body, ctx(req));
  }

  @Delete(':id/lines/:lineId')
  @RequirePermission('expense_report', 'UPDATE')
  removeLine(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @Req() req: Request,
  ) {
    return this.expenses.removeLine(user, id, lineId, ctx(req));
  }

  @Post(':id/submit')
  @RequirePermission('expense_report', 'UPDATE')
  submit(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.expenses.submit(user, id, ctx(req));
  }

  @Post(':id/decide')
  @RequirePermission('expense_report', 'APPROVE')
  decide(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(decideSchema)) body: z.infer<typeof decideSchema>,
    @Req() req: Request,
  ) {
    return this.expenses.decide(user, id, body, ctx(req));
  }

  @Post(':id/pay')
  @RequirePermission('expense_report', 'APPROVE')
  pay(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(paySchema)) body: z.infer<typeof paySchema>,
    @Req() req: Request,
  ) {
    return this.expenses.pay(user, id, body, ctx(req));
  }
}

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
