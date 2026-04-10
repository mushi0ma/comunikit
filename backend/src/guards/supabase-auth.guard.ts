import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';

/**
 * Extracts Bearer token from the Authorization header,
 * verifies it with the Supabase Admin client, and attaches
 * the authenticated user to `req.user`.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly admin: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) {
      throw new Error('Supabase admin credentials are not configured');
    }
    this.admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { cookies?: Record<string, string> }>();

    // Prefer HTTP-only cookie (set by /auth/telegram-login). Fall back to
    // Bearer header so Supabase email/password + GitHub OAuth sessions from
    // the frontend's Supabase client continue to work unchanged.
    const cookieToken = req.cookies?.['access_token'];
    const headerToken = req.headers.authorization?.replace('Bearer ', '');
    const token = cookieToken || headerToken;

    if (!token) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: 'Missing authorization token',
      });
    }

    const {
      data: { user },
      error,
    } = await this.admin.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: error?.message ?? 'Invalid token',
      });
    }

    // Attach user to request for downstream handlers
    (req as Request & { user: unknown }).user = user;
    return true;
  }
}
