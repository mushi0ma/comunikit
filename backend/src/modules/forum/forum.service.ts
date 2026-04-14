import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EnsureUserService } from '../../common/ensure-user.service.js';

@Injectable()
export class ForumService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ensureUserService: EnsureUserService,
  ) {}

  /** Build a nested include for comments up to `depth` levels deep. */
  private buildCommentInclude(depth: number): Record<string, unknown> {
    const authorSelect = {
      id: true,
      name: true,
      avatarUrl: true,
      karma: true,
    };

    const base: Record<string, unknown> = {
      author: { select: authorSelect },
      _count: { select: { votes: true, replies: true } },
    };

    if (depth <= 1) return base;

    return {
      ...base,
      replies: {
        orderBy: { createdAt: 'asc' },
        include: this.buildCommentInclude(depth - 1),
      },
    };
  }

  async findAll(category?: string) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (category) where.category = category;

    return this.prisma.forumThread.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            karma: true,
          },
        },
        _count: { select: { comments: true, votes: true } },
      },
    });
  }

  async findOne(id: string) {
    const thread = await this.prisma.forumThread.findFirst({
      where: { id, deletedAt: null },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            karma: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          where: { parentId: null, deletedAt: null },
          include: {
            ...this.buildCommentInclude(10),
            replies: {
              orderBy: { createdAt: 'asc' },
              include: this.buildCommentInclude(9),
            },
          },
        },
        _count: { select: { votes: true } },
      },
    });

    if (!thread) {
      throw new NotFoundException({
        success: false,
        data: null,
        error: `Thread ${id} not found`,
      });
    }

    return thread;
  }

  async search(query: string) {
    return this.prisma.forumThread.findMany({
      where: {
        deletedAt: null,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async create(
    data: { title: string; body: string; category: string },
    authorId: string,
  ) {
    await this.ensureUserService.ensureUser(authorId);

    return this.prisma.forumThread.create({
      data: {
        title: data.title,
        body: data.body,
        category: data.category,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            karma: true,
          },
        },
      },
    });
  }

  async vote(threadId: string, userId: string, value: number) {
    await this.ensureUserService.ensureUser(userId);

    // Validate thread exists
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
      select: { authorId: true },
    });
    if (!thread) {
      throw new NotFoundException({
        success: false,
        data: null,
        error: `Thread ${threadId} not found`,
      });
    }

    // Check for existing vote
    const existing = await this.prisma.vote.findFirst({
      where: { threadId, userId },
    });

    if (existing) {
      if (existing.value === value) {
        // Same value → toggle off (remove vote)
        await this.prisma.$transaction([
          this.prisma.vote.delete({ where: { id: existing.id } }),
          this.prisma.forumThread.update({
            where: { id: threadId },
            data: { upvotes: { increment: -existing.value } },
          }),
          this.prisma.user.update({
            where: { id: thread.authorId },
            data: { karma: { increment: -existing.value } },
          }),
        ]);
        return { action: 'removed', value: 0 };
      } else {
        // Different value → update vote
        const delta = value - existing.value;
        await this.prisma.$transaction([
          this.prisma.vote.update({
            where: { id: existing.id },
            data: { value },
          }),
          this.prisma.forumThread.update({
            where: { id: threadId },
            data: { upvotes: { increment: delta } },
          }),
          this.prisma.user.update({
            where: { id: thread.authorId },
            data: { karma: { increment: delta } },
          }),
        ]);
        return { action: 'updated', value };
      }
    }

    // New vote
    await this.prisma.$transaction([
      this.prisma.vote.create({
        data: { threadId, userId, value },
      }),
      this.prisma.forumThread.update({
        where: { id: threadId },
        data: { upvotes: { increment: value } },
      }),
      this.prisma.user.update({
        where: { id: thread.authorId },
        data: { karma: { increment: value } },
      }),
    ]);
    return { action: 'created', value };
  }

  async update(
    id: string,
    data: { title?: string; body?: string; category?: string },
    authorId: string,
  ) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id },
      select: { authorId: true, deletedAt: true },
    });

    if (!thread || thread.deletedAt) {
      throw new NotFoundException({
        success: false,
        data: null,
        error: `Thread ${id} not found`,
      });
    }

    if (thread.authorId !== authorId) {
      throw new ForbiddenException({
        success: false,
        data: null,
        error: 'You can only edit your own threads',
      });
    }

    return this.prisma.forumThread.update({
      where: { id },
      data,
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true, karma: true },
        },
        _count: { select: { comments: true, votes: true } },
      },
    });
  }

  async softDelete(id: string, authorId: string) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id },
      select: { authorId: true, deletedAt: true },
    });

    if (!thread || thread.deletedAt) {
      throw new NotFoundException({
        success: false,
        data: null,
        error: `Thread ${id} not found`,
      });
    }

    if (thread.authorId !== authorId) {
      throw new ForbiddenException({
        success: false,
        data: null,
        error: 'You can only delete your own threads',
      });
    }

    await this.prisma.forumThread.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }
}
