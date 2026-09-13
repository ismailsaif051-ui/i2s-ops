import { Controller, Get, Module, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { paginationSchema, type PaginationInput } from '@i2s/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeService } from '../rbac/scope.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

/* ═══════════════════════════════════════════════════════════════ */

@Module({
  controllers: [
  ],
})
export class OperationsModule {}
