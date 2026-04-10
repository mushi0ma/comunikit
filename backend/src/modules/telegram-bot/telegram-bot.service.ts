import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Markup } from 'telegraf';
import { PrismaService } from '../../prisma/prisma.service.js';

/**
 * Telegram bot service.
 *
 * After the migration to the official Telegram Login Widget, this bot is no
 * longer responsible for authentication. It only handles:
 *   - `/start` + `/help` — greeting / command reference.
 *   - `/me` — show the linked Comunikit account (if any).
 *   - `sendMessage(...)` — outbound notification channel used by other modules.
 *
 * The previous deep-link login flow (`/login`, `/start login`, in-memory
 * one-time tokens, `/auth/telegram-token` endpoint) has been removed. Sign-in
 * happens exclusively through the Login Widget → `/api/auth/telegram-login`.
 */
@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: Telegraf | null = null;

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

      await this.linkTelegramUser(tgUser.id, tgUser.username ?? null);

      const greeting = tgUser.first_name
        ? `Привет, ${tgUser.first_name}! 👋`
        : 'Привет! 👋';

      await ctx.reply(
        `${greeting}\n\nЯ — бот Comunikit, студенческой платформы AITU.\n\n` +
          '📋 Форум, маркетплейс и Lost & Found — всё в одном месте.\n' +
          'Войти в платформу можно через официальный виджет Telegram на странице входа.',
        Markup.inlineKeyboard([
          [Markup.button.url('🌐 Открыть Comunikit', appUrl)],
        ]),
      );
    });

    this.bot.command('help', async (ctx) => {
      await ctx.reply(
        '🤖 Команды бота:\n\n' +
          '/start — Приветствие и ссылка на платформу\n' +
          '/help — Список команд\n' +
          '/me — Информация о вашем аккаунте\n\n' +
          'Вход в Comunikit происходит через виджет Telegram на сайте.',
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
            'Войдите на сайте через виджет Telegram, чтобы привязать аккаунт.',
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

    this.bot.catch((err) => {
      this.logger.error('Telegraf error', err);
    });

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

  /** Link a Telegram user ID to an existing Prisma User (by telegramHandle). */
  private async linkTelegramUser(
    tgId: number,
    username: string | null,
  ): Promise<void> {
    const existing = await this.prisma.user.findFirst({
      where: { telegramId: BigInt(tgId) },
    });
    if (existing) return;

    if (username) {
      const byHandle = await this.prisma.user.findFirst({
        where: { telegramHandle: username },
      });
      if (byHandle) {
        await this.prisma.user.update({
          where: { id: byHandle.id },
          data: { telegramId: BigInt(tgId) },
        });
      }
    }
  }
}
