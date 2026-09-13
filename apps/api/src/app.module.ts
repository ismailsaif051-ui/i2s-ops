import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { RbacModule } from './rbac/rbac.module';
import { AuditModule } from './audit/audit.module';
import { NumberingModule } from './numbering/numbering.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmployeesModule } from './employees/employees.module';
import { CompaniesModule } from './companies/companies.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ControllingModule } from './controlling/controlling.module';
import { OperationsModule } from './operations/operations.module';
import { PlanningModule } from './planning/planning.module';
import { FinanceModule } from './finance/finance.module';
import { CommercialModule } from './commercial/commercial.module';
import { InspectionsModule } from './inspections/inspections.module';
import { ReportsModule } from './reports/reports.module';
import { ClientsModule } from './clients/clients.module';
import { AffairsModule } from './affairs/affairs.module';
import { MissionsModule } from './missions/missions.module';
import { DocumentsModule } from './documents/documents.module';
import { TimesheetsModule } from './timesheets/timesheets.module';
import { DevicesModule } from './devices/devices.module';
import { ExpensesModule } from './expenses/expenses.module';
import { NonConformitiesModule } from './non-conformities/non-conformities.module';
import { LeavesModule } from './leaves/leaves.module';
import { CertificationsModule } from './certifications/certifications.module';
import { AssetsModule } from './assets/assets.module';
import { FleetModule } from './fleet/fleet.module';
import { AdvancesModule } from './advances/advances.module';
import { BillingModule } from './billing/billing.module';
import { HealthController } from './health.controller';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { PasswordChangeGuard } from './common/guards/password-change.guard';
import { envSchema } from './config/env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env'],
      validate: (config) => envSchema.parse(config),
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 300 }]),
    PrismaModule,
    RbacModule,
    AuditModule,
    NumberingModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    EmployeesModule,
    CompaniesModule,
    AnalyticsModule,
    ControllingModule,
    OperationsModule,
    PlanningModule,
    FinanceModule,
    CommercialModule,
    InspectionsModule,
    ReportsModule,
    ClientsModule,
    AffairsModule,
    MissionsModule,
    DocumentsModule,
    TimesheetsModule,
    DevicesModule,
    ExpensesModule,
    NonConformitiesModule,
    LeavesModule,
    CertificationsModule,
    AssetsModule,
    FleetModule,
    AdvancesModule,
    BillingModule,
  ],
  controllers: [HealthController],
  providers: [
    // L'ordre compte : identité → mot de passe provisoire → droit.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PasswordChangeGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
