import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@supabase/supabase-js';
import { NotificationsService } from './notifications.service.js';
import { SupabaseAuthGuard } from '../../guards/supabase-auth.guard.js';

@Controller('notifications')
@UseGuards(SupabaseAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** GET /api/notifications — user's notifications (last 50) */
  @Get()
  async findAll(@Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    const data = await this.notifications.findByUser(user.id);
    return { success: true, data };
  }

  /** GET /api/notifications/unread-count — lightweight unread badge count */
  @Get('unread-count')
  async unreadCount(@Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    const count = await this.notifications.unreadCount(user.id);
    return { success: true, data: { count } };
  }

  /** PATCH /api/notifications/read — mark ALL as read */
  @Patch('read')
  async markAllRead(@Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    const data = await this.notifications.markAllRead(user.id);
    return { success: true, data };
  }

  /** PATCH /api/notifications/:id/read — mark one notification as read */
  @Patch(':id/read')
  async markOneRead(@Param('id') id: string, @Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    await this.notifications.markOneRead(id, user.id);
    return { success: true, data: { id, isRead: true } };
  }
}
