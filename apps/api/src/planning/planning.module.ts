import { Controller, Get, Module, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { PlanningService } from './planning.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

/** Par défaut : la semaine en cours, du lundi au dimanche. */
function currentWeek(): { from: Date; to: Date } {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const weekday = (utc.getUTCDay() + 6) % 7; // lundi = 0
  const from = new Date(utc.getTime() - weekday * 86_400_000);
  return { from, to: new Date(from.getTime() + 6 * 86_400_000) };
}

const planningQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  departmentId: z.string().uuid().optional(),
  /** Nombre de semaines affichées à partir de `from`. */
  weeks: z.coerce.number().int().min(1).max(8).optional(),
});

const monthSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Le mois doit être au format AAAA-MM.')
    .optional(),
});

@ApiTags('Planning & pointage')
@Controller()
class PlanningController {
  constructor(private readonly planning: PlanningService) {}

  @Get('planning')
  @RequirePermission('planning', 'VIEW')
  grid(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(planningQuerySchema))
    query: { from?: Date; to?: Date; departmentId?: string; weeks?: number },
  ) {
    const fallback = currentWeek();
    const from = query.from ?? fallback.from;
    const to =
      query.to ??
      (query.weeks
        ? new Date(from.getTime() + (query.weeks * 7 - 1) * 86_400_000)
        : fallback.to);

    return this.planning.grid(user, { from, to, departmentId: query.departmentId });
  }

  @Get('timesheets')
  @RequirePermission('timesheet', 'VIEW')
  timesheets(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(monthSchema)) query: { month?: string },
  ) {
    const now = new Date();
    const month =
      query.month ?? `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    return this.planning.timesheetGrid(user, month);
  }
}

@Module({
  controllers: [PlanningController],
  providers: [PlanningService],
})
export class PlanningModule {}
