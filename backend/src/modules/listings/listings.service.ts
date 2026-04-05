import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface ListingsFilter {
  type?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: ListingsFilter = {}) {
    const where: Record<string, unknown> = { status: 'active' };
    if (filters.type) where.type = filters.type;
    if (filters.category) where.category = filters.category;

    return this.prisma.listing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 50,
      skip: filters.offset ?? 0,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            telegramHandle: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            telegramHandle: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException({
        success: false,
        data: null,
        error: `Listing ${id} not found`,
      });
    }

    return listing;
  }

  async create(
    data: {
      title: string;
      description: string;
      price?: number;
      type: string;
      category: string;
      images?: string[];
    },
    authorId: string,
  ) {
    return this.prisma.listing.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price ?? null,
        type: data.type as never,
        category: data.category,
        images: data.images ?? [],
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            telegramHandle: true,
          },
        },
      },
    });
  }

  async delete(id: string, authorId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!listing) {
      throw new NotFoundException({
        success: false,
        data: null,
        error: `Listing ${id} not found`,
      });
    }

    if (listing.authorId !== authorId) {
      throw new ForbiddenException({
        success: false,
        data: null,
        error: 'You can only delete your own listings',
      });
    }

    await this.prisma.listing.delete({ where: { id } });
    return { success: true };
  }
}
