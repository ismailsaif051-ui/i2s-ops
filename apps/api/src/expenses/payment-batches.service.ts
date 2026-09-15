import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import { ScopeService } from '../rbac/scope.service';
import { ExpensesService } from './expenses.service';
import { renderPaymentBatchPdf } from './payment-batch-pdf';
import type { RequestUser, ScopeDescriptor } from '../common/types';

const SCOPE: ScopeDescriptor = { companyPath: 'companyId' };

const LINE_SELECT = {
  id: true,
  number: true,
  employeeId: true,
  netPayable: true,
  totalGross: true,
  paymentMethod: true,
  bankReference: true,
  status: true,
  employee: {
    select: {
      id: true,
      matricule: true,
      firstName: true,
      lastName: true,
      position: true,
      bankName: true,
      bankRib: true,
      department: { select: { code: true, name: true } },
    },
  },
} as const;

/**
 * Regroupement des notes « bon à payer » en un seul virement.
 *
 * Circuit à deux mains, comme l'ordre de mission : RH prépare et valide le
 * lot (elle connaît les RIB) ; RAF l'exécute (elle a la main sur la
 * trésorerie). Ni l'un ni l'autre seul ne fait le virement.
 */
@Injectable()
export class PaymentBatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly numbering: NumberingService,
    private readonly scope: ScopeService,
    private readonly expenses: ExpensesService,
  ) {}

  async list(user: RequestUser, query: { limit: number; cursor?: string }) {
    const rows = await this.prisma.paymentBatch.findMany({
      where: this.scope.buildWhere(user, 'payment_batch', 'VIEW', SCOPE),
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: { _count: { select: { reports: true } } },
    });

    const hasMore = rows.length > query.limit;
    const items = (hasMore ? rows.slice(0, query.limit) : rows).map((b) => ({
      id: b.id,
      number: b.number,
      status: b.status,
      totalAmount: Number(b.totalAmount),
      reportCount: b._count.reports,
      createdAt: b.createdAt,
      validatedAt: b.validatedAt,
      paidAt: b.paidAt,
    }));

    return { items, nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null };
  }

  async get(user: RequestUser, id: string) {
    const batch = await this.prisma.paymentBatch.findFirst({
      where: { id, ...this.scope.buildWhere(user, 'payment_batch', 'VIEW', SCOPE) },
      include: { reports: { select: LINE_SELECT, orderBy: { number: 'asc' } } },
    });
    if (!batch) throw new NotFoundException('Lot de virement introuvable.');
    return batch;
  }

  /** Notes « bon à payer », de la société, pas déjà dans un lot. */
  async candidates(user: RequestUser) {
    const rows = await this.prisma.expenseReport.findMany({
      where: {
        status: 'READY_TO_PAY',
        paymentBatchId: null,
        ...this.scope.buildWhere(user, 'payment_batch', 'CREATE', SCOPE),
      },
      orderBy: { number: 'asc' },
      select: LINE_SELECT,
    });

    return rows.map((r) => this.toLine(r));
  }

  async create(
    user: RequestUser,
    input: { expenseReportIds: string[] },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    this.scope.requireScope(user, 'payment_batch', 'CREATE');

    if (input.expenseReportIds.length === 0) {
      throw new BadRequestException('Choisissez au moins une note à regrouper.');
    }

    const reports = await this.prisma.expenseReport.findMany({
      where: {
        id: { in: input.expenseReportIds },
        status: 'READY_TO_PAY',
        paymentBatchId: null,
        ...this.scope.buildWhere(user, 'payment_batch', 'CREATE', SCOPE),
      },
    });
    if (reports.length !== input.expenseReportIds.length) {
      throw new BadRequestException(
        'Une ou plusieurs notes ne sont plus disponibles (déjà réglées ou déjà dans un lot).',
      );
    }

    const companyId = reports[0].companyId;
    const totalAmount = reports.reduce((sum, r) => sum + Number(r.netPayable), 0);

    const batch = await this.prisma.$transaction(async (tx) => {
      const number = await this.numbering.next(companyId, 'PAYMENT_BATCH', {}, tx);
      const created = await tx.paymentBatch.create({
        data: { number, companyId, totalAmount, createdById: user.id },
      });
      await tx.expenseReport.updateMany({
        where: { id: { in: input.expenseReportIds } },
        data: { paymentBatchId: created.id },
      });
      return created;
    });

    await this.audit.record(
      {
        entity: 'payment_batch',
        entityId: batch.id,
        action: 'CREATE',
        after: { number: batch.number, reports: input.expenseReportIds.length, totalAmount },
        companyId,
      },
      { user, ...ctx },
    );

    return batch;
  }

  async removeLine(
    user: RequestUser,
    batchId: string,
    reportId: string,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const batch = await this.get(user, batchId);
    this.scope.requireScope(user, 'payment_batch', 'UPDATE');
    if (batch.status !== 'DRAFT') {
      throw new BadRequestException('Un lot validé ou réglé ne se modifie plus.');
    }

    const line = batch.reports.find((r) => r.id === reportId);
    if (!line) throw new NotFoundException('Cette note ne fait pas partie du lot.');

    await this.prisma.expenseReport.update({
      where: { id: reportId },
      data: { paymentBatchId: null },
    });

    const remaining = batch.reports.filter((r) => r.id !== reportId);
    const totalAmount = remaining.reduce((sum, r) => sum + Number(r.netPayable), 0);
    const updated = await this.prisma.paymentBatch.update({
      where: { id: batchId },
      data: { totalAmount },
    });

    await this.audit.record(
      {
        entity: 'payment_batch',
        entityId: batchId,
        action: 'REMOVE_LINE',
        after: { report: line.number },
        companyId: batch.companyId,
      },
      { user, ...ctx },
    );

    return updated;
  }

  async setLineReference(
    user: RequestUser,
    batchId: string,
    reportId: string,
    input: { bankReference?: string | null },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const batch = await this.get(user, batchId);
    this.scope.requireScope(user, 'payment_batch', 'UPDATE');
    if (batch.status !== 'DRAFT') {
      throw new BadRequestException('Un lot validé ou réglé ne se modifie plus.');
    }
    if (!batch.reports.some((r) => r.id === reportId)) {
      throw new NotFoundException('Cette note ne fait pas partie du lot.');
    }

    const updated = await this.prisma.expenseReport.update({
      where: { id: reportId },
      data: { bankReference: input.bankReference?.trim() || null },
    });

    await this.audit.record(
      {
        entity: 'payment_batch',
        entityId: batchId,
        action: 'UPDATE_LINE',
        after: { report: updated.number, bankReference: updated.bankReference },
        companyId: batch.companyId,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /** RH clôt la préparation : le lot devient exécutable par RAF. */
  async validate(user: RequestUser, id: string, ctx: { ip?: string | null; userAgent?: string | null }) {
    const batch = await this.get(user, id);
    this.scope.requireScope(user, 'payment_batch', 'UPDATE');

    if (batch.status !== 'DRAFT') {
      throw new BadRequestException('Ce lot est déjà validé ou réglé.');
    }
    if (batch.reports.length === 0) {
      throw new BadRequestException('Le lot est vide : ajoutez au moins une note.');
    }

    const updated = await this.prisma.paymentBatch.update({
      where: { id },
      data: { status: 'VALIDATED', validatedById: user.id, validatedAt: new Date() },
    });

    await this.audit.record(
      {
        entity: 'payment_batch',
        entityId: id,
        action: 'VALIDATE',
        after: { number: batch.number, reports: batch.reports.length },
        companyId: batch.companyId,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /**
   * RAF exécute le virement : chaque note du lot est réglée par le même
   * cœur que le règlement individuel (ExpensesService.settleReport), dans
   * une seule transaction — le lot passe entièrement ou pas du tout.
   */
  async pay(user: RequestUser, id: string, ctx: { ip?: string | null; userAgent?: string | null }) {
    const batch = await this.get(user, id);
    this.scope.requireScope(user, 'payment_batch', 'APPROVE');

    if (batch.status !== 'VALIDATED') {
      throw new BadRequestException('Seul un lot validé par RH peut être réglé.');
    }

    const paidAt = new Date();
    const { updatedBatch, reports } = await this.prisma.$transaction(async (tx) => {
      const settled = [];
      for (const line of batch.reports) {
        const { updated } = await this.expenses.settleReport(
          tx,
          line,
          user.id,
          paidAt,
          line.paymentMethod,
          line.bankReference,
        );
        settled.push(updated);
      }

      const updatedBatch = await tx.paymentBatch.update({
        where: { id },
        data: { status: 'PAID', paidById: user.id, paidAt },
      });

      return { updatedBatch, reports: settled };
    });

    await this.audit.record(
      {
        entity: 'payment_batch',
        entityId: id,
        action: 'PAY',
        after: { number: batch.number, reports: reports.length, totalAmount: Number(batch.totalAmount) },
        companyId: batch.companyId,
      },
      { user, ...ctx },
    );

    return { batch: updatedBatch, reports };
  }

  async pdf(user: RequestUser, id: string): Promise<Buffer> {
    const batch = await this.get(user, id);

    const [company, people] = await Promise.all([
      this.prisma.company.findUniqueOrThrow({
        where: { id: batch.companyId },
        select: { name: true, address: true, phone: true },
      }),
      this.resolveNames([batch.createdById, batch.validatedById, batch.paidById]),
    ]);

    return renderPaymentBatchPdf({
      number: batch.number,
      status: batch.status,
      company,
      createdAt: batch.createdAt,
      lines: batch.reports.map((r) => ({
        beneficiary: `${r.employee.lastName.toUpperCase()} ${r.employee.firstName}`,
        matricule: r.employee.matricule,
        department: r.employee.department?.name ?? r.employee.department?.code ?? null,
        bankName: r.employee.bankName,
        bankRib: r.employee.bankRib,
        reportNumber: r.number,
        amount: Number(r.netPayable),
      })),
      totalAmount: Number(batch.totalAmount),
      preparedBy: people.get(batch.createdById ?? '') ?? null,
      validatedBy: people.get(batch.validatedById ?? '') ?? null,
      validatedAt: batch.validatedAt,
      paidBy: people.get(batch.paidById ?? '') ?? null,
      paidAt: batch.paidAt,
    });
  }

  private toLine(r: {
    id: string;
    number: string;
    netPayable: unknown;
    employee: {
      id: string;
      matricule: string;
      firstName: string;
      lastName: string;
      position: string | null;
      bankName: string | null;
      bankRib: string | null;
      department: { code: string; name: string } | null;
    };
  }) {
    return {
      id: r.id,
      number: r.number,
      netPayable: Number(r.netPayable),
      employee: {
        id: r.employee.id,
        matricule: r.employee.matricule,
        name: `${r.employee.lastName.toUpperCase()} ${r.employee.firstName}`,
        position: r.employee.position,
        department: r.employee.department?.name ?? r.employee.department?.code ?? null,
        bankName: r.employee.bankName,
        bankRib: r.employee.bankRib,
      },
    };
  }

  private async resolveNames(userIds: Array<string | null>): Promise<Map<string, string>> {
    const ids = [...new Set(userIds.filter((v): v is string => v !== null))];
    if (ids.length === 0) return new Map();

    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true, employee: { select: { firstName: true, lastName: true } } },
    });

    return new Map(
      users.map((u) => [
        u.id,
        u.employee ? `${u.employee.lastName.toUpperCase()} ${u.employee.firstName}` : u.email,
      ]),
    );
  }
}
