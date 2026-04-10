import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

const profileSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  bio: true,
  avatarUrl: true,
  telegramHandle: true,
  karma: true,
  studentId: true,
  isStudentVerified: true,
  passwordHash: true,
  createdAt: true,
} as const;

const authorSelect = {
  id: true,
  name: true,
  avatarUrl: true,
  telegramHandle: true,
} as const;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Profile ────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: profileSelect,
    });
    if (!user) return null;

    // Return hasPassword flag instead of raw hash
    const { passwordHash, ...rest } = user;
    return {
      ...rest,
      hasPassword: !!passwordHash,
    };
  }

  async updateProfile(
    userId: string,
    data: { name?: string; bio?: string; telegramHandle?: string; avatarUrl?: string },
  ) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.telegramHandle !== undefined && {
          telegramHandle: data.telegramHandle,
        }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
      select: {
        id: true,
        name: true,
        bio: true,
        avatarUrl: true,
        telegramHandle: true,
      },
    });

    // Fire-and-forget in-app notification. Never let a notification failure
    // break the actual profile update — log and move on.
    await this.notifications
      .create({
        userId,
        type: 'profile_updated',
        title: 'Профиль обновлён',
        body: 'Данные вашего профиля были успешно сохранены.',
      })
      .catch((err) => {
        this.logger.warn(
          `Failed to create profile_updated notification for user ${userId}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      });

    return updated;
  }

  /**
   * Create an in-app notification when the user changes their password.
   * Called from `UsersController.setPassword` after Supabase Auth confirms
   * the update.
   */
  async notifyPasswordChanged(userId: string): Promise<void> {
    await this.notifications
      .create({
        userId,
        type: 'password_changed',
        title: 'Пароль изменён',
        body: 'Ваш пароль был успешно обновлён. Если это были не вы — срочно обратитесь в поддержку.',
      })
      .catch((err) => {
        this.logger.warn(
          `Failed to create password_changed notification for user ${userId}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      });
  }

  // ─── Bookmarks ──────────────────────────────────────────

  async toggleBookmarkListing(userId: string, listingId: string) {
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });

    if (existing) {
      await this.prisma.bookmark.delete({ where: { id: existing.id } });
      return { action: 'removed' as const };
    }

    await this.prisma.bookmark.create({
      data: { userId, listingId },
    });
    return { action: 'added' as const };
  }

  async toggleBookmarkThread(userId: string, threadId: string) {
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_threadId: { userId, threadId } },
    });

    if (existing) {
      await this.prisma.bookmark.delete({ where: { id: existing.id } });
      return { action: 'removed' as const };
    }

    await this.prisma.bookmark.create({
      data: { userId, threadId },
    });
    return { action: 'added' as const };
  }

  async getSaved(userId: string) {
    const [listingBookmarks, threadBookmarks] = await Promise.all([
      this.prisma.bookmark.findMany({
        where: { userId, listingId: { not: null } },
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            include: { author: { select: authorSelect } },
          },
        },
      }),
      this.prisma.bookmark.findMany({
        where: { userId, threadId: { not: null } },
        orderBy: { createdAt: 'desc' },
        include: {
          thread: {
            include: {
              author: { select: { id: true, name: true, avatarUrl: true, karma: true } },
              _count: { select: { comments: true, votes: true } },
            },
          },
        },
      }),
    ]);

    return {
      listings: listingBookmarks
        .map((b) => b.listing)
        .filter(Boolean),
      threads: threadBookmarks
        .map((b) => b.thread)
        .filter(Boolean),
    };
  }

  // ─── Likes (Votes) ─────────────────────────────────────

  async toggleLikeListing(userId: string, listingId: string) {
    const existing = await this.prisma.vote.findFirst({
      where: { userId, listingId },
    });

    if (existing) {
      await this.prisma.vote.delete({ where: { id: existing.id } });
      return { action: 'removed' as const, value: 0 };
    }

    await this.prisma.vote.create({
      data: { userId, listingId, value: 1 },
    });
    return { action: 'added' as const, value: 1 };
  }

  async getLiked(userId: string) {
    const [listingVotes, threadVotes] = await Promise.all([
      this.prisma.vote.findMany({
        where: { userId, listingId: { not: null }, value: 1 },
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            include: { author: { select: authorSelect } },
          },
        },
      }),
      this.prisma.vote.findMany({
        where: { userId, threadId: { not: null }, value: 1 },
        orderBy: { createdAt: 'desc' },
        include: {
          thread: {
            include: {
              author: { select: { id: true, name: true, avatarUrl: true, karma: true } },
              _count: { select: { comments: true, votes: true } },
            },
          },
        },
      }),
    ]);

    return {
      listings: listingVotes
        .map((v) => v.listing)
        .filter(Boolean),
      threads: threadVotes
        .map((v) => v.thread)
        .filter(Boolean),
    };
  }

  // ─── Status checks (for UI toggle state) ───────────────

  async getInteractionStatus(userId: string, targetId: string, targetType: 'listing' | 'thread') {
    const field = targetType === 'listing' ? 'listingId' : 'threadId';

    const [bookmark, vote] = await Promise.all([
      this.prisma.bookmark.findFirst({
        where: { userId, [field]: targetId },
      }),
      this.prisma.vote.findFirst({
        where: { userId, [field]: targetId, value: 1 },
      }),
    ]);

    return {
      saved: !!bookmark,
      liked: !!vote,
    };
  }
}
