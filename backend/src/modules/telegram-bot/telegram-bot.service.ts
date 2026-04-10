import * as crypto from 'crypto';
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Markup, type Context } from 'telegraf';
import { PrismaService } from '../../prisma/prisma.service.js';

/** Data captured when a user asks the bot for a login link. */
export interface TelegramLoginTokenPayload {
  id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
}

interface StoredLoginToken extends TelegramLoginTokenPayload {
  expiresAt: number;
}

const LOGIN_TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: Telegraf | null = null;

  /**
   * In-memory store for one-time login tokens. Keyed by the random token
   * string, value holds the Telegram user snapshot + expiry. This lives on
   * the single backend instance, which is fine for the monolithic NestJS
   * setup — the same process runs both the bot (Telegraf long-polling) and
   * the HTTP API that consumes the tokens.
   */
  private readonly loginTokens = new Map<string, StoredLoginToken>();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set — bot disabled');
      return;
    }

    this.bot = new Telegraf(token);

    this.bot.command('start', async (ctx) => {
      const tgUser = ctx.from;
      const appUrl =
        this.config.get<string>('APP_URL') ?? 'https://comunikit.vercel.app';

      // Deep-link payload support: the "Login via Telegram" button on the
      // frontend points at `t.me/<bot>?start=login`, which delivers
      // `/start login` to us. Treat that as an explicit login request.
      const messageText =
        (ctx.message as { text?: string } | undefined)?.text ?? '';
      const payload = messageText.split(/\s+/).filter(Boolean)[1] ?? '';
      if (payload === 'login' || payload === 'auth') {
        await this.sendLoginLink(ctx, tgUser, appUrl);
        return;
      }

      // Regular /start: link telegram account to existing user if possible.
      await this.linkTelegramUser(tgUser.id, tgUser.username ?? null);

      const greeting = tgUser.first_name
        ? `Привет, ${tgUser.first_name}! 👋`
        : 'Привет! 👋';

      await ctx.reply(
        `${greeting}\n\nЯ — бот Comunikit, студенческой платформы AITU.\n\n` +
          '📋 Форум, маркетплейс и Lost & Found — всё в одном месте.\n' +
          'Нажми /login, чтобы получить одноразовую ссылку для входа.',
        Markup.inlineKeyboard([
          [Markup.button.url('🌐 Открыть Comunikit', appUrl)],
        ]),
      );
    });

    // Dedicated /login command — works even if the user is already chatting.
    this.bot.command('login', async (ctx) => {
      const appUrl =
        this.config.get<string>('APP_URL') ?? 'https://comunikit.vercel.app';
      await this.sendLoginLink(ctx, ctx.from, appUrl);
    });

    this.bot.command('help', async (ctx) => {
      await ctx.reply(
        '🤖 Команды бота:\n\n' +
          '/start — Приветствие и ссылка на платформу\n' +
          '/login — Получить одноразовую ссылку для входа\n' +
          '/help — Список команд\n' +
          '/me — Информация о вашем аккаунте',
      );
    });

    this.bot.command('me', async (ctx) => {
      const tgId = ctx.from.id;
      const user = await this.prisma.user.findFirst({
        where: { telegramId: BigInt(tgId) },
      });

      if (!user) {
        await ctx.reply(
          '❌ Ваш Telegram не привязан к аккаунту Comunikit.\n' +
            'Отправьте /login и войдите по ссылке, чтобы привязать аккаунт.',
        );
        return;
      }

      await ctx.reply(
        `✅ Аккаунт привязан!\n\n` +
          `👤 ${user.name}\n` +
          `🎓 Student ID: ${user.studentId}\n` +
          `⭐ Карма: ${user.karma}`,
      );
    });

    // Graceful error handling
    this.bot.catch((err) => {
      this.logger.error('Telegraf error', err);
    });

    // Launch with polling (non-blocking)
    this.bot
      .launch()
      .then(() => this.logger.log('Telegram bot started (polling)'))
      .catch((err) => this.logger.error('Failed to start Telegram bot', err));
  }

  async onModuleDestroy() {
    this.bot?.stop('NestJS shutdown');
  }

  /** Send a message to a user by their Telegram ID. */
  async sendMessage(telegramId: bigint, text: string): Promise<void> {
    if (!this.bot) return;
    await this.bot.telegram.sendMessage(Number(telegramId), text);
  }

  /**
   * Generate a one-time login token for the given Telegram user and store
   * it for 5 minutes. Any previously issued (not yet consumed) tokens for
   * the same Telegram user are kept alive — they simply expire naturally —
   * so that refreshing the login page does not race a pending redeem.
   */
  issueLoginToken(tgUser: TelegramLoginTokenPayload): string {
    this.purgeExpiredTokens();
    const token = crypto.randomBytes(32).toString('hex');
    this.loginTokens.set(token, {
      ...tgUser,
      expiresAt: Date.now() + LOGIN_TOKEN_TTL_MS,
    });
    return token;
  }

  /**
   * Exchange a login token for the Telegram user payload. The token is
   * single-use: a successful consume removes it from the store. Returns
   * `null` if the token is unknown or expired.
   */
  consumeLoginToken(token: string): TelegramLoginTokenPayload | null {
    const entry = this.loginTokens.get(token);
    if (!entry) return null;
    this.loginTokens.delete(token);
    if (entry.expiresAt < Date.now()) return null;
    const { expiresAt: _expiresAt, ...payload } = entry;
    void _expiresAt;
    return payload;
  }

  private purgeExpiredTokens(): void {
    const now = Date.now();
    // Use forEach instead of for..of because the repo's root tsconfig.json
    // targets a lower ES version without default Map iterators.
    this.loginTokens.forEach((entry, token) => {
      if (entry.expiresAt < now) {
        this.loginTokens.delete(token);
      }
    });
  }

  /** Helper: build a login link and reply to the user with an inline button. */
  private async sendLoginLink(
    ctx: Context,
    tgUser: {
      id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    },
    appUrl: string,
  ): Promise<void> {
    // Telegraf types sometimes surface photo_url via `getUserProfilePhotos`,
    // but the plain ctx.from doesn't include it. That is fine — we only use
    // it as a nice-to-have metadata field.
    const token = this.issueLoginToken({
      id: tgUser.id,
      username: tgUser.username ?? null,
      first_name: tgUser.first_name ?? '',
      last_name: tgUser.last_name ?? null,
      photo_url: null,
    });

    const link = `${appUrl.replace(/\/$/, '')}/login?tg_token=${token}`;

    await ctx.reply(
      '🔑 *Вход в Comunikit*\n\n' +
        'Нажмите кнопку ниже, чтобы войти. Ссылка одноразовая и действует 5 минут.',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.url('Войти в Comunikit', link)],
        ]),
      },
    );
  }

  /** Link a Telegram user ID to an existing Prisma User (by telegramHandle or telegramId). */
  private async linkTelegramUser(
    tgId: number,
    username: string | null,
  ): Promise<void> {
    // Already linked?
    const existing = await this.prisma.user.findFirst({
      where: { telegramId: BigInt(tgId) },
    });
    if (existing) return;

    // Try to match by @username if available
    if (username) {
      const byHandle = await this.prisma.user.findFirst({
        where: { telegramHandle: username },
      });
      if (byHandle) {
        await this.prisma.user.update({
          where: { id: byHandle.id },
          data: { telegramId: BigInt(tgId) },
        });
        return;
      }
    }
  }
}
