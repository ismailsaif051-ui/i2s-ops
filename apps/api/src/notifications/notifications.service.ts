import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  level?: 'info' | 'warning' | 'danger' | 'success';
  payload?: Record<string, unknown>;
}

/**
 * Canal in-app. L'e-mail et le push PWA viendront s'y brancher via une file
 * BullMQ (docs/02 §2) sans changer l'interface d'appel des modules métier.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async notify(input: NotifyInput): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
        level: input.level ?? 'info',
        payload: (input.payload ?? undefined) as never,
      },
    });
  }

  async notifyMany(userIds: string[], input: Omit<NotifyInput, 'userId'>): Promise<void> {
    if (userIds.length === 0) return;
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
        level: input.level ?? 'info',
        payload: (input.payload ?? undefined) as never,
      })),
    });
  }

  list(userId: string, onlyUnread: boolean) {
    return this.prisma.notification.findMany({
      where: { userId, ...(onlyUnread ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(userId: string, ids: string[] | 'all'): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null, ...(ids === 'all' ? {} : { id: { in: ids } }) },
      data: { readAt: new Date() },
    });
  }
}
