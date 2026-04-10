import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';
import { SupabaseAuthGuard } from '../../guards/supabase-auth.guard.js';

/**
 * POST /api/upload/avatar — upload avatar image via backend (bypasses Storage RLS).
 * POST /api/upload/listing-image — upload listing images.
 *
 * Uses the Supabase service_role key so we don't need Storage RLS policies
 * for authenticated uploads from the frontend anon client.
 */
@Controller('upload')
@UseGuards(SupabaseAuthGuard)
export class UploadController {
  private readonly admin: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase admin credentials are not configured');
    }
    this.admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile()
    file:
      | { buffer: Buffer; mimetype: string; size: number; originalname: string }
      | undefined,
  ) {
    const user = (req as Request & { user: { id: string } }).user;
    return this.handleUpload(file, 'avatars', user.id);
  }

  @Post('listing-image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async uploadListingImage(
    @Req() req: Request,
    @UploadedFile()
    file:
      | { buffer: Buffer; mimetype: string; size: number; originalname: string }
      | undefined,
  ) {
    // Use 'listings' as subfolder for organization
    return this.handleUpload(file, 'listing_images', 'listings');
  }

  private async handleUpload(
    file:
      | { buffer: Buffer; mimetype: string; size: number; originalname: string }
      | undefined,
    bucket: string,
    folder: string,
  ) {
    if (!file || !file.buffer?.length) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: 'No file uploaded',
      });
    }

    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: 'Unsupported image format. Use JPEG, PNG, WebP, or GIF.',
      });
    }

    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const randomSuffix = Math.random().toString(36).slice(2, 10);
    const filename = `${folder}/${Date.now()}-${randomSuffix}.${ext}`;

    // Ensure the bucket exists — create it if missing (idempotent).
    // service_role client has the permission to create buckets.
    await this.admin.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: allowedMimes,
    }).catch(() => {
      // Bucket already exists — that's fine
    });

    const { error: uploadError } = await this.admin.storage
      .from(bucket)
      .upload(filename, file.buffer, {
        upsert: true,
        contentType: file.mimetype,
      });

    if (uploadError) {
      console.error(`[Upload] Supabase storage error:`, uploadError);
      throw new BadRequestException({
        success: false,
        data: null,
        error: `Upload failed: ${uploadError.message}`,
      });
    }

    const { data } = this.admin.storage.from(bucket).getPublicUrl(filename);

    return {
      success: true,
      data: { url: data.publicUrl },
    };
  }
}
