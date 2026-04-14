import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@supabase/supabase-js';
import { z } from 'zod';
import { CommentsService } from './comments.service.js';
import { SupabaseAuthGuard } from '../../guards/supabase-auth.guard.js';

const createCommentSchema = z.object({
  body: z.string().min(1).max(2000),
  listingId: z.string().optional(),
  threadId: z.string().optional(),
  parentId: z.string().optional(),
});

const voteSchema = z.object({
  value: z.number().refine((v) => v === 1 || v === -1, {
    message: 'value must be 1 or -1',
  }),
});

@Controller('comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  /** GET /api/comments?listingId=X — comments for a listing */
  /** GET /api/comments?threadId=X  — comments for a thread */
  @Get()
  async find(
    @Query('listingId') listingId?: string,
    @Query('threadId') threadId?: string,
  ) {
    if (listingId) {
      const data = await this.comments.findByListing(listingId);
      return { success: true, data };
    }
    if (threadId) {
      const data = await this.comments.findByThread(threadId);
      return { success: true, data };
    }
    return { success: true, data: [] };
  }

  /** POST /api/comments — auth required, create comment */
  @Post()
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    const parsed = createCommentSchema.safeParse(req.body);

    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      throw new BadRequestException({
        success: false,
        data: null,
        error: `Validation failed: ${issues}`,
      });
    }

    if (!parsed.data.listingId && !parsed.data.threadId) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: 'Either listingId or threadId is required',
      });
    }

    const data = await this.comments.create(parsed.data, user.id);
    return { success: true, data };
  }

  /** PATCH /api/comments/:id — auth required, owner only */
  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  async update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() body: unknown,
  ) {
    const user = (req as Request & { user: User }).user;
    const updateSchema = z.object({
      body: z.string().min(1).max(2000),
    });
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: parsed.error.issues.map((i) => i.message).join(', '),
      });
    }
    const data = await this.comments.update(id, parsed.data, user.id);
    return { success: true, data };
  }

  /** DELETE /api/comments/:id — auth required, owner only (soft delete) */
  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    const data = await this.comments.softDelete(id, user.id);
    return { success: true, data };
  }

  /** POST /api/comments/:id/vote — auth required */
  @Post(':id/vote')
  @UseGuards(SupabaseAuthGuard)
  async vote(@Param('id') id: string, @Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    const parsed = voteSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: 'value must be 1 or -1',
      });
    }

    const data = await this.comments.vote(id, user.id, parsed.data.value);
    return { success: true, data };
  }
}
