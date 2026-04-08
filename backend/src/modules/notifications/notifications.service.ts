import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Fetch all notifications for a user, newest first */
  async findByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /** Count unread notifications (lightweight query for badge) */
  async unreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /** Mark ALL unread notifications as read for a user */
  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { markedCount: result.count };
  }

  /** Mark a single notification as read */
  async markOneRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  /** Create a new notification for a user */
  async create(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    relatedId?: string;
  }) {
    return this.prisma.notification.create({ data });
  }
}
