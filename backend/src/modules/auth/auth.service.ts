import * as crypto from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Expected shape of a payload delivered by Telegram Login Widget
 * (https://core.telegram.org/widgets/login). The widget serialises the
 * signed-in user as a flat object with an `hash` field alongside.
 */
export interface TelegramWidgetPayload {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
  [key: string]: unknown;
}

export interface TelegramLoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string | undefined;
    telegramId: number;
    username: string | undefined;
  };
}

/**
 * Telegram Login Widget payload max age. Telegram itself recommends ≤ 24h
 * but we keep the same budget as the previous bot-based flow.
 */
const TELEGRAM_AUTH_TTL_SECONDS = 86_400;

@Injectable()
export class AuthService {
  private readonly botToken: string;
  private readonly admin: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) {
      throw new Error('Supabase admin credentials are not configured');
    }
    this.admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  /**
   * Verify a Telegram Login Widget payload using the documented HMAC-SHA-256
   * scheme:
   *
   *   1. Build `data_check_string` = alphabetically sorted `key=value`
   *      pairs joined by `\n`, excluding the `hash` field.
   *   2. secret_key = SHA-256(bot_token)
   *   3. expected_hash = HMAC-SHA-256(data_check_string, secret_key)
   *   4. Compare in constant time against payload.hash
   *
   * Exposed as a public method so the controller (and tests) can invoke it
   * directly without going through `loginWithTelegramWidget`.
   */
  verifyTelegramAuth(payload: Record<string, unknown>): boolean {
    if (!this.botToken) return false;

    const { hash, ...rest } = payload;
    if (typeof hash !== 'string' || hash.length === 0) return false;

    const checkString = Object.keys(rest)
      .sort()
      .map((key) => {
        const value = rest[key];
        if (value === undefined || value === null) return null;
        return `${key}=${String(value)}`;
      })
      .filter((line): line is string => line !== null)
      .join('\n');

    const secret = crypto.createHash('sha256').update(this.botToken).digest();
    const expected = crypto
      .createHmac('sha256', secret)
      .update(checkString)
      .digest('hex');

    // Constant-time compare to avoid timing oracles.
    const expectedBuf = Buffer.from(expected, 'hex');
    const actualBuf = Buffer.from(hash, 'hex');
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  }

  /**
   * Full Telegram Login Widget flow: validate the signed payload, check its
   * freshness, upsert a synthetic Supabase user, and return Supabase tokens
   * for the controller to translate into an HTTP-only cookie.
   */
  async loginWithTelegramWidget(
    payload: TelegramWidgetPayload,
  ): Promise<TelegramLoginResult> {
    if (!this.botToken) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: 'Telegram bot token is not configured',
      });
    }

    if (!this.verifyTelegramAuth(payload as Record<string, unknown>)) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: 'Telegram hash verification failed',
      });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec - payload.auth_date > TELEGRAM_AUTH_TTL_SECONDS) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: 'Telegram auth expired',
      });
    }

    const syntheticEmail = `tg-${payload.id}@telegram.comunikit.local`;
    const password = this.deterministicPassword(payload.id);

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
    if (signInError || !session.session || !session.user) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: signInError?.message ?? 'Failed to issue session',
      });
    }

    return {
      accessToken: session.session.access_token,
      refreshToken: session.session.refresh_token,
      user: {
        id: session.user.id,
        email: session.user.email,
        telegramId: payload.id,
        username: payload.username,
      },
    };
  }

  /**
   * Derive a stable high-entropy password from the bot token + telegram id
   * so the admin client can re-authenticate the synthetic user on each
   * login. Matches the scheme used by the previous controller implementation
   * so existing Supabase users remain usable after the refactor.
   */
  private deterministicPassword(telegramId: number): string {
    return crypto
      .createHmac('sha256', this.botToken)
      .update(`telegram:${telegramId}`)
      .digest('hex');
  }
}
