import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@supabase/supabase-js';
import { UsersService } from './users.service.js';
import { SupabaseAuthGuard } from '../../guards/supabase-auth.guard.js';

@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** GET /api/users/me/saved — all bookmarked listings + threads */
  @Get('me/saved')
  async getSaved(@Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    const data = await this.users.getSaved(user.id);
    return { success: true, data };
  }

  /** GET /api/users/me/liked — all liked listings + threads */
  @Get('me/liked')
  async getLiked(@Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    const data = await this.users.getLiked(user.id);
    return { success: true, data };
  }

  /** GET /api/users/me/status?targetId=...&targetType=listing|thread */
  @Get('me/status')
  async getStatus(
    @Req() req: Request,
    @Query('targetId') targetId: string,
    @Query('targetType') targetType: 'listing' | 'thread',
  ) {
    const user = (req as Request & { user: User }).user;
    const data = await this.users.getInteractionStatus(user.id, targetId, targetType);
    return { success: true, data };
  }

  /** POST /api/users/me/save/listing/:id — toggle bookmark on listing */
  @Post('me/save/listing/:id')
  async toggleSaveListing(@Param('id') id: string, @Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    const data = await this.users.toggleBookmarkListing(user.id, id);
    return { success: true, data };
  }

  /** POST /api/users/me/save/thread/:id — toggle bookmark on thread */
  @Post('me/save/thread/:id')
  async toggleSaveThread(@Param('id') id: string, @Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    const data = await this.users.toggleBookmarkThread(user.id, id);
    return { success: true, data };
  }

  /** POST /api/users/me/like/listing/:id — toggle like on listing */
  @Post('me/like/listing/:id')
  async toggleLikeListing(@Param('id') id: string, @Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    const data = await this.users.toggleLikeListing(user.id, id);
    return { success: true, data };
  }
}
