import { Controller, Get, Module, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AnalyticsService } from './analytics.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

const periodSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Le mois doit être au format AAAA-MM.')
    .optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

@ApiTags('Pilotage')
@Controller('analytics')
class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('dashboard')
  @RequirePermission('dashboard', 'VIEW')
  dashboard(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(periodSchema)) query: { month?: string; year?: number },
  ) {
    return this.analytics.dashboard(user, query);
  }

  @Get('quality')
  @RequirePermission('report', 'VIEW')
  quality(@CurrentUser() user: RequestUser) {
    return this.analytics.quality(user);
  }

  @Get('productivity')
  @RequirePermission('timesheet', 'VIEW')
  productivity(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(periodSchema)) query: { month?: string; year?: number },
  ) {
    return this.analytics.productivity(user, query);
  }

  /** Vue stratégique du cahier des charges — module 13. */
  @Get('unassigned-days')
  @RequirePermission('timesheet', 'VIEW')
  unassigned(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(periodSchema)) query: { month?: string; year?: number },
  ) {
    return this.analytics.unassignedDays(user, query);
  }

  @Get('affairs/:id/profitability')
  @RequirePermission('controlling', 'VIEW')
  affair(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.analytics.affairProfitability(user, id);
  }

  /** Rentabilité de toutes les affaires gagnées — dashboard du module 19. */
  @Get('profitability')
  @RequirePermission('controlling', 'VIEW')
  profitability(@CurrentUser() user: RequestUser) {
    return this.analytics.profitabilityList(user);
  }
}

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
