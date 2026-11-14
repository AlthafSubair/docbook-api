import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'node:crypto';
import type { Request } from 'express';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  private readonly adminApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.adminApiKey =
      this.configService.get<string>('adminApiKey') ?? '';
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.adminApiKey) {
      throw new UnauthorizedException('Admin API key is not configured on server');
    }

    const request = context.switchToHttp().getRequest<Request>();

    // Support 'x-admin-api-key' or 'Authorization: ApiKey <key>' or 'x-api-key'
    const headerKey =
      (request.headers['x-admin-api-key'] as string | undefined) ??
      (request.headers['x-api-key'] as string | undefined);

    let providedKey = headerKey;

    if (!providedKey && request.headers.authorization) {
      const authHeader = request.headers.authorization;
      if (authHeader.startsWith('ApiKey ')) {
        providedKey = authHeader.substring(7).trim();
      }
    }

    if (!providedKey) {
      throw new UnauthorizedException(
        'Missing required admin authentication header (x-admin-api-key)',
      );
    }

    // Timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(this.adminApiKey);
    const providedBuffer = Buffer.from(providedKey);

    if (
      expectedBuffer.length !== providedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      throw new UnauthorizedException('Invalid admin API key');
    }

    return true;
  }
}
