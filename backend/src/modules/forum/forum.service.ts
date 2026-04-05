import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ForumService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string) {
    const where: Record<string, unknown> = {};
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
    const thread = await this.prisma.forumThread.findUnique({
      where: { id },
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
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                karma: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    karma: true,
                  },
                },
                _count: { select: { votes: true } },
              },
            },
            _count: { select: { votes: true } },
          },
          where: { parentId: null }, // top-level comments only
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

  async create(
    data: { title: string; body: string; category: string },
    authorId: string,
  ) {
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
}
