import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface EnsureUserMetadata {
  name?: string;
  avatarUrl?: string;
  telegramId?: bigint;
  telegramHandle?: string;
}

@Injectable()
export class EnsureUserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Guarantee a User row exists in Prisma for the given Supabase auth ID.
   * Uses upsert so it's safe to call repeatedly (idempotent).
   */
  async ensureUser(userId: string, metadata?: EnsureUserMetadata): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        studentId: userId.slice(0, 8),
        name: metadata?.name ?? 'Студент AITU',
        ...(metadata?.avatarUrl && { avatarUrl: metadata.avatarUrl }),
        ...(metadata?.telegramId && { telegramId: metadata.telegramId }),
        ...(metadata?.telegramHandle && { telegramHandle: metadata.telegramHandle }),
      },
    });
  }
}
