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
import { ListingsService } from './listings.service.js';
import { SupabaseAuthGuard } from '../../guards/supabase-auth.guard.js';

const createListingSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  price: z.number().min(0).optional(),
  type: z.enum(['sell', 'buy', 'service', 'lost', 'found']),
  category: z.string().min(1),
  location: z.string().max(200).optional(),
  images: z.array(z.string()).max(5).optional().default([]),
});

@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  /** GET /api/listings — public, no auth */
  @Get()
  async findAll(
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('authorId') authorId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const data = await this.listings.findAll({
      type,
      category,
      authorId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    return { success: true, data };
  }

  /** GET /api/listings/search?q=... — public keyword search */
  @Get('search')
  async search(@Query('q') q: string) {
    if (!q || q.trim().length < 2) return { success: true, data: [] };
    const data = await this.listings.search(q.trim());
    return { success: true, data };
  }

  /** GET /api/listings/:id — public */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.listings.findOne(id);
    return { success: true, data };
  }

  /** POST /api/listings — auth required */
  @Post()
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    const body = req.body as unknown;
    const parsed = createListingSchema.safeParse(body);

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

    const data = await this.listings.create(parsed.data, user.id);
    return { success: true, data };
  }

  /** PATCH /api/listings/:id — auth required, owner only */
  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  async update(@Param('id') id: string, @Req() req: Request, @Body() body: unknown) {
    const user = (req as Request & { user: User }).user;
    const updateSchema = z.object({
      title: z.string().min(3).max(100).optional(),
      description: z.string().min(10).max(2000).optional(),
      price: z.number().min(0).optional(),
      category: z.string().min(1).optional(),
      location: z.string().max(200).optional(),
      images: z.array(z.string()).max(5).optional(),
    });
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: parsed.error.issues.map((i) => i.message).join(', '),
      });
    }
    const data = await this.listings.update(id, parsed.data, user.id);
    return { success: true, data };
  }

  /** DELETE /api/listings/:id — auth required, owner only */
  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  async delete(@Param('id') id: string, @Req() req: Request) {
    const user = (req as Request & { user: User }).user;
    const data = await this.listings.delete(id, user.id);
    return { success: true, data };
  }
}
