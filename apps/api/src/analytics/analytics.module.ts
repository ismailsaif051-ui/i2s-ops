import { Controller, Get, Module, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AnalyticsService } from './analytics.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CostsModule } from '../costs/costs.module';
import { AffairsModule } from '../affairs/affairs.module';
import { buildXlsx, XLSX_CONTENT_TYPE } from '../common/xlsx';
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

  /**
   * Export Excel de la Vue d'ensemble, pour la période choisie : exactement
   * les chiffres affichés, chacun avec son périmètre (état à ce jour, mois,
   * cumul depuis janvier). Un indicateur auquel l'utilisateur n'a pas droit
   * est absent, comme à l'écran.
   */
  @Get('dashboard/export')
  @RequirePermission('dashboard', 'VIEW')
  async dashboardExport(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(periodSchema)) query: { month?: string; year?: number },
    @Res() res: Response,
  ) {
    const d = await this.analytics.dashboard(user, query);
    const day = (date: Date) => date.toLocaleDateString('fr-FR', { timeZone: 'UTC' });
    const today = day(new Date());
    const cumul = `du ${day(new Date(Date.UTC(d.period.to.getUTCFullYear(), 0, 1)))} au ${day(d.period.to)}`;
    const month = `${d.period.label} (${day(d.period.from)} – ${day(d.period.to)})`;
    const now = `état au ${today}`;

    const rows: Array<{ section: string; indicator: string; value: number | string; unit: string; scope: string }> = [];
    const add = (section: string, indicator: string, value: number | string | null, unit: string, scope: string) => {
      if (value !== null) rows.push({ section, indicator, value, unit, scope });
    };

    add('Indicateurs', 'Affaires en cours', d.affairsInProgress, 'affaires', now);
    add('Indicateurs', 'Missions en cours', d.missionsInProgress, 'missions', now);
    add('Indicateurs', 'Facturé · année (HT, avoirs déduits)', d.invoicedYtd, 'DH', cumul);
    add('Indicateurs', 'Encaissé · année (règlements reçus)', d.collectedYtd, 'DH', cumul);
    add('À traiter', 'Factures échues', d.overdueInvoices, 'factures', now);
    add('À traiter', 'Factures échues — reste dû', d.overdueAmount, 'DH TTC', now);
    add('À traiter', 'Instruments hors étalonnage', d.expiredDevices, 'instruments', now);
    add('À traiter', 'Rapports à vérifier', d.pendingReports, 'rapports', now);
    add('À traiter', 'Notes de frais en attente', d.pendingExpenses, 'notes', now);
    add('À traiter', 'Non-conformités ouvertes', d.openNonConformities, 'non-conformités', now);
    add('À traiter', 'Certifications expirant sous 60 jours', d.expiringCertifications, 'certifications', now);
    add('Qualité de service', 'Rapports remis dans le délai', d.reportOnTimeRate, '%', cumul);
    add('Qualité de service', 'Rapports émis', d.reportsIssued, 'rapports', cumul);
    add('Disponibilité des équipes', 'Jours non affectés', d.unassignedDays, 'jours', month);
    add('Disponibilité des équipes', 'Coût d’inactivité', d.idleCost, 'DH', month);

    const content = await buildXlsx(
      `Vue d’ensemble ${d.period.label}`,
      [
        { header: 'Rubrique', key: 'section', width: 26 },
        { header: 'Indicateur', key: 'indicator', width: 42 },
        { header: 'Valeur', key: 'value', width: 16, numFmt: '#,##0.##' },
        { header: 'Unité', key: 'unit', width: 16 },
        { header: 'Périmètre', key: 'scope', width: 40 },
      ],
      rows,
    );

    const slug = d.period.from.toISOString().slice(0, 7);
    res.setHeader('Content-Type', XLSX_CONTENT_TYPE);
    res.setHeader('Content-Disposition', `attachment; filename="vue-ensemble-${slug}.xlsx"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(content);
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
  imports: [CostsModule, AffairsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
