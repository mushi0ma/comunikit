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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';
import { Resend } from 'resend';
import { z } from 'zod';
import { SupabaseAuthGuard } from '../../guards/supabase-auth.guard.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service.js';
import { IdCardService, type IdCardResult } from './id-card.service.js';
import { SessionsService } from './sessions.service.js';
import { verifyTelegramAuth } from './telegram.strategy.js';

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
  private readonly resend: Resend | null;

  constructor(
    private readonly config: ConfigService,
    private readonly idCardService: IdCardService,
    private readonly sessionsService: SessionsService,
    private readonly prisma: PrismaService,
    private readonly telegramBot: TelegramBotService,
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

    const resendApiKey = this.config.get<string>('RESEND_API_KEY');
    this.resend = resendApiKey ? new Resend(resendApiKey) : null;
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

    // Try to create the Supabase user — ignore "already registered" errors.
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
    if (createError && !createError.message.includes('already been registered')) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: createError.message,
      });
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

      // Link telegramId to the Prisma User for future bot notifications
      await this.prisma.user
        .update({
          where: { id: supabaseUserId },
          data: {
            telegramId: BigInt(payload.id),
            telegramHandle: payload.username ?? undefined,
          },
        })
        .catch(() => {
          // Non-critical — user row may not exist yet (pre-verification)
        });
    }

    return {
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
    };
  }

  /**
   * POST /api/auth/telegram-token — exchange a one-time token issued by the
   * Telegram bot (via `/login` command) for a Supabase session. This is the
   * second half of the deep-link flow:
   *   1. User taps "Войти через Telegram" → opens t.me/<bot>?start=login.
   *   2. Bot generates a token, sends back a button with
   *      https://<app>/login?tg_token=xyz.
   *   3. Frontend reads the token from the URL and POSTs it here.
   *   4. We consume it (single-use, 5 min TTL) and issue a session.
   */
  @Post('telegram-token')
  @HttpCode(HttpStatus.OK)
  async telegramToken(@Req() req: Request, @Body() body: unknown) {
    let token = '';
    if (body && typeof body === 'object' && 'token' in body) {
      const raw = (body as { token: unknown }).token;
      if (typeof raw === 'string') token = raw;
    }

    if (!token) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: 'Отсутствует токен',
      });
    }

    const tgUser = this.telegramBot.consumeLoginToken(token);
    if (!tgUser) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error:
          'Токен недействителен или просрочен. Запросите новую ссылку у бота.',
      });
    }

    const syntheticEmail = `tg-${tgUser.id}@telegram.comunikit.local`;
    const password = this.deterministicPassword(tgUser.id);

    const { error: createError } = await this.admin.auth.admin.createUser({
      email: syntheticEmail,
      password,
      email_confirm: true,
      user_metadata: {
        provider: 'telegram',
        telegram_id: tgUser.id,
        username: tgUser.username ?? undefined,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name ?? undefined,
        photo_url: tgUser.photo_url ?? undefined,
      },
    });
    if (
      createError &&
      !createError.message.includes('already been registered')
    ) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: createError.message,
      });
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

    // Record the session + link telegramId on the Prisma User row.
    const userAgent = req.headers['user-agent'] ?? '';
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.ip ??
      null;

    const supabaseUserId = session.user?.id;
    if (supabaseUserId) {
      await this.sessionsService
        .create(supabaseUserId, session.session.access_token, userAgent, ip)
        .catch(() => {
          // Non-critical — don't fail login if session tracking fails
        });

      await this.prisma.user
        .update({
          where: { id: supabaseUserId },
          data: {
            telegramId: BigInt(tgUser.id),
            telegramHandle: tgUser.username ?? undefined,
          },
        })
        .catch(() => {
          // Non-critical — user row may not exist yet (pre-verification)
        });
    }

    return {
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
    };
  }

  @Post('verify-id-card')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async verifyIdCard(
    // Inline Multer file shape — we avoid the global `Express.Multer.File`
    // type here because the repo's root tsconfig.json type-checks this file
    // without `@types/multer` in its resolution path. Keep the shape minimal
    // and local to this handler.
    @UploadedFile()
    file:
      | { buffer: Buffer; mimetype: string; size: number; originalname: string }
      | undefined,
  ): Promise<IdCardResult> {
    if (!file || !file.buffer?.length) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: 'No file uploaded',
      });
    }

    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: 'Unsupported image format. Use JPEG, PNG, WebP, or HEIC.',
      });
    }

    // Pass the raw buffer directly to the service — nothing is ever written
    // to Supabase Storage or local disk. The service converts it to base64
    // in-memory for the OpenRouter Vision request and then discards it.
    return this.idCardService.verify(file.buffer, file.mimetype);
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

  /** POST /api/auth/send-verification — send a 6-digit OTP to user's email (console.log mock) */
  @Post('send-verification')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendVerification(@Req() req: Request) {
    const user = (req as Request & { user: { id: string; email?: string } }).user;

    if (!user.email) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: 'No email associated with this account',
      });
    }

    // Check if already verified
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true },
    });
    if (dbUser?.emailVerified) {
      return { success: true, data: { message: 'Email уже подтверждён' } };
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Delete old tokens for this user
    await this.prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    });

    // Store new token
    await this.prisma.verificationToken.create({
      data: { userId: user.id, code, expiresAt },
    });

    // Send verification email via Resend (or fallback to console).
    // NOTE: Resend's free tier on the shared `onboarding@resend.dev` sender
    // can only deliver mail to the email that owns the Resend account.
    // Any other recipient is rejected with a 403/422. We catch BOTH the
    // Resend SDK's `{ error }` object AND thrown network exceptions so the
    // backend never crashes — instead we log details and return a clear
    // message to the frontend, while still printing the OTP to the server
    // log as a fallback so local development keeps working.
    if (this.resend) {
      try {
        const { error: sendError } = await this.resend.emails.send({
          from: 'Comunikit <onboarding@resend.dev>',
          to: [user.email],
          subject: 'Код подтверждения — Comunikit',
          html: `<p>Ваш код подтверждения: <strong>${code}</strong></p><p>Код действует 10 минут.</p>`,
        });
        if (sendError) {
          // Resend returns a structured `{ name, message }` object rather
          // than an Error instance. Re-throw it as a real Error so the
          // catch below can normalise it uniformly with network failures.
          throw new Error(
            (sendError as { message?: string }).message ?? 'Resend send failed',
          );
        }
      } catch (err) {
        console.error('[Resend] Failed to send verification email:', err);
        // Fallback so the developer can still grab the code from logs.
        console.log(
          `\n📧 [FALLBACK] Verification code for ${user.email}: ${code}\n`,
        );

        const rawMessage =
          err instanceof Error
            ? err.message
            : typeof err === 'object' && err !== null && 'message' in err
              ? String((err as { message: unknown }).message)
              : String(err);
        const isFreeTierBlock =
          /only send testing emails|verify a domain|can only send/i.test(
            rawMessage,
          );

        throw new BadRequestException({
          success: false,
          data: null,
          error: isFreeTierBlock
            ? 'Бесплатный тариф Resend (домен resend.dev) позволяет отправлять письма только на адрес владельца аккаунта. Код выведен в логи сервера — обратитесь к администратору.'
            : 'Не удалось отправить письмо. Попробуйте позже.',
        });
      }
    } else {
      console.log(
        `\n📧 [MOCK EMAIL] Verification code for ${user.email}: ${code}\n`,
      );

      // No email service configured — in development we return the code
      // directly so the user can still verify. In production this path
      // shouldn't be reached if RESEND_API_KEY is properly set.
      const isDev = (this.config.get<string>('NODE_ENV') ?? 'development') === 'development';
      return {
        success: true,
        data: {
          message: isDev
            ? `[DEV] Код: ${code} (email сервис не настроен)`
            : 'Email сервис не настроен. Обратитесь к администратору.',
        },
      };
    }

    return {
      success: true,
      data: { message: 'Код подтверждения отправлен на почту' },
    };
  }

  /** POST /api/auth/verify-email — verify email with OTP code */
  @Post('verify-email')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Req() req: Request,
    @Body() body: { code?: string },
  ) {
    const user = (req as Request & { user: { id: string } }).user;

    if (!body.code || body.code.length !== 6) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: 'Введите 6-значный код',
      });
    }

    const token = await this.prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        code: body.code,
        expiresAt: { gte: new Date() },
      },
    });

    if (!token) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: 'Неверный или просроченный код',
      });
    }

    // Mark email as verified
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Clean up tokens
    await this.prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    });

    return {
      success: true,
      data: { message: 'Email подтверждён!' },
    };
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
