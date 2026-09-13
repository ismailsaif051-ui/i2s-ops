import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { DailyCostService } from './daily-cost.service';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, DailyCostService],
  exports: [EmployeesService, DailyCostService],
})
export class EmployeesModule {}
