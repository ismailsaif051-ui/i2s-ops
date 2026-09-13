import { Body, Controller, Get, Module, Post, Put, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { z } from 'zod';
import { TIMESHEET_CATEGORIES, TimesheetsService } from './timesheets.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

const MONTH = /^\d{4}-\d{2}$/;

/** N'importe quel jour de la semaine visée : le service ramène au lundi. */
const weekSchema = z.object({
  employeeId: z.string().uuid().optional(),
  week: z.coerce.date().optional(),
});

const monthSchema = z.object({
  month: z.string().regex(MONTH, 'Mois attendu au format AAAA-MM.').optional(),
});

const generateSchema = z.object({
  month: z.string().regex(MONTH, 'Mois attendu au format AAAA-MM.'),
  employeeId: z.string().uuid().optional(),
});

const correctSchema = z.object({
  employeeId: z.string().uuid().optional(),
  days: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ.'),
        category: z.enum(TIMESHEET_CATEGORIES),
        missionId: z.string().uuid().nullable().optional(),
        comment: z.string().trim().max(500).nullable().optional(),
      }),
    )
    .min(1)
    .max(31),
});

const validateSchema = z.object({
  employeeId: z.string().uuid(),
  month: z.string().regex(MONTH, 'Mois attendu au format AAAA-MM.'),
});

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

@ApiTags('Pointage')
@Controller('timesheets')
class TimesheetsController {
  constructor(private readonly timesheets: TimesheetsService) {}

  /**
   * La semaine d'un intervenant. Sans employé précisé, la sienne — le cas de
   * loin le plus fréquent, et celui de l'inspecteur sur son mobile.
   */
  @Get('week')
  @RequirePermission('timesheet', 'VIEW')
  week(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(weekSchema)) query: z.infer<typeof weekSchema>,
  ) {
    const employeeId = query.employeeId ?? user.employeeId;
    if (!employeeId) {
      return { employee: null, days: [], editable: false, canValidate: false };
    }
    return this.timesheets.week(user, employeeId, query.week ?? new Date());
  }

  /** Pointages du mois non encore visés, dans le périmètre du viseur. */
  @Get('pending')
  @RequirePermission('timesheet', 'APPROVE')
  async pending(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(monthSchema)) query: z.infer<typeof monthSchema>,
  ) {
    const month = query.month ?? currentMonth();
    return { month, items: await this.timesheets.pending(user, month) };
  }

  /**
   * Déduit le pointage du planning pour un mois. Rejouable : les journées
   * corrigées à la main et celles déjà visées ne sont pas touchées.
   */
  @Post('generate')
  @RequirePermission('timesheet', 'APPROVE')
  generate(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(generateSchema)) body: z.infer<typeof generateSchema>,
    @Req() req: Request,
  ) {
    return this.timesheets.generate(user, body.month, body.employeeId, ctx(req));
  }

  /** Corrige des journées que le planning a mal décrites. */
  @Put('corrections')
  @RequirePermission('timesheet', 'UPDATE')
  correct(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(correctSchema)) body: z.infer<typeof correctSchema>,
    @Req() req: Request,
  ) {
    const employeeId = body.employeeId ?? user.employeeId;
    if (!employeeId) return { corrected: 0, warnings: [] };
    return this.timesheets.correct(user, employeeId, body.days, ctx(req));
  }

  @Post('validate-month')
  @RequirePermission('timesheet', 'APPROVE')
  validate(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(validateSchema)) body: z.infer<typeof validateSchema>,
    @Req() req: Request,
  ) {
    return this.timesheets.validateMonth(user, body.employeeId, body.month, ctx(req));
  }
}

@Module({
  controllers: [TimesheetsController],
  providers: [TimesheetsService],
  exports: [TimesheetsService],
})
export class TimesheetsModule {}
