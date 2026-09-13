import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { z } from 'zod';
import {
  createUserSchema,
  paginationSchema,
  type CreateUserInput,
  type PaginationInput,
} from '@i2s/contracts';
import { UsersService } from './users.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

const statusSchema = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']) });

@ApiTags('Utilisateurs & rôles')
@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('users')
  @RequirePermission('user', 'VIEW')
  list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationInput,
  ) {
    return this.users.list(user, query);
  }

  @Post('users')
  @RequirePermission('user', 'CREATE')
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createUserSchema)) body: CreateUserInput,
    @Req() req: Request,
  ) {
    return this.users.create(user, body, ctx(req));
  }

  @Patch('users/:id/status')
  @RequirePermission('user', 'UPDATE')
  setStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(statusSchema)) body: { status: 'ACTIVE' | 'SUSPENDED' },
    @Req() req: Request,
  ) {
    return this.users.setStatus(user, id, body.status, ctx(req));
  }

  @Get('roles')
  @RequirePermission('role', 'VIEW')
  roles() {
    return this.users.roles();
  }
}

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}
