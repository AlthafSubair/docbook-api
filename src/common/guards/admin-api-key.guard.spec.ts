import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AdminApiKeyGuard } from './admin-api-key.guard.js';

describe('AdminApiKeyGuard', () => {
  let guard: AdminApiKeyGuard;
  const configuredKey = 'super_secret_admin_key_12345';

  const mockConfigService = {
    get: vi.fn().mockImplementation((key: string) => {
      if (key === 'adminApiKey') return configuredKey;
      return null;
    }),
  };

  const createMockContext = (headers: Record<string, string>): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    guard = new AdminApiKeyGuard(mockConfigService as unknown as ConfigService);
  });

  it('should throw UnauthorizedException when header is missing', () => {
    const context = createMockContext({});
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when key does not match', () => {
    const context = createMockContext({ 'x-admin-api-key': 'wrong_key' });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should return true when x-admin-api-key matches exactly', () => {
    const context = createMockContext({ 'x-admin-api-key': configuredKey });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true when Authorization ApiKey header matches', () => {
    const context = createMockContext({ authorization: `ApiKey ${configuredKey}` });
    expect(guard.canActivate(context)).toBe(true);
  });
});
