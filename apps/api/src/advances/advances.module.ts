import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ScopeService } from '../rbac/scope.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser, ScopeDescriptor } from '../common/types';

export const ADVANCE_SCOPE: ScopeDescriptor = {
  companyPath: 'employee.companyId',
  departmentPath: 'employee.departmentId',
  ownerPath: 'employeeId',
  teamPath: 'employeeId',
};

const listSchema = z.object({
  status: z.string().trim().max(20).optional(),
  limit: z.coerce.number().int().min(1).max(300).default(200),
});

const requestSchema = z.object({
  employeeId: z.string().uuid(),
  amount: z.coerce.number().positive('Le montant doit être positif.'),
  date: z.coerce.date().optional(),
  reason: z.string().trim().min(3, 'Précisez le motif de l’avance.').max(500),
  affairId: z.string().uuid().nullable().optional(),
});

const decideSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().trim().max(500).nullable().optional(),
});

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

/**
 * Avances sur frais.
 *
 * Une avance est de la trésorerie sortie avant justificatif : elle se demande,
 * s'accorde par quelqu'un d'autre, se verse, puis se solde sur les notes de
 * frais de l'intéressé. C'est le règlement d'une note qui la retient — sans
 * cela, l'entreprise paierait deux fois.
 */
@Injectable()
class AdvancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async get(user: RequestUser, id: string) {
    const advance = await this.prisma.advance.findFirst({
      where: { id, employee: { companyId: { in: user.companyIds } } },
      include: {
        employee: {
          select: {
            id: true,
            matricule: true,
            firstName: true,
            lastName: true,
            companyId: true,
            department: { select: { code: true } },
          },
        },
        requestedBy: { select: { firstName: true, lastName: true } },
        approvedBy: { select: { firstName: true, lastName: true } },
        settlements: {
          include: { expenseReport: { select: { number: true, paidAt: true } } },
        },
      },
    });

    if (!advance) throw new NotFoundException('Avance introuvable.');
    return advance;
  }

  async request(
    user: RequestUser,
    input: z.infer<typeof requestSchema>,
    context: { ip?: string | null; userAgent?: string | null },
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: input.employeeId, deletedAt: null, companyId: { in: user.companyIds } },
      select: { id: true, companyId: true, matricule: true, firstName: true, lastName: true },
    });
    if (!employee) throw new BadRequestException('Employé introuvable.');

    // Une avance en cours n'est pas soldée : en accorder une seconde revient à
    // avancer deux fois sans avoir rien récupéré.
    const outstanding = await this.prisma.advance.findFirst({
      where: {
        employeeId: employee.id,
        status: { in: ['REQUESTED', 'APPROVED', 'PAID', 'PARTIALLY_SETTLED'] },
      },
      select: { id: true, amount: true, settledAmount: true, status: true },
    });
    if (outstanding) {
      const due = Number(outstanding.amount) - Number(outstanding.settledAmount);
      throw new BadRequestException(
        `${employee.lastName.toUpperCase()} ${employee.firstName} porte déjà une avance de ${due} DH non soldée.`,
      );
    }

    const advance = await this.prisma.advance.create({
      data: {
        employeeId: employee.id,
        date: input.date ?? new Date(),
        amount: input.amount,
        reason: input.reason.trim(),
        affairId: input.affairId ?? null,
        requestedById: user.employeeId,
        status: 'REQUESTED',
      },
    });

    await this.audit.record(
      {
        entity: 'advance',
        entityId: advance.id,
        action: 'REQUEST',
        after: { employee: employee.matricule, amount: input.amount, reason: input.reason },
        companyId: employee.companyId,
      },
      { user, ...context },
    );

    return advance;
  }

  /**
   * Accorde ou refuse.
   *
   * Celui qui a enregistré la demande ne l'accorde pas : sur de la trésorerie,
   * la séparation des tâches n'est pas une formalité.
   */
  async decide(
    user: RequestUser,
    id: string,
    input: z.infer<typeof decideSchema>,
    context: { ip?: string | null; userAgent?: string | null },
  ) {
    const advance = await this.get(user, id);

    if (advance.status !== 'REQUESTED') {
      throw new BadRequestException(`Une avance « ${advance.status} » n’attend aucune décision.`);
    }
    if (advance.employeeId === user.employeeId && !user.roleCodes.includes('ADMIN')) {
      throw new BadRequestException('Une avance ne s’accorde pas à soi-même.');
    }
    if (
      advance.requestedById !== null &&
      advance.requestedById === user.employeeId &&
      !user.roleCodes.includes('ADMIN')
    ) {
      throw new BadRequestException(
        'Vous avez enregistré cette demande : elle doit être accordée par quelqu’un d’autre.',
      );
    }
    if (input.decision === 'REJECT' && !input.comment?.trim()) {
      throw new BadRequestException({
        message: 'Refus refusé.',
        errors: [{ field: 'comment', message: 'Un refus doit être motivé.' }],
      });
    }

    const updated = await this.prisma.advance.update({
      where: { id },
      data: {
        status: input.decision === 'APPROVE' ? 'APPROVED' : 'CANCELLED',
        approvedById: input.decision === 'APPROVE' ? user.employeeId : null,
        approvedAt: input.decision === 'APPROVE' ? new Date() : null,
        rejectReason: input.decision === 'REJECT' ? (input.comment?.trim() ?? null) : null,
      },
    });

    await this.audit.record(
      {
        entity: 'advance',
        entityId: id,
        action: input.decision === 'APPROVE' ? 'APPROVE' : 'REJECT',
        before: { status: advance.status },
        after: { status: updated.status },
        reason: input.comment ?? null,
        companyId: advance.employee.companyId,
      },
      { user, ...context },
    );

    return updated;
  }

  /** Le versement : l'argent sort, l'avance devient récupérable. */
  async pay(
    user: RequestUser,
    id: string,
    context: { ip?: string | null; userAgent?: string | null },
  ) {
    const advance = await this.get(user, id);

    if (advance.status !== 'APPROVED') {
      throw new BadRequestException('Seule une avance accordée se verse.');
    }
    if (!user.roleCodes.includes('RAF') && !user.roleCodes.includes('ADMIN')) {
      throw new ForbiddenException('Le versement relève du responsable administratif et financier.');
    }

    const updated = await this.prisma.advance.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    });

    await this.audit.record(
      {
        entity: 'advance',
        entityId: id,
        action: 'PAY',
        after: { amount: advance.amount, paidAt: updated.paidAt },
        companyId: advance.employee.companyId,
      },
      { user, ...context },
    );

    return updated;
  }
}

