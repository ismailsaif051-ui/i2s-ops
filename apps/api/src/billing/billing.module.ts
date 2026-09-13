import { Body, Controller, Get, Module, Param, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { z } from 'zod';
import { BillingService } from './billing.service';
import { AffairsModule } from '../affairs/affairs.module';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

const prepareSchema = z.object({
  affairId: z.string().uuid('Choisissez une affaire.'),
  from: z.coerce.date(),
  to: z.coerce.date(),
});

const attachmentSchema = z.object({
  affairId: z.string().uuid('Choisissez une affaire.'),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  /** Prix unitaire par mission, quand le barème de l'affaire ne suffit pas. */
  rates: z.record(z.string().uuid(), z.coerce.number().positive()).optional(),
});

const invoiceSchema = z.object({
  attachmentIds: z.array(z.string().uuid()).min(1, 'Choisissez au moins un attachement.'),
  issueDate: z.coerce.date().optional(),
  vatRate: z.coerce.number().min(0).max(30).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const paymentSchema = z.object({
  amount: z.coerce.number().positive('Le montant doit être positif.'),
  date: z.coerce.date().optional(),
  method: z.enum(['TRANSFER', 'CHECK', 'CASH', 'BILL_OF_EXCHANGE', 'CARD']).default('TRANSFER'),
  bankReference: z.string().trim().max(80).optional().nullable(),
});

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

@ApiTags('Attachements')
@Controller('attachments')
class AttachmentsController {
  constructor(private readonly billing: BillingService) {}

  /** Ce qu'il y a à facturer sur une affaire, sans rien figer. */
  @Get('preparation')
  @RequirePermission('attachment', 'CREATE')
  prepare(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(prepareSchema)) query: z.infer<typeof prepareSchema>,
  ) {
    return this.billing.prepare(user, query.affairId, query.from, query.to);
  }

  @Get(':id')
  @RequirePermission('attachment', 'VIEW')
  async detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const sheet = await this.billing.attachment(user, id);

    const canApprove = user.permissions.some(
      (p) => p.resource === 'attachment' && p.action === 'APPROVE',
    );
    const canBill = user.permissions.some(
      (p) => p.resource === 'invoice' && p.action === 'CREATE',
    );

    return {
      id: sheet.id,
      number: sheet.number,
      status: sheet.status,
      period: { from: sheet.periodStart, to: sheet.periodEnd },
      totalHT: Number(sheet.totalHT),
      submittedAt: sheet.submittedAt,
      validatedAt: sheet.validatedAt,
      affair: sheet.affair,
      client: { id: sheet.client.id, name: sheet.client.name, paymentTerms: sheet.client.paymentTerms },
      lines: sheet.lines.map((l) => ({
        id: l.id,
        designation: l.designation,
        mission: l.mission?.number ?? null,
        days: Number(l.days),
        unitRate: Number(l.unitRate),
        amountHT: Number(l.amountHT),
      })),
      invoices: sheet.invoices.map((i) => i.invoice),
      /** Gestes ouverts : droit ET état, comme partout ailleurs. */
      actions: {
        submit: canApprove && ['DRAFT', 'CORRECTION'].includes(sheet.status),
        validate: canApprove && sheet.status === 'SUBMITTED',
        invoice: canBill && sheet.status === 'VALIDATED',
      },
    };
  }

  @Post()
  @RequirePermission('attachment', 'CREATE')
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(attachmentSchema)) body: z.infer<typeof attachmentSchema>,
    @Req() req: Request,
  ) {
    return this.billing.createAttachment(user, body, ctx(req));
  }

  @Post(':id/submit')
  @RequirePermission('attachment', 'APPROVE')
  submit(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.billing.submitAttachment(user, id, ctx(req));
  }

  @Post(':id/validate')
  @RequirePermission('attachment', 'APPROVE')
  validate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.billing.validateAttachment(user, id, ctx(req));
  }
}

@ApiTags('Factures')
@Controller('invoices')
class InvoicesController {
  constructor(private readonly billing: BillingService) {}

  @Get(':id')
  @RequirePermission('invoice', 'VIEW')
  async detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const invoice = await this.billing.invoice(user, id);

    const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const total = Number(invoice.totalTTC);

    const canIssue = user.permissions.some(
      (p) => p.resource === 'invoice' && p.action === 'APPROVE',
    );
    const canPay = user.permissions.some(
      (p) => p.resource === 'payment' && p.action === 'CREATE',
    );

    return {
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      totalHT: Number(invoice.totalHT),
      vatRate: Number(invoice.vatRate),
      totalTTC: total,
      paid: Math.round(paid * 100) / 100,
      remaining: Math.round((total - paid) * 100) / 100,
      /** En retard : échue et pas soldée. */
      overdue: invoice.status !== 'PAID' && invoice.dueDate < new Date(),
      notes: invoice.notes,
      client: invoice.client,
      affair: invoice.affair,
      lines: invoice.lines.map((l) => ({
        position: l.position,
        designation: l.designation,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        amountHT: Number(l.amountHT),
      })),
      payments: invoice.payments.map((p) => ({
        id: p.id,
        date: p.date,
        amount: Number(p.amount),
        method: p.method,
        bankReference: p.bankReference,
      })),
      attachments: invoice.attachments.map((a) => ({
        id: a.attachmentSheet.id,
        number: a.attachmentSheet.number,
        totalHT: Number(a.attachmentSheet.totalHT),
      })),
      actions: {
        issue: canIssue && invoice.status === 'DRAFT',
        pay:
          canPay &&
          ['ISSUED', 'SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status) &&
          total - paid > 0.01,
      },
    };
  }

  @Post()
  @RequirePermission('invoice', 'CREATE')
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(invoiceSchema)) body: z.infer<typeof invoiceSchema>,
    @Req() req: Request,
  ) {
    return this.billing.createInvoice(user, body, ctx(req));
  }

  @Post(':id/issue')
  @RequirePermission('invoice', 'APPROVE')
  issue(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.billing.issueInvoice(user, id, ctx(req));
  }

  @Post(':id/payments')
  @RequirePermission('payment', 'CREATE')
  pay(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(paymentSchema)) body: z.infer<typeof paymentSchema>,
    @Req() req: Request,
  ) {
    return this.billing.addPayment(user, id, body, ctx(req));
  }
}

@Module({
  imports: [AffairsModule],
  controllers: [AttachmentsController, InvoicesController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
