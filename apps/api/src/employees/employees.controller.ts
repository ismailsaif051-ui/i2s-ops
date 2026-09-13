import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  createEmployeeSchema,
  paginationSchema,
  setDailyCostSchema,
  type CreateEmployeeInput,
  type PaginationInput,
  type SetDailyCostInput,
} from '@i2s/contracts';
import { EmployeesService } from './employees.service';
import { DailyCostService } from './daily-cost.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

@ApiTags('Employés')
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employees: EmployeesService,
    private readonly dailyCost: DailyCostService,
  ) {}

  @Get()
  @RequirePermission('employee', 'VIEW')
  list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput,
  ) {
    return this.employees.list(user, query);
  }

  @Get(':id')
  @RequirePermission('employee', 'VIEW')
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.employees.get(user, id);
  }

  @Post()
  @RequirePermission('employee', 'CREATE')
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createEmployeeSchema)) body: CreateEmployeeInput,
    @Req() req: Request,
  ) {
    return this.employees.create(user, body, ctx(req));
  }

  @Patch(':id')
  @RequirePermission('employee', 'UPDATE')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createEmployeeSchema.partial()))
    body: Partial<CreateEmployeeInput>,
    @Req() req: Request,
  ) {
    return this.employees.update(user, id, body, ctx(req));
  }

  @Get(':id/daily-costs')
  @RequirePermission('daily_cost', 'VIEW')
  history(@Param('id') id: string) {
    return this.dailyCost.history(id);
  }

  /**
   * Ouvre une nouvelle période de coût journalier.
   * N'écrase jamais l'historique — voir docs/09-CONTROLE-DE-GESTION.md §1.
   */
  @Post(':id/daily-costs')
  @RequirePermission('daily_cost', 'UPDATE')
  setCost(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setDailyCostSchema.omit({ employeeId: true })))
    body: Omit<SetDailyCostInput, 'employeeId'>,
    @Req() req: Request,
  ) {
    return this.dailyCost.set({ ...body, employeeId: id }, user, ctx(req));
  }
}

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}