@ApiTags('Avances')
@Controller('advances')
class AdvancesController {
  constructor(
    private readonly advances: AdvancesService,
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
  ) {}

  @Get()
  @RequirePermission('advance', 'VIEW')
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(listSchema)) query: z.infer<typeof listSchema>,
  ) {
    const rows = await this.prisma.advance.findMany({
      where: {
        employee: { companyId: { in: user.companyIds } },
        ...(query.status ? { status: query.status as never } : {}),
        ...this.scope.buildWhere(user, 'advance', 'VIEW', ADVANCE_SCOPE),
      },
      orderBy: { date: 'desc' },
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
        affair: { select: { number: true } },
        requestedBy: { select: { firstName: true, lastName: true } },
        approvedBy: { select: { firstName: true, lastName: true } },
      },
    });

    const items = rows.map((a) => {
      const amount = Number(a.amount);
      const settled = Number(a.settledAmount);

      return {
        id: a.id,
        employeeId: a.employeeId,
        employee: `${a.employee.lastName.toUpperCase()} ${a.employee.firstName}`,
        matricule: a.employee.matricule,
        department: a.employee.department?.code ?? null,
        date: a.date,
        amount,
        settledAmount: settled,
        /** Ce que l'entreprise attend encore de récupérer. */
        outstanding: Math.max(0, amount - settled),
        reason: a.reason,
        affair: a.affair?.number ?? null,
        status: a.status,
        requestedBy: a.requestedBy
          ? `${a.requestedBy.lastName.toUpperCase()} ${a.requestedBy.firstName}`
          : null,
        approvedBy: a.approvedBy
          ? `${a.approvedBy.lastName.toUpperCase()} ${a.approvedBy.firstName}`
          : null,
        approvedAt: a.approvedAt,
        paidAt: a.paidAt,
        rejectReason: a.rejectReason,
        isMine: a.employeeId === user.employeeId,
      };
    });

    return {
      items,
      totals: {
        all: items.length,
        pending: items.filter((a) => a.status === 'REQUESTED').length,
        toPay: items.filter((a) => a.status === 'APPROVED').length,
        outstanding: items
          .filter((a) => ['PAID', 'PARTIALLY_SETTLED'].includes(a.status))
          .reduce((sum, a) => sum + a.outstanding, 0),
      },
    };
  }

  @Post()
  @RequirePermission('advance', 'CREATE')
  request(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(requestSchema)) body: z.infer<typeof requestSchema>,
    @Req() req: Request,
  ) {
    return this.advances.request(user, body, ctx(req));
  }

  @Post(':id/decide')
  @RequirePermission('advance', 'APPROVE')
  decide(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(decideSchema)) body: z.infer<typeof decideSchema>,
    @Req() req: Request,
  ) {
    return this.advances.decide(user, id, body, ctx(req));
  }

  @Post(':id/pay')
  @RequirePermission('advance', 'APPROVE')
  pay(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.advances.pay(user, id, ctx(req));
  }
}

@Module({
  controllers: [AdvancesController],
  providers: [AdvancesService],
})
export class AdvancesModule {}
