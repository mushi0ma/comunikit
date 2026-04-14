import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EnsureUserService } from '../../common/ensure-user.service.js';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ensureUserService: EnsureUserService,
  ) {}

  private readonly authorSelect = {
    id: true,
    name: true,
    avatarUrl: true,
    karma: true,
  } as const;

  async findByListing(listingId: string) {
    return this.prisma.comment.findMany({
      where: { listingId, parentId: null, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: this.authorSelect },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: this.authorSelect },
            _count: { select: { votes: true, replies: true } },
          },
        },
        _count: { select: { votes: true, replies: true } },
      },
    });
  }

  async findByThread(threadId: string) {
    return this.prisma.comment.findMany({
      where: { threadId, parentId: null, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: this.authorSelect },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: this.authorSelect },
            _count: { select: { votes: true, replies: true } },
          },
        },
        _count: { select: { votes: true, replies: true } },
      },
    });
  }

  async create(
    data: {
      body: string;
      listingId?: string;
      threadId?: string;
      parentId?: string;
    },
    authorId: string,
  ) {
    await this.ensureUserService.ensureUser(authorId);

    const comment = await this.prisma.comment.create({
      data: {
        body: data.body,
        authorId,
        listingId: data.listingId ?? null,
        threadId: data.threadId ?? null,
        parentId: data.parentId ?? null,
      },
      include: {
        author: { select: this.authorSelect },
        replies: true,
        _count: { select: { votes: true, replies: true } },
      },
    });

    // Increment replyCount on forum thread
    if (data.threadId) {
      await this.prisma.forumThread.update({
        where: { id: data.threadId },
        data: { replyCount: { increment: 1 } },
      });
    }

    // Create notification for content author
    if (data.listingId) {
      const listing = await this.prisma.listing.findUnique({
        where: { id: data.listingId },
        select: { authorId: true, title: true },
      });
      if (listing && listing.authorId !== authorId) {
        await this.prisma.notification.create({
          data: {
            userId: listing.authorId,
            type: 'comment',
            title: 'Новый комментарий',
            body: `Комментарий к "${listing.title}"`,
            relatedId: data.listingId,
          },
        });
      }
    }

    if (data.threadId) {
      const thread = await this.prisma.forumThread.findUnique({
        where: { id: data.threadId },
        select: { authorId: true, title: true },
      });
      if (thread && thread.authorId !== authorId) {
        await this.prisma.notification.create({
          data: {
            userId: thread.authorId,
            type: 'forum',
            title: 'Новый ответ в теме',
            body: `Ответ в "${thread.title}"`,
            relatedId: data.threadId,
          },
        });
      }
    }

    // Notify parent comment author about reply
    if (data.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: data.parentId },
        select: { authorId: true },
      });
      if (parent && parent.authorId !== authorId) {
        await this.prisma.notification.create({
          data: {
            userId: parent.authorId,
            type: 'reply',
            title: 'Ответ на ваш комментарий',
            body: data.body.slice(0, 100),
            relatedId: data.threadId ?? data.listingId ?? null,
          },
        });
      }
    }

    return comment;
  }

  async vote(commentId: string, userId: string, value: number) {
    await this.ensureUserService.ensureUser(userId);

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });
    if (!comment) {
      throw new NotFoundException({
        success: false,
        data: null,
        error: `Comment ${commentId} not found`,
      });
    }

    const existing = await this.prisma.vote.findFirst({
      where: { commentId, userId },
    });

    if (existing) {
      if (existing.value === value) {
        // Toggle off
        await this.prisma.$transaction([
          this.prisma.vote.delete({ where: { id: existing.id } }),
          this.prisma.user.update({
            where: { id: comment.authorId },
            data: { karma: { increment: -existing.value } },
          }),
        ]);
        return { action: 'removed', value: 0 };
      } else {
        // Change vote
        const delta = value - existing.value;
        await this.prisma.$transaction([
          this.prisma.vote.update({
            where: { id: existing.id },
            data: { value },
          }),
          this.prisma.user.update({
            where: { id: comment.authorId },
            data: { karma: { increment: delta } },
          }),
        ]);
        return { action: 'updated', value };
      }
    }

    // New vote
    await this.prisma.$transaction([
      this.prisma.vote.create({
        data: { commentId, userId, value },
      }),
      this.prisma.user.update({
        where: { id: comment.authorId },
        data: { karma: { increment: value } },
      }),
    ]);
    return { action: 'created', value };
  }

  async update(id: string, data: { body: string }, authorId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: { authorId: true, deletedAt: true },
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException({
        success: false,
        data: null,
        error: `Comment ${id} not found`,
      });
    }

    if (comment.authorId !== authorId) {
      throw new ForbiddenException({
        success: false,
        data: null,
        error: 'You can only edit your own comments',
      });
    }

    return this.prisma.comment.update({
      where: { id },
      data: { body: data.body },
      include: {
        author: { select: this.authorSelect },
        _count: { select: { votes: true, replies: true } },
      },
    });
  }

  async softDelete(id: string, authorId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: { authorId: true, deletedAt: true, threadId: true },
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException({
        success: false,
        data: null,
        error: `Comment ${id} not found`,
      });
    }

    if (comment.authorId !== authorId) {
      throw new ForbiddenException({
        success: false,
        data: null,
        error: 'You can only delete your own comments',
      });
    }

    await this.prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Decrement parent thread's replyCount
    if (comment.threadId) {
      await this.prisma.forumThread.update({
        where: { id: comment.threadId },
        data: { replyCount: { decrement: 1 } },
      });
    }
    return { success: true };
  }
}
