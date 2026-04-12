/**
 * Integration-ish tests for AuthController — verify that nodemailer is
 * invoked with the right recipient, subject, and a 6-digit OTP in the body
 * whenever an email-sending endpoint fires. nodemailer is fully mocked so
 * no real mail is ever sent.
 */
import * as nodemailer from 'nodemailer';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { IdCardService } from './id-card.service.js';
import { SessionsService } from './sessions.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

jest.mock('nodemailer');

type SendMailArgs = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

type AuthedReq = {
  user: { id: string; email?: string };
  headers: Record<string, string | undefined>;
  ip?: string;
};

const OTP_REGEX = /\b\d{6}\b/;

describe('AuthController — SMTP (nodemailer) integration', () => {
  const sendMail = jest
    .fn<Promise<{ accepted: string[]; messageId: string }>, [SendMailArgs]>()
    .mockResolvedValue({ accepted: [], messageId: 'test-message-id' });

  let controller: AuthController;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    verificationToken: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({}),
      findFirst: jest.fn(),
    },
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      const map: Record<string, string | number> = {
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: 465,
        SMTP_USER: 'noreply@comunikit.app',
        SMTP_PASS: 'test-password',
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
        TELEGRAM_BOT_TOKEN: 'test-bot-token',
        NODE_ENV: 'test',
      };
      return map[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset default Prisma stubs
    mockPrisma.user.findUnique.mockResolvedValue({ emailVerified: null });
    mockPrisma.user.update.mockResolvedValue({});

    // Wire the jest.mock'd createTransport to our sendMail spy so every
    // controller-side sendMail call is observable.
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: ConfigService, useValue: mockConfig },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: IdCardService, useValue: { verify: jest.fn() } },
        {
          provide: SessionsService,
          useValue: {
            create: jest.fn(),
            hashToken: jest.fn().mockReturnValue('hash'),
            touch: jest.fn(),
            listForUser: jest.fn().mockResolvedValue([]),
            revoke: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            verifyTelegramAuth: jest.fn().mockReturnValue(true),
            loginWithTelegramWidget: jest.fn().mockResolvedValue({
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token',
              user: { id: 'user-1', email: 'tg-1@telegram.comunikit.local', telegramId: 1, username: 'test' },
            }),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(AuthController);

    // Replace the real Supabase admin client (which was instantiated from
    // the fake URL in the constructor) with a controllable mock so we can
    // drive link-email uniqueness checks.
    (
      controller as unknown as {
        admin: {
          auth: {
            admin: {
              updateUserById: jest.Mock;
              listUsers: jest.Mock;
            };
            getUser: jest.Mock;
          };
        };
      }
    ).admin = {
      auth: {
        admin: {
          updateUserById: jest.fn().mockResolvedValue({ error: null }),
          listUsers: jest.fn().mockResolvedValue({ data: { users: [] } }),
        },
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    };
  });

  it('constructs a nodemailer transport from SMTP_* env vars', () => {
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        auth: expect.objectContaining({
          user: 'noreply@comunikit.app',
          pass: 'test-password',
        }),
      }),
    );
  });

  // ── sendVerification ────────────────────────────────────

  describe('POST /auth/send-verification', () => {
    function makeReq(email = 'student@aitu.edu.kz'): AuthedReq {
      return {
        user: { id: 'user-1', email },
        headers: {},
      };
    }

    it('sends mail with correct recipient, subject, and 6-digit code', async () => {
      const req = makeReq();
      const result = await controller.sendVerification(
        req as unknown as Parameters<typeof controller.sendVerification>[0],
      );

      expect(sendMail).toHaveBeenCalledTimes(1);
      const args = sendMail.mock.calls[0][0];

      expect(args.to).toBe('student@aitu.edu.kz');
      expect(args.subject).toMatch(/Код подтверждения/i);
      expect(args.subject).toMatch(/Comunikit/i);
      expect(args.html).toMatch(OTP_REGEX);
      expect(args.from).toContain('noreply@comunikit.app');

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ message: expect.any(String) }),
        }),
      );
    });

    it('persists the same 6-digit code it just emailed', async () => {
      const req = makeReq('dev@aitu.edu.kz');
      await controller.sendVerification(
        req as unknown as Parameters<typeof controller.sendVerification>[0],
      );

      expect(mockPrisma.verificationToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(mockPrisma.verificationToken.create).toHaveBeenCalledTimes(1);

      const createArgs = mockPrisma.verificationToken.create.mock
        .calls[0][0] as { data: { userId: string; code: string } };
      expect(createArgs.data.userId).toBe('user-1');
      expect(createArgs.data.code).toMatch(/^\d{6}$/);

      // The persisted code must match the one in the email body exactly.
      const mailArgs = sendMail.mock.calls[0][0];
      expect(mailArgs.html).toContain(createArgs.data.code);
    });

    it('rejects when the user has no email on file', async () => {
      const req: AuthedReq = { user: { id: 'user-1' }, headers: {} };
      await expect(
        controller.sendVerification(
          req as unknown as Parameters<typeof controller.sendVerification>[0],
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('returns early without sending when email already verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        emailVerified: new Date(),
      });
      const req = makeReq();
      const res = await controller.sendVerification(
        req as unknown as Parameters<typeof controller.sendVerification>[0],
      );

      expect(
        (res as { data: { message: string } }).data.message,
      ).toMatch(/уже подтверждён/i);
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('throws InternalServerErrorException when SMTP sendMail fails', async () => {
      sendMail.mockRejectedValueOnce(new Error('SMTP connection refused'));

      const req = makeReq();
      await expect(
        controller.sendVerification(
          req as unknown as Parameters<typeof controller.sendVerification>[0],
        ),
      ).rejects.toBeInstanceOf(InternalServerErrorException);

      expect(sendMail).toHaveBeenCalledTimes(1);
    });

    it('still persists the OTP before attempting to send email', async () => {
      sendMail.mockRejectedValueOnce(new Error('SMTP timeout'));

      const req = makeReq('fail@aitu.edu.kz');
      await controller
        .sendVerification(
          req as unknown as Parameters<typeof controller.sendVerification>[0],
        )
        .catch(() => undefined);

      expect(mockPrisma.verificationToken.create).toHaveBeenCalledTimes(1);
      const createArgs = mockPrisma.verificationToken.create.mock
        .calls[0][0] as { data: { userId: string; code: string } };
      expect(createArgs.data.code).toMatch(/^\d{6}$/);
    });
  });

  // ── linkEmail ───────────────────────────────────────────

  describe('POST /auth/link-email', () => {
    function makeReq(): AuthedReq {
      return {
        user: { id: 'user-42', email: 'tg-99@telegram.comunikit.local' },
        headers: {},
      };
    }

    it('emails the new address with a 6-digit code after uniqueness passes', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.update.mockResolvedValueOnce({});

      const req = makeReq();
      const result = await controller.linkEmail(
        req as unknown as Parameters<typeof controller.linkEmail>[0],
        { email: 'real@student.com' },
      );

      expect(sendMail).toHaveBeenCalledTimes(1);
      const args = sendMail.mock.calls[0][0];
      expect(args.to).toBe('real@student.com');
      expect(args.subject).toMatch(/Подтвердите/i);
      expect(args.html).toMatch(OTP_REGEX);

      expect(
        (result as { data: { email: string } }).data.email,
      ).toBe('real@student.com');
    });

    it('rejects synthetic @telegram.comunikit.local addresses', async () => {
      const req = makeReq();
      await expect(
        controller.linkEmail(
          req as unknown as Parameters<typeof controller.linkEmail>[0],
          { email: 'tg-1@telegram.comunikit.local' },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('rejects when the email is already bound to another user', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'other-user' });

      const req = makeReq();
      await expect(
        controller.linkEmail(
          req as unknown as Parameters<typeof controller.linkEmail>[0],
          { email: 'taken@student.com' },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('rejects malformed email input', async () => {
      const req = makeReq();
      await expect(
        controller.linkEmail(
          req as unknown as Parameters<typeof controller.linkEmail>[0],
          { email: 'not-an-email' },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('throws InternalServerErrorException when SMTP fails during link-email', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.update.mockResolvedValueOnce({});
      sendMail.mockRejectedValueOnce(new Error('SMTP auth failed'));

      const req = makeReq();
      await expect(
        controller.linkEmail(
          req as unknown as Parameters<typeof controller.linkEmail>[0],
          { email: 'new@student.com' },
        ),
      ).rejects.toBeInstanceOf(InternalServerErrorException);

      expect(sendMail).toHaveBeenCalledTimes(1);
    });

    it('persists OTP even when SMTP fails during link-email', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.update.mockResolvedValueOnce({});
      sendMail.mockRejectedValueOnce(new Error('SMTP timeout'));

      const req = makeReq();
      await controller
        .linkEmail(
          req as unknown as Parameters<typeof controller.linkEmail>[0],
          { email: 'retry@student.com' },
        )
        .catch(() => undefined);

      expect(mockPrisma.verificationToken.create).toHaveBeenCalledTimes(1);
      const createArgs = mockPrisma.verificationToken.create.mock
        .calls[0][0] as { data: { userId: string; code: string } };
      expect(createArgs.data.code).toMatch(/^\d{6}$/);
    });
  });
});
