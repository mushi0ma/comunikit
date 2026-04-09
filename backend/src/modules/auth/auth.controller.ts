import * as crypto from 'crypto';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';
import { z } from 'zod';
import { SupabaseAuthGuard } from '../../guards/supabase-auth.guard.js';
import { IdCardService, type IdCardResult } from './id-card.service.js';
import { SessionsService } from './sessions.service.js';
import { verifyTelegramAuth } from './telegram.strategy.js';

const verifyIdCardSchema = z.object({
  image: z.string().min(1),
  mimeType: z.string().min(1),
});

const telegramPayloadSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number(),
  hash: z.string(),
});

type TelegramPayload = z.infer<typeof telegramPayloadSchema>;

@Controller('auth')
export class AuthController {
  private readonly admin: SupabaseClient;
  private readonly botToken: string;

  constructor(
    private readonly config: ConfigService,
    private readonly idCardService: IdCardService,
    private readonly sessionsService: SessionsService,
  ) {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase admin credentials are not configured');
    }
    this.admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
  }

  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  async telegram(@Req() req: Request, @Body() body: unknown) {
    const parsed = telegramPayloadSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: 'Invalid Telegram payload',
      });
    }
    const payload: TelegramPayload = parsed.data;

    if (!this.botToken) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: 'Telegram bot token is not configured',
      });
    }

    const asRecord = payload as unknown as Record<string, unknown>;
    if (!verifyTelegramAuth(asRecord, this.botToken)) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: 'Telegram hash verification failed',
      });
    }

    // Stale auth guard: Telegram payloads older than 24h are rejected.
    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec - payload.auth_date > 86_400) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: 'Telegram auth expired',
      });
    }

    const syntheticEmail = `tg-${payload.id}@telegram.comunikit.local`;
    const password = this.deterministicPassword(payload.id);

    // Attempt to find an existing user by listing with a filter.
    const { data: list, error: listError } =
      await this.admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listError) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: listError.message,
      });
    }
    const existing = list.users.find((u) => u.email === syntheticEmail);

    if (!existing) {
      const { error: createError } = await this.admin.auth.admin.createUser({
        email: syntheticEmail,
        password,
        email_confirm: true,
        user_metadata: {
          provider: 'telegram',
          telegram_id: payload.id,
          username: payload.username,
          first_name: payload.first_name,
          last_name: payload.last_name,
          photo_url: payload.photo_url,
        },
      });
      if (createError) {
        throw new UnauthorizedException({
          success: false,
          data: null,
          error: createError.message,
        });
      }
    }

    const { data: session, error: signInError } =
      await this.admin.auth.signInWithPassword({
        email: syntheticEmail,
        password,
      });
    if (signInError || !session.session) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: signInError?.message ?? 'Failed to issue session',
      });
    }

    // Record the session for device management
    const userAgent = req.headers['user-agent'] ?? '';
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.ip ??
      null;

    // Resolve our internal user id from supabase user id
    const supabaseUserId = session.user?.id;
    if (supabaseUserId) {
      // Find or match the internal user — use supabase uid which maps to User.id
      await this.sessionsService
        .create(supabaseUserId, session.session.access_token, userAgent, ip)
        .catch(() => {
          // Non-critical — don't fail login if session tracking fails
        });
    }

    return {
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
    };
  }

  @Post('verify-id-card')
  @HttpCode(HttpStatus.OK)
  async verifyIdCard(@Body() body: unknown): Promise<IdCardResult> {
    const parsed = verifyIdCardSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: 'Invalid payload: expected { image, mimeType }',
      });
    }
    return this.idCardService.verify(parsed.data.image, parsed.data.mimeType);
  }

  @Get('sessions')
  @UseGuards(SupabaseAuthGuard)
  async getSessions(@Req() req: Request) {
    const user = (req as Request & { user: { id: string } }).user;
    const token = req.headers.authorization?.replace('Bearer ', '') ?? '';
    const currentHash = this.sessionsService.hashToken(token);

    // Touch current session's lastActiveAt
    await this.sessionsService.touch(currentHash);

    const sessions = await this.sessionsService.listForUser(
      user.id,
      currentHash,
    );
    return { success: true, data: sessions };
  }

  @Delete('sessions/:id')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeSession(@Req() req: Request, @Param('id') sessionId: string) {
    const user = (req as Request & { user: { id: string } }).user;

    // Prevent revoking current session
    const token = req.headers.authorization?.replace('Bearer ', '') ?? '';
    const currentHash = this.sessionsService.hashToken(token);
    const sessions = await this.sessionsService.listForUser(
      user.id,
      currentHash,
    );
    const target = sessions.find((s) => s.id === sessionId);

    if (!target) {
      throw new NotFoundException({
        success: false,
        data: null,
        error: 'Session not found',
      });
    }
    if (target.isCurrent) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: 'Cannot revoke current session',
      });
    }

    await this.sessionsService.revoke(sessionId, user.id);
    return { success: true, data: null };
  }

  private deterministicPassword(telegramId: number): string {
    // Derive a stable high-entropy password from bot token + telegram id so
    // the admin client can re-authenticate the synthetic user on each login.
    return crypto
      .createHmac('sha256', this.botToken)
      .update(`telegram:${telegramId}`)
      .digest('hex');
  }
}
