import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';
import type { User } from '@supabase/supabase-js';
import { z } from 'zod';
import { UsersService } from './users.service.js';
import { SupabaseAuthGuard } from '../../guards/supabase-auth.guard.js';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  telegramHandle: z.string().max(50).optional(),
  avatarUrl: z.string().url().max(500).optional(),
});

const setPasswordSchema = z.object({
  password: z.string().min(6, 'Минимум 6 символов').max(128),
});

@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  private readonly admin: SupabaseClient;

  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase admin credentials are not configured');
    }
    this.admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  /** GET /api/users/me — current user profile */
  @Get('me')
  async getMe(@Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    const profile = await this.users.getProfile(user.id);
    if (!profile) {
      return {
        success: true,
        data: {
          id: user.id,
          name: (user.user_metadata?.name as string) || 'Студент',
          email: user.email ?? null,
          emailVerified: null,
          bio: null,
          avatarUrl: null,
          telegramHandle: null,
          karma: 0,
          studentId: (user.user_metadata?.studentId as string) || null,
          isStudentVerified: false,
          hasPassword: !!user.app_metadata?.providers?.includes('email'),
          createdAt: user.created_at,
        },
      };
    }
    return { success: true, data: profile };
  }

  /** PATCH /api/users/me — update current user profile */
  @Patch('me')
  async updateMe(@Req() req: Request, @Body() body: unknown) {
    const user = (req as Request & { user: User }).user;
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: parsed.error.issues.map((i) => i.message).join(', '),
      });
    }
    const data = await this.users.updateProfile(user.id, parsed.data);
    return { success: true, data };
  }

  /** POST /api/users/me/set-password — set password for OAuth users */
  @Post('me/set-password')
  @HttpCode(HttpStatus.OK)
  async setPassword(@Req() req: Request, @Body() body: unknown) {
    const user = (req as Request & { user: User }).user;
    const parsed = setPasswordSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: parsed.error.issues.map((i) => i.message).join(', '),
      });
    }

    // Update password in Supabase Auth
    const { error } = await this.admin.auth.admin.updateUserById(user.id, {
      password: parsed.data.password,
    });
    if (error) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: error.message,
      });
    }

    // Persist bcrypt hash in Prisma so getProfile().hasPassword reflects the change
    await this.users.setPasswordHash(user.id, parsed.data.password);

    // In-app notification — non-critical, so failures don't block the response.
    await this.users.notifyPasswordChanged(user.id);

    return { success: true, data: { message: 'Пароль установлен' } };
  }

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
