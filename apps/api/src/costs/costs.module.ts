import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeService } from '../rbac/scope.service';
import { AuditService } from '../audit/audit.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';
import { AffairCostsService } from './affair-costs.service';

const AFFAIR_SCOPE = {
  companyPath: 'companyId',
  departmentPath: 'departmentId',
  ownerPath: 'accountManagerId',
  teamPath: 'accountManagerId',
} as const;

const costSchema = z.object({
  category: z.enum(['SUBCONTRACTING', 'OTHER']),
  status: z.enum(['COMMITTED', 'ACTUAL']).default('COMMITTED'),
  label: z.string().trim().min(2, 'Décrivez le coût en quelques mots.').max(200),
  supplier: z.string().trim().max(160).nullish(),
  reference: z.string().trim().max(80).nullish(),
  // « 12 500 » ou « 12 500,50 » tels qu'on les tape : espaces et virgule acceptés.
  amountHT: z.preprocess(
    (v) => (typeof v === 'string' ? v.replace(/[\s  ]/g, '').replace(',', '.') : v),
    z.coerce.number().positive('Le montant doit être positif.').max(1e11, 'Montant hors limites.'),
  ),
  date: z.coerce.date(),
});
type CostInput = z.infer<typeof costSchema>;

const LABELS = { SUBCONTRACTING: 'Sous-traitance', OTHER: 'Autre coût' } as const;
const STATUS_LABELS = { COMMITTED: 'Engagé', ACTUAL: 'Réel' } as const;

/**
 * Sous-traitance et autres coûts directs d'une affaire.
 *
 * Un coût naît « engagé » quand la commande au fournisseur est passée — il
 * pèse alors sur le coût à terminaison — puis devient « réel » quand sa
 * facture arrive, et entre dans la marge.
 */
@Injectable()
export class AffairCostLinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
    private readonly audit: AuditService,
  ) {}

  private async affair(user: RequestUser, affairId: string, action: 'VIEW' | 'CREATE' | 'UPDATE') {
    const where = this.scope.buildWhere(user, 'controlling', action, AFFAIR_SCOPE);
    const affair = await this.prisma.affair.findFirst({
      where: { id: affairId, deletedAt: null, ...where },
      select: { id: true, number: true, companyId: true },
    });
    if (!affair) throw new NotFoundException('Affaire introuvable ou hors de votre périmètre.');
    return affair;
  }

  private async line(user: RequestUser, id: string) {
    const cost = await this.prisma.affairCost.findFirst({ where: { id, deletedAt: null } });
    if (!cost) throw new NotFoundException('Coût introuvable.');
    const affair = await this.affair(user, cost.affairId, 'UPDATE');
    return { cost, affair };
  }

  async list(user: RequestUser, affairId: string) {
    await this.affair(user, affairId, 'VIEW');
    const rows = await this.prisma.affairCost.findMany({
      where: { affairId, deletedAt: null },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    const items = rows.map((c) => ({
      id: c.id,
      category: c.category,
      categoryLabel: LABELS[c.category],
      status: c.status,
      statusLabel: STATUS_LABELS[c.status],
      label: c.label,
      supplier: c.supplier,
      reference: c.reference,
      amountHT: Number(c.amountHT),
      date: c.date,
    }));
    const sum = (status: 'COMMITTED' | 'ACTUAL') =>
      Math.round(items.filter((i) => i.status === status).reduce((s, i) => s + i.amountHT, 0) * 100) /
      100;
    return {
      items,
      totals: { committed: sum('COMMITTED'), actual: sum('ACTUAL') },
      actions: {
        create: this.can(user, 'CREATE'),
        update: this.can(user, 'UPDATE'),
      },
    };
  }

  private can(user: RequestUser, action: 'CREATE' | 'UPDATE') {
    return user.permissions.some((p) => p.resource === 'controlling' && p.action === action);
  }

  async create(user: RequestUser, affairId: string, input: CostInput, ctx: Ctx) {
    const affair = await this.affair(user, affairId, 'CREATE');
    const created = await this.prisma.affairCost.create({
      data: {
        affairId,
        category: input.category,
        status: input.status,
        label: input.label,
        supplier: input.supplier || null,
        reference: input.reference || null,
        amountHT: new Prisma.Decimal(input.amountHT),
        date: input.date,
        createdById: user.id,
      },
    });
    await this.audit.record(
      {
        entity: 'affair_cost',
        entityId: created.id,
        action: 'CREATE',
        after: { affair: affair.number, ...input, amountHT: input.amountHT },
        companyId: affair.companyId,
      },
      { user, ...ctx },
    );
    return created;
  }

  async update(user: RequestUser, id: string, input: Partial<CostInput>, ctx: Ctx) {
    const { cost, affair } = await this.line(user, id);
    const updated = await this.prisma.affairCost.update({
      where: { id },
      data: {
        ...(input.category ? { category: input.category } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.label ? { label: input.label } : {}),
        ...(input.supplier !== undefined ? { supplier: input.supplier || null } : {}),
        ...(input.reference !== undefined ? { reference: input.reference || null } : {}),
        ...(input.amountHT !== undefined ? { amountHT: new Prisma.Decimal(input.amountHT) } : {}),
        ...(input.date ? { date: input.date } : {}),
      },
    });
    await this.audit.record(
      {
        entity: 'affair_cost',
        entityId: id,
        action: 'UPDATE',
        before: { status: cost.status, amountHT: cost.amountHT.toString(), label: cost.label },
        after: { status: updated.status, amountHT: updated.amountHT.toString(), label: updated.label },
        companyId: affair.companyId,
      },
      { user, ...ctx },
    );
    return updated;
  }

  async remove(user: RequestUser, id: string, ctx: Ctx) {
    const { cost, affair } = await this.line(user, id);
    await this.prisma.affairCost.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record(
      {
        entity: 'affair_cost',
        entityId: id,
        action: 'DELETE',
        before: { label: cost.label, status: cost.status, amountHT: cost.amountHT.toString() },
        companyId: affair.companyId,
      },
      { user, ...ctx },
    );
    return { deleted: true };
  }
}

type Ctx = { ip?: string | null; userAgent?: string | null };

@ApiTags('Coûts d’affaire')
@Controller()
class AffairCostsController {
  constructor(private readonly lines: AffairCostLinesService) {}

  @Get('affairs/:affairId/costs')
  @RequirePermission('controlling', 'VIEW')
  list(@CurrentUser() user: RequestUser, @Param('affairId') affairId: string) {
    return this.lines.list(user, affairId);
  }

  @Post('affairs/:affairId/costs')
  @RequirePermission('controlling', 'CREATE')
  create(
    @CurrentUser() user: RequestUser,
    @Param('affairId') affairId: string,
    @Body(new ZodValidationPipe(costSchema)) body: CostInput,
    @Req() req: Request,
  ) {
    return this.lines.create(user, affairId, body, ctx(req));
  }

  @Patch('affair-costs/:id')
  @RequirePermission('controlling', 'UPDATE')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(costSchema.partial())) body: Partial<CostInput>,
    @Req() req: Request,
  ) {
    return this.lines.update(user, id, body, ctx(req));
  }

  @Delete('affair-costs/:id')
  @RequirePermission('controlling', 'UPDATE')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.lines.remove(user, id, ctx(req));
  }
}

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

@Module({
  controllers: [AffairCostsController],
  providers: [AffairCostsService, AffairCostLinesService],
  exports: [AffairCostsService],
})
export class CostsModule {}
