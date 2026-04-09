import * as crypto from 'crypto';
import { Test } from '@nestjs/testing';
import { SessionsService } from './sessions.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const mockPrisma = {
  session: {
    create: jest.fn().mockResolvedValue({ id: 'sess-1', tokenHash: 'abc' }),
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    delete: jest.fn().mockResolvedValue({ id: 'sess-1' }),
    update: jest.fn().mockResolvedValue({}),
  },
};

describe('SessionsService', () => {
  let service: SessionsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(SessionsService);
  });

  // ── hashToken ──────────────────────────────────────────

  describe('hashToken', () => {
    it('returns sha256 hex digest', () => {
      const token = 'my-secret-jwt-token';
      const expected = crypto.createHash('sha256').update(token).digest('hex');
      expect(service.hashToken(token)).toBe(expected);
    });

    it('produces different hashes for different tokens', () => {
      expect(service.hashToken('token-a')).not.toBe(service.hashToken('token-b'));
    });

    it('is deterministic (same input → same output)', () => {
      expect(service.hashToken('abc')).toBe(service.hashToken('abc'));
    });
  });

  // ── parseUserAgent ─────────────────────────────────────

  describe('parseUserAgent', () => {
    it('detects Chrome on Windows (desktop)', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
      const result = service.parseUserAgent(ua);
      expect(result.browser).toBe('Chrome');
      expect(result.os).toBe('Windows');
      expect(result.deviceType).toBe('desktop');
    });

    it('detects Safari on macOS (desktop)', () => {
      const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
      const result = service.parseUserAgent(ua);
      expect(result.browser).toBe('Safari');
      expect(result.os).toBe('macOS');
      expect(result.deviceType).toBe('desktop');
    });

    it('detects Firefox on Linux (desktop)', () => {
      const ua = 'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0';
      const result = service.parseUserAgent(ua);
      expect(result.browser).toBe('Firefox');
      expect(result.os).toBe('Linux');
      expect(result.deviceType).toBe('desktop');
    });

    it('detects Chrome on Android (mobile)', () => {
      const ua = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36';
      const result = service.parseUserAgent(ua);
      expect(result.browser).toBe('Chrome');
      expect(result.os).toBe('Android');
      expect(result.deviceType).toBe('mobile');
    });

    it('detects Safari on iOS (mobile)', () => {
      const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
      const result = service.parseUserAgent(ua);
      expect(result.browser).toBe('Safari');
      expect(result.os).toBe('iOS');
      expect(result.deviceType).toBe('mobile');
    });

    it('detects Edge on Windows (desktop)', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.2478.80';
      const result = service.parseUserAgent(ua);
      expect(result.browser).toBe('Edge');
      expect(result.os).toBe('Windows');
      expect(result.deviceType).toBe('desktop');
    });

    it('detects Opera on Windows', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 OPR/109.0.0.0';
      const result = service.parseUserAgent(ua);
      expect(result.browser).toBe('Opera');
      expect(result.os).toBe('Windows');
    });

    it('detects Yandex Browser', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 YaBrowser/24.4.0 Safari/537.36';
      const result = service.parseUserAgent(ua);
      expect(result.browser).toBe('Yandex');
    });

    it('detects Samsung Internet on Android (mobile)', () => {
      const ua = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/124.0.0.0 Mobile Safari/537.36';
      const result = service.parseUserAgent(ua);
      expect(result.browser).toBe('Samsung Internet');
      expect(result.os).toBe('Android');
      expect(result.deviceType).toBe('mobile');
    });

    it('detects iPad as tablet', () => {
      const ua = 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
      const result = service.parseUserAgent(ua);
      expect(result.os).toBe('iOS');
      expect(result.deviceType).toBe('tablet');
    });

    it('detects Android tablet', () => {
      const ua = 'Mozilla/5.0 (Linux; Android 14; SM-X810) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Safari/537.36';
      const result = service.parseUserAgent(ua);
      expect(result.os).toBe('Android');
      expect(result.deviceType).toBe('tablet');
    });

    it('detects Chrome OS', () => {
      const ua = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
      const result = service.parseUserAgent(ua);
      expect(result.os).toBe('Chrome OS');
      expect(result.deviceType).toBe('desktop');
    });

    it('returns Unknown for unrecognizable UA', () => {
      const result = service.parseUserAgent('curl/8.5.0');
      expect(result.browser).toBe('Unknown');
      expect(result.os).toBe('Unknown');
      expect(result.deviceType).toBe('desktop');
    });

    it('handles empty string', () => {
      const result = service.parseUserAgent('');
      expect(result.browser).toBe('Unknown');
      expect(result.os).toBe('Unknown');
      expect(result.deviceType).toBe('desktop');
    });
  });

  // ── create ─────────────────────────────────────────────

  describe('create', () => {
    it('calls prisma.session.create with hashed token and parsed UA', async () => {
      await service.create(
        'user-1',
        'jwt-token-abc',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        '127.0.0.1',
      );

      expect(mockPrisma.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          browser: 'Chrome',
          os: 'Windows',
          deviceType: 'desktop',
          ip: '127.0.0.1',
          tokenHash: expect.any(String),
        }),
      });
    });

    it('generates unique tokenHash for different tokens', async () => {
      await service.create('user-1', 'token-a', 'Chrome', null);
      const call1 = mockPrisma.session.create.mock.calls[0][0].data.tokenHash;

      await service.create('user-1', 'token-b', 'Chrome', null);
      const call2 = mockPrisma.session.create.mock.calls[1][0].data.tokenHash;

      expect(call1).not.toBe(call2);
    });
  });

  // ── revoke ─────────────────────────────────────────────

  describe('revoke', () => {
    it('returns false when session not found', async () => {
      mockPrisma.session.findFirst.mockResolvedValueOnce(null);
      const result = await service.revoke('sess-99', 'user-1');
      expect(result).toBe(false);
    });

    it('deletes session and returns true when found', async () => {
      mockPrisma.session.findFirst.mockResolvedValueOnce({ id: 'sess-1', userId: 'user-1' });
      const result = await service.revoke('sess-1', 'user-1');
      expect(result).toBe(true);
      expect(mockPrisma.session.delete).toHaveBeenCalledWith({ where: { id: 'sess-1' } });
    });
  });
});
