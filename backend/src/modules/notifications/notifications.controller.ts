import {
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

  /** GET /api/notifications — user's notifications */
  @Get()
  async findAll(@Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    const data = await this.notifications.findByUser(user.id);
    return { success: true, data };
  }

  /** PATCH /api/notifications/read — mark all as read */
  @Patch('read')
  async markAllRead(@Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    const data = await this.notifications.markAllRead(user.id);
    return { success: true, data };
  }

  /** PATCH /api/notifications/:id/read — mark one as read */
  @Patch(':id/read')
  async markOneRead(@Param('id') id: string, @Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    await this.notifications.markOneRead(id, user.id);
    return { success: true, data: { id, isRead: true } };
  }
}
