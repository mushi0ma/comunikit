import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service.js';

/**
 * Unit tests for AuthService.verifyTelegramAuth — the HMAC-SHA-256
 * verification of Telegram Login Widget payloads.
 */
describe('AuthService — verifyTelegramAuth', () => {
  const BOT_TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';
  let service: AuthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const map: Record<string, string> = {
                TELEGRAM_BOT_TOKEN: BOT_TOKEN,
                SUPABASE_URL: 'https://example.supabase.co',
                SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
              };
              return map[key];
            }),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  /** Helper: build a valid signed payload from scratch so we know the hash
   *  is correct by construction. */
  function signPayload(data: Record<string, unknown>): Record<string, unknown> {
    const checkString = Object.keys(data)
      .sort()
      .filter((k) => data[k] !== undefined && data[k] !== null)
      .map((k) => `${k}=${String(data[k])}`)
      .join('\n');

    const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest();
    const hash = crypto
      .createHmac('sha256', secret)
      .update(checkString)
      .digest('hex');

    return { ...data, hash };
  }

  it('returns true for a correctly signed payload', () => {
    const payload = signPayload({
      id: 12345678,
      first_name: 'Test',
      username: 'testuser',
      auth_date: Math.floor(Date.now() / 1000),
    });
    expect(service.verifyTelegramAuth(payload)).toBe(true);
  });

  it('returns false when hash is tampered', () => {
    const payload = signPayload({
      id: 12345678,
      first_name: 'Test',
      auth_date: Math.floor(Date.now() / 1000),
    });
    payload.hash = 'deadbeef'.repeat(8); // 64-char hex, but wrong
    expect(service.verifyTelegramAuth(payload)).toBe(false);
  });

  it('returns false when a data field is modified after signing', () => {
    const payload = signPayload({
      id: 12345678,
      first_name: 'Test',
      auth_date: Math.floor(Date.now() / 1000),
    });
    payload.first_name = 'Evil';
    expect(service.verifyTelegramAuth(payload)).toBe(false);
  });

  it('returns false when hash is missing', () => {
    expect(service.verifyTelegramAuth({ id: 1, first_name: 'X', auth_date: 0 })).toBe(false);
  });

  it('returns false when hash is empty string', () => {
    expect(
      service.verifyTelegramAuth({ id: 1, first_name: 'X', auth_date: 0, hash: '' }),
    ).toBe(false);
  });

  it('ignores undefined/null fields in data_check_string (matches service logic)', () => {
    const payload = signPayload({
      id: 99999,
      first_name: 'Null',
      auth_date: Math.floor(Date.now() / 1000),
      // photo_url and last_name intentionally omitted
    });
    // Add explicit undefined/null — they must be ignored by the verifier
    payload.photo_url = undefined;
    payload.last_name = null;
    expect(service.verifyTelegramAuth(payload)).toBe(true);
  });

  it('handles extra unexpected fields in payload', () => {
    const payload = signPayload({
      id: 42,
      first_name: 'Extra',
      auth_date: Math.floor(Date.now() / 1000),
      some_future_field: 'value',
    });
    expect(service.verifyTelegramAuth(payload)).toBe(true);
  });
});
