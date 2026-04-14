import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EnsureUserService } from '../../common/ensure-user.service.js';

export interface ListingsFilter {
  type?: string;
  category?: string;
  authorId?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ensureUserService: EnsureUserService,
  ) {}

  async findAll(filters: ListingsFilter = {}) {
    const where: Record<string, unknown> = { status: 'active' };
    if (filters.type) where.type = filters.type;
    if (filters.category) where.category = filters.category;
    if (filters.authorId) where.authorId = filters.authorId;

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
      location?: string;
      images?: string[];
    },
    authorId: string,
  ) {
    await this.ensureUserService.ensureUser(authorId);

    return this.prisma.listing.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price ?? null,
        type: data.type as never,
        category: data.category,
        location: data.location ?? null,
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

  async search(query: string) {
    return this.prisma.listing.findMany({
      where: {
        status: 'active',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
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

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      price?: number;
      category?: string;
      location?: string;
      images?: string[];
    },
    authorId: string,
  ) {
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
        error: 'You can only edit your own listings',
      });
    }

    return this.prisma.listing.update({
      where: { id },
      data,
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true, telegramHandle: true },
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
