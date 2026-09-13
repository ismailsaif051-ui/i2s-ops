import { Body, Controller, Get, Module, Param, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { z } from 'zod';
import { LEAVE_SCOPE, LEAVE_TYPES, LEAVE_TYPE_LABELS, LeavesService } from './leaves.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeService } from '../rbac/scope.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

const listSchema = z.object({
  status: z.string().trim().max(20).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  limit: z.coerce.number().int().min(1).max(300).default(200),
});

const requestSchema = z.object({
  type: z.enum(LEAVE_TYPES),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().trim().max(500).nullable().optional(),
  employeeId: z.string().uuid().optional(),
});

const decideSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().trim().max(1000).nullable().optional(),
});

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

@ApiTags('Congés')
@Controller('leaves')
class LeavesController {
  constructor(
    private readonly leaves: LeavesService,
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
  ) {}

  @Get()
  @RequirePermission('leave', 'VIEW')
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(listSchema)) query: z.infer<typeof listSchema>,
  ) {
    const year = query.year ?? new Date().getUTCFullYear();

    const rows = await this.prisma.leaveRequest.findMany({
      where: {
        employee: { companyId: { in: user.companyIds } },
        ...(query.status ? { status: query.status as never } : {}),
        startDate: { gte: new Date(Date.UTC(year, 0, 1)), lte: new Date(Date.UTC(year, 11, 31)) },
        ...this.scope.buildWhere(user, 'leave', 'VIEW', LEAVE_SCOPE),
      },
      orderBy: { startDate: 'desc' },
      take: query.limit,
      include: {
        employee: {
          select: {
            id: true,
            matricule: true,
            firstName: true,
            lastName: true,
            department: { select: { code: true } },
          },
        },
      },
    });

    const items = rows.map((l) => ({
      id: l.id,
      employeeId: l.employeeId,
      employee: `${l.employee.lastName.toUpperCase()} ${l.employee.firstName}`,
      matricule: l.employee.matricule,
      department: l.employee.department?.code ?? null,
      type: l.type,
      typeLabel: LEAVE_TYPE_LABELS[l.type as keyof typeof LEAVE_TYPE_LABELS] ?? l.type,
      startDate: l.startDate,
      endDate: l.endDate,
      days: Number(l.days),
      status: l.status,
      reason: l.reason,
      decidedAt: l.decidedAt,
      isMine: l.employeeId === user.employeeId,
    }));

    return {
      year,
      items,
      totals: {
        all: items.length,
        pending: items.filter((l) => l.status === 'SUBMITTED').length,
        approvedDays: items
          .filter((l) => l.status === 'APPROVED')
          .reduce((sum, l) => sum + l.days, 0),
      },
      types: LEAVE_TYPES.map((code) => ({ code, label: LEAVE_TYPE_LABELS[code] })),
    };
  }

  @Post()
  @RequirePermission('leave', 'CREATE')
  request(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(requestSchema)) body: z.infer<typeof requestSchema>,
    @Req() req: Request,
  ) {
    return this.leaves.request(user, body, ctx(req));
  }

  @Post(':id/decide')
  @RequirePermission('leave', 'APPROVE')
  decide(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(decideSchema)) body: z.infer<typeof decideSchema>,
    @Req() req: Request,
  ) {
    return this.leaves.decide(user, id, body, ctx(req));
  }

  @Post(':id/cancel')
  @RequirePermission('leave', 'CREATE')
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.leaves.cancel(user, id, ctx(req));
  }
}

@Module({
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [LeavesService],
})
export class LeavesModule {}
