import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { SessionInfo } from '../../../../shared/types.js';

interface ParsedUA {
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
}

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Hash the access token so we never store raw JWTs in DB. */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /** Parse User-Agent string into browser / os / device type. */
  parseUserAgent(ua: string): ParsedUA {
    const browser = this.detectBrowser(ua);
    const os = this.detectOS(ua);
    const deviceType = this.detectDeviceType(ua);
    return { browser, os, deviceType };
  }

  /** Record a new session on login. */
  async create(
    userId: string,
    accessToken: string,
    userAgent: string,
    ip: string | null,
  ) {
    const tokenHash = this.hashToken(accessToken);
    const { browser, os, deviceType } = this.parseUserAgent(userAgent);

    return this.prisma.session.upsert({
      where: { tokenHash },
      update: { lastActiveAt: new Date() },
      create: { userId, tokenHash, browser, os, deviceType, ip },
    });
  }

  /** List all sessions for a user, marking which one is current. */
  async listForUser(
    userId: string,
    currentTokenHash: string,
  ): Promise<SessionInfo[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      browser: s.browser,
      os: s.os,
      deviceType: s.deviceType as SessionInfo['deviceType'],
      ip: s.ip,
      isCurrent: s.tokenHash === currentTokenHash,
      lastActiveAt: s.lastActiveAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
    }));
  }

  /** Revoke a session by deleting it. Returns true if deleted. */
  async revoke(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) return false;

    await this.prisma.session.delete({ where: { id: sessionId } });
    return true;
  }

  /** Touch lastActiveAt for a token (can be called from guard). */
  async touch(tokenHash: string): Promise<void> {
    await this.prisma.session
      .update({
        where: { tokenHash },
        data: { lastActiveAt: new Date() },
      })
      .catch(() => {
        // Session might not exist yet (e.g. old tokens before feature)
      });
  }

  // ── UA parsing helpers ──────────────────────────────────

  private detectBrowser(ua: string): string {
    if (/Edg\//i.test(ua)) return 'Edge';
    if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera';
    if (/YaBrowser/i.test(ua)) return 'Yandex';
    if (/SamsungBrowser/i.test(ua)) return 'Samsung Internet';
    if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return 'Chrome';
    if (/Firefox\//i.test(ua)) return 'Firefox';
    if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
    return 'Unknown';
  }

  private detectOS(ua: string): string {
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Mac OS|Macintosh/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua)) return 'Linux';
    if (/CrOS/i.test(ua)) return 'Chrome OS';
    return 'Unknown';
  }

  private detectDeviceType(ua: string): 'desktop' | 'mobile' | 'tablet' {
    if (/iPad|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
    if (/Mobile|iPhone|iPod|Android.*Mobile|webOS|BlackBerry/i.test(ua))
      return 'mobile';
    return 'desktop';
  }
}
