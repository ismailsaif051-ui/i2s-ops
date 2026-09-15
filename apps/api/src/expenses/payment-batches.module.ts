import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
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
import { PaymentBatchesService } from './payment-batches.service';
import { ExpensesModule } from './expenses.module';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

const createSchema = z.object({
  expenseReportIds: z.array(z.string().uuid()).min(1, 'Choisissez au moins une note.'),
});

const lineReferenceSchema = z.object({
  bankReference: z.string().trim().max(64).optional().or(z.literal('')),
});

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

@ApiTags('Ordres de virement')
@Controller('payment-batches')
class PaymentBatchesController {
  constructor(private readonly batches: PaymentBatchesService) {}

  /** Notes « bon à payer » pas encore dans un lot — pour composer un nouveau lot. */
  @Get('candidates')
  @RequirePermission('payment_batch', 'CREATE')
  candidates(@CurrentUser() user: RequestUser) {
    return this.batches.candidates(user);
  }

  @Get()
  @RequirePermission('payment_batch', 'VIEW')
  list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput,
  ) {
    return this.batches.list(user, query);
  }

  @Get(':id')
  @RequirePermission('payment_batch', 'VIEW')
  async get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const batch = await this.batches.get(user, id);
    const allowed = (action: 'CREATE' | 'UPDATE' | 'APPROVE') =>
      user.permissions.some((p) => p.resource === 'payment_batch' && p.action === action);

    return {
      id: batch.id,
      number: batch.number,
      status: batch.status,
      totalAmount: Number(batch.totalAmount),
      createdAt: batch.createdAt,
      validatedAt: batch.validatedAt,
      paidAt: batch.paidAt,
      lines: batch.reports.map((r) => ({
        id: r.id,
        number: r.number,
        netPayable: Number(r.netPayable),
        paymentMethod: r.paymentMethod,
        bankReference: r.bankReference,
        employee: {
          id: r.employee.id,
          matricule: r.employee.matricule,
          name: `${r.employee.lastName.toUpperCase()} ${r.employee.firstName}`,
          position: r.employee.position,
          department: r.employee.department?.name ?? r.employee.department?.code ?? null,
          bankName: r.employee.bankName,
          bankRib: r.employee.bankRib,
        },
      })),
      actions: {
        modify: allowed('UPDATE') && batch.status === 'DRAFT',
        validate: allowed('UPDATE') && batch.status === 'DRAFT' && batch.reports.length > 0,
        pay: allowed('APPROVE') && batch.status === 'VALIDATED',
      },
    };
  }

  @Get(':id/pdf')
  @RequirePermission('payment_batch', 'VIEW')
  async pdf(@CurrentUser() user: RequestUser, @Param('id') id: string, @Res() res: Response) {
    const content = await this.batches.pdf(user, id);
    const batch = await this.batches.get(user, id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(content.byteLength));
    res.setHeader('Content-Disposition', `inline; filename="${batch.number}.pdf"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(content);
  }

  @Post()
  @RequirePermission('payment_batch', 'CREATE')
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>,
    @Req() req: Request,
  ) {
    return this.batches.create(user, body, ctx(req));
  }

  @Delete(':id/lines/:reportId')
  @RequirePermission('payment_batch', 'UPDATE')
  removeLine(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('reportId') reportId: string,
    @Req() req: Request,
  ) {
    return this.batches.removeLine(user, id, reportId, ctx(req));
  }

  @Patch(':id/lines/:reportId')
  @RequirePermission('payment_batch', 'UPDATE')
  setLineReference(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('reportId') reportId: string,
    @Body(new ZodValidationPipe(lineReferenceSchema)) body: z.infer<typeof lineReferenceSchema>,
    @Req() req: Request,
  ) {
    return this.batches.setLineReference(user, id, reportId, body, ctx(req));
  }

  @Post(':id/validate')
  @RequirePermission('payment_batch', 'UPDATE')
  validate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.batches.validate(user, id, ctx(req));
  }

  @Post(':id/pay')
  @RequirePermission('payment_batch', 'APPROVE')
  pay(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.batches.pay(user, id, ctx(req));
  }
}

@Module({
  imports: [ExpensesModule],
  controllers: [PaymentBatchesController],
  providers: [PaymentBatchesService],
})
export class PaymentBatchesModule {}
