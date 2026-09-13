import { Body, Controller, Get, Global, HttpCode, Module, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators';

@ApiTags('Notifications')
@Controller('notifications')
class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser('id') userId: string, @Query('unread') unread?: string) {
    return this.notifications.list(userId, unread === 'true');
  }

  @Get('count')
  count(@CurrentUser('id') userId: string) {
    return this.notifications.countUnread(userId).then((unread) => ({ unread }));
  }

  @Patch('read')
  @HttpCode(204)
  async markRead(
    @CurrentUser('id') userId: string,
    @Body() body: { ids?: string[]; all?: boolean },
  ): Promise<void> {
    await this.notifications.markRead(userId, body?.all ? 'all' : (body?.ids ?? []));
  }
}

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
