import { Controller, Get, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ControllingService } from './controlling.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import type { RequestUser } from '../common/types';

@ApiTags('Contrôle de gestion')
@Controller('controlling')
class ControllingController {
  constructor(private readonly controlling: ControllingService) {}

  /** Le prévu, le dépensé, et ce que l'affaire coûtera une fois finie. */
  @Get()
  @RequirePermission('controlling', 'VIEW')
  overview(@CurrentUser() user: RequestUser) {
    return this.controlling.overview(user);
  }

  /** Ce qui ne colle pas dans les données, et ce que ça coûte. */
  @Get('anomalies')
  @RequirePermission('controlling', 'VIEW')
  anomalies(@CurrentUser() user: RequestUser) {
    return this.controlling.anomalies(user);
  }
}

@Module({
  controllers: [ControllingController],
  providers: [ControllingService],
  exports: [ControllingService],
})
export class ControllingModule {}
