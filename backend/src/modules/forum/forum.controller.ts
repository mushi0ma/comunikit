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
import { ForumService } from './forum.service.js';
import { SupabaseAuthGuard } from '../../guards/supabase-auth.guard.js';

const createThreadSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(10).max(5000),
  category: z.string().min(1),
});

const voteSchema = z.object({
  value: z.number().refine((v) => v === 1 || v === -1, {
    message: 'value must be 1 or -1',
  }),
});

@Controller('forum')
export class ForumController {
  constructor(private readonly forum: ForumService) {}

  /** GET /api/forum — public, list all threads */
  @Get()
  async findAll(@Query('category') category?: string) {
    const data = await this.forum.findAll(category);
    return { success: true, data };
  }

  /** GET /api/forum/search?q=... — public keyword search */
  @Get('search')
  async search(@Query('q') q: string) {
    if (!q || q.trim().length < 2) return { success: true, data: [] };
    const data = await this.forum.search(q.trim());
    return { success: true, data };
  }

  /** GET /api/forum/:id — public, thread + comments */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.forum.findOne(id);
    return { success: true, data };
  }

  /** POST /api/forum — auth required, create thread */
  @Post()
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    const parsed = createThreadSchema.safeParse(req.body);

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

    const data = await this.forum.create(parsed.data, user.id);
    return { success: true, data };
  }

  /** PATCH /api/forum/:id — auth required, owner only */
  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  async update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() body: unknown,
  ) {
    const user = (req as Request & { user: User }).user;
    const updateSchema = z.object({
      title: z.string().min(3).max(200).optional(),
      body: z.string().min(10).max(5000).optional(),
      category: z.string().min(1).optional(),
    });
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: parsed.error.issues.map((i) => i.message).join(', '),
      });
    }
    const data = await this.forum.update(id, parsed.data, user.id);
    return { success: true, data };
  }

  /** DELETE /api/forum/:id — auth required, owner only (soft delete) */
  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    const data = await this.forum.softDelete(id, user.id);
    return { success: true, data };
  }

  /** POST /api/forum/:id/vote — auth required, upvote/downvote */
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

    const data = await this.forum.vote(id, user.id, parsed.data.value);
    return { success: true, data };
  }
}
