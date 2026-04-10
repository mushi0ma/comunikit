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
  Res,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Request, Response } from 'express';
import * as nodemailer from 'nodemailer';
import { z } from 'zod';
import { SupabaseAuthGuard } from '../../guards/supabase-auth.guard.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthService, type TelegramWidgetPayload } from './auth.service.js';
import { IdCardService, type IdCardResult } from './id-card.service.js';
import { SessionsService } from './sessions.service.js';

const telegramPayloadSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number(),
  hash: z.string(),
});

/** Session cookie config shared between login and logout handlers. */
const SESSION_COOKIE_NAME = 'access_token';
const SESSION_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Controller('auth')
export class AuthController {
  private readonly admin: SupabaseClient;
  private readonly mailer: nodemailer.Transporter | null;
  private readonly isProd: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
    private readonly idCardService: IdCardService,
    private readonly sessionsService: SessionsService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase admin credentials are not configured');
    }
    this.admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    this.isProd =
      (this.config.get<string>('NODE_ENV') ?? 'development') === 'production';

    const smtpHost = this.config.get<string>('SMTP_HOST');
    const smtpPort = this.config.get<number>('SMTP_PORT');
    const smtpUser = this.config.get<string>('SMTP_USER');
    const smtpPass = this.config.get<string>('SMTP_PASS');
    this.mailer =
      smtpHost && smtpUser && smtpPass
        ? nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort || 465,
            secure: (smtpPort || 465) === 465,
            auth: { user: smtpUser, pass: smtpPass },
          })
        : null;
  }

  /**
   * POST /api/auth/telegram-login — accept a signed Telegram Login Widget
   * payload, validate it via HMAC-SHA-256, upsert a Supabase user and set
   * the session access token as an HTTP-only cookie. Tokens are **never**
   * returned in the response body.
   */
  @Post('telegram-login')
  @HttpCode(HttpStatus.OK)
  async telegramLogin(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: unknown,
  ) {
    const parsed = telegramPayloadSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: 'Invalid Telegram payload',
      });
    }

    const result = await this.authService.loginWithTelegramWidget(
      parsed.data as TelegramWidgetPayload,
    );

    // Record the session + link telegramId onto Prisma User (best effort —
    // login should not fail if those side channels hiccup).
    const userAgent = req.headers['user-agent'] ?? '';
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.ip ??
      null;

    await this.sessionsService
      .create(result.user.id, result.accessToken, userAgent, ip)
      .catch(() => undefined);

    await this.prisma.user
      .update({
        where: { id: result.user.id },
        data: {
          telegramId: BigInt(result.user.telegramId),
          telegramHandle: result.user.username ?? undefined,
        },
      })
      .catch(() => undefined);

    // HTTP-only Secure cookie. `sameSite: 'lax'` is the sweet spot — it
    // blocks CSRF on cross-site state-changing requests but still allows
    // top-level navigation from Telegram's widget iframe.
    res.cookie(SESSION_COOKIE_NAME, result.accessToken, {
      httpOnly: true,
      secure: this.isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_COOKIE_MAX_AGE_MS,
    });

    return {
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          telegram_id: result.user.telegramId,
          username: result.user.username,
        },
      },
    };
  }

  /**
   * GET /api/auth/me — returns the currently signed-in Supabase user based
   * on the HTTP-only cookie (or Bearer header fallback). Used by the
   * frontend's Zustand store to hydrate after a Telegram Login Widget auth.
   */
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  me(@Req() req: Request) {
    const user = (req as Request & { user: unknown }).user;
    return { success: true, data: { user } };
  }

  /**
   * POST /api/auth/logout — clears the session cookie. Does not attempt to
   * revoke the Supabase access token itself (short-lived JWT; expiry handles
   * it). Safe to call without an active session.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: this.isProd,
      sameSite: 'lax',
      path: '/',
    });
    return { success: true, data: null };
  }

  @Post('verify-id-card')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async verifyIdCard(
    @Req() req: Request,
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
    const result = await this.idCardService.verify(file.buffer, file.mimetype);

    // If the caller is authenticated (registered flow is calling from the
    // settings/profile page with a Bearer token) AND the OCR succeeded,
    // persist the verification state onto the User row. The route is also
    // reachable during registration without a token — in that case we just
    // return the OCR result without touching the DB.
    const token = req.headers.authorization?.replace('Bearer ', '') ?? '';
    if (result.isValid && token) {
      try {
        const {
          data: { user },
        } = await this.admin.auth.getUser(token);
        if (user) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              isStudentVerified: true,
              ...(result.extractedData.studentId
                ? { studentId: result.extractedData.studentId }
                : {}),
            },
          });
        }
      } catch (err) {
        // Non-critical: verification may fail to persist (user row missing,
        // studentId unique collision, etc.). We still return the OCR result
        // so the client sees the analysis — but log the failure for ops.
        console.warn(
          '[verify-id-card] Failed to persist verification:',
          err instanceof Error ? err.message : err,
        );
      }
    }

    return result;
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

    // Send verification email via SMTP (nodemailer) or fallback to console.
    if (this.mailer) {
      try {
        const smtpUser = this.config.get<string>('SMTP_USER') ?? 'noreply@comunikit.app';
        await this.mailer.sendMail({
          from: `Comunikit <${smtpUser}>`,
          to: user.email,
          subject: 'Код подтверждения — Comunikit',
          html: `<p>Ваш код подтверждения: <strong>${code}</strong></p><p>Код действует 10 минут.</p>`,
        });
      } catch (err) {
        console.error('[SMTP] Failed to send verification email:', err);
        console.log(
          `\n📧 [FALLBACK] Verification code for ${user.email}: ${code}\n`,
        );
        throw new BadRequestException({
          success: false,
          data: null,
          error: 'Не удалось отправить письмо. Попробуйте позже.',
        });
      }
    } else {
      console.log(
        `\n📧 [MOCK EMAIL] Verification code for ${user.email}: ${code}\n`,
      );

      // No SMTP configured — in development return the code directly.
      const isDev = (this.config.get<string>('NODE_ENV') ?? 'development') === 'development';
      return {
        success: true,
        data: {
          message: isDev
            ? `[DEV] Код: ${code} (SMTP не настроен)`
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

  /**
   * POST /api/auth/link-email — attach a real email to a Telegram/OAuth user
   * that was created with a synthetic `@telegram.comunikit.local` address.
   * The endpoint is idempotent on the same email, enforces uniqueness across
   * Supabase + our Prisma table, and sends a verification OTP so the user
   * confirms ownership of the mailbox.
   */
  @Post('link-email')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async linkEmail(@Req() req: Request, @Body() body: { email?: string }) {
    const user = (req as Request & { user: { id: string; email?: string } })
      .user;

    const emailSchema = z
      .string()
      .trim()
      .toLowerCase()
      .email('Некорректный email');
    const parsed = emailSchema.safeParse(body?.email);
    if (!parsed.success) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: parsed.error.issues[0]?.message ?? 'Некорректный email',
      });
    }
    const newEmail = parsed.data;

    // Block synthetic telegram emails explicitly — the whole point of this
    // endpoint is to replace them with a real mailbox.
    if (newEmail.endsWith('@telegram.comunikit.local')) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: 'Укажите реальный email, а не синтетический Telegram-адрес',
      });
    }

    // Uniqueness check against Prisma User table (covers our own users).
    const existing = await this.prisma.user.findUnique({
      where: { email: newEmail },
      select: { id: true },
    });
    if (existing && existing.id !== user.id) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: 'Этот email уже занят другим пользователем',
      });
    }

    // Uniqueness check against Supabase Auth as well — another user may
    // exist in Supabase but not yet in our Prisma table.
    const { data: existingSupabase } = await this.admin.auth.admin
      .listUsers({ page: 1, perPage: 1 })
      .catch(() => ({ data: { users: [] as Array<{ id: string; email?: string }> } }));
    // The Supabase admin SDK does not expose a direct "find by email" — we
    // rely on `getUserById` alone being insufficient, so use updateUserById
    // wrapped in an existence check below. Short-circuit obvious duplicates.
    if (
      Array.isArray(existingSupabase?.users) &&
      existingSupabase.users.some(
        (u) => u.email?.toLowerCase() === newEmail && u.id !== user.id,
      )
    ) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: 'Этот email уже занят другим пользователем',
      });
    }

    // Update Supabase Auth email (this will require re-confirmation via
    // Supabase's own flow if email confirmations are enabled) and mirror
    // it into our Prisma User row (emailVerified reset until OTP).
    const { error: updateErr } = await this.admin.auth.admin.updateUserById(
      user.id,
      { email: newEmail, email_confirm: false },
    );
    if (updateErr) {
      // Supabase will surface "email already registered" as a message here —
      // convert it to a 400 so the UI shows a clear uniqueness error.
      if (updateErr.message?.toLowerCase().includes('already')) {
        throw new BadRequestException({
          success: false,
          data: null,
          error: 'Этот email уже занят другим пользователем',
        });
      }
      throw new BadRequestException({
        success: false,
        data: null,
        error: updateErr.message,
      });
    }

    await this.prisma.user
      .update({
        where: { id: user.id },
        data: { email: newEmail, emailVerified: null },
      })
      .catch((err: unknown) => {
        // P2002 = unique constraint violation
        if (
          typeof err === 'object' &&
          err &&
          'code' in err &&
          (err as { code?: string }).code === 'P2002'
        ) {
          throw new BadRequestException({
            success: false,
            data: null,
            error: 'Этот email уже занят другим пользователем',
          });
        }
        throw err;
      });

    // Issue a fresh OTP so the user can confirm ownership. Mirrors the
    // send-verification flow.
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    });
    await this.prisma.verificationToken.create({
      data: { userId: user.id, code, expiresAt },
    });

    if (this.mailer) {
      try {
        const smtpUser =
          this.config.get<string>('SMTP_USER') ?? 'noreply@comunikit.app';
        await this.mailer.sendMail({
          from: `Comunikit <${smtpUser}>`,
          to: newEmail,
          subject: 'Подтвердите новый email — Comunikit',
          html: `<p>Ваш код подтверждения: <strong>${code}</strong></p><p>Код действует 10 минут.</p>`,
        });
      } catch (err) {
        console.error('[SMTP] Failed to send link-email OTP:', err);
        console.log(
          `\n📧 [FALLBACK] link-email code for ${newEmail}: ${code}\n`,
        );
      }
    } else {
      console.log(
        `\n📧 [MOCK EMAIL] link-email code for ${newEmail}: ${code}\n`,
      );
    }

    return {
      success: true,
      data: {
        message: 'Email привязан. Введите код подтверждения из письма.',
        email: newEmail,
      },
    };
  }
}
