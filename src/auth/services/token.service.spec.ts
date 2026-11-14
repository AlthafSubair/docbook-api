import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { TokenService } from './token.service.js';

describe('TokenService (Patient Stateless JWT)', () => {
  let service: TokenService;

  const mockJwtService = {
    signAsync: vi.fn().mockImplementation((payload) =>
      Promise.resolve(`patient_token_for_${payload.phone}`),
    ),
    verifyAsync: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn().mockImplementation((key: string) => {
      if (key === 'jwt.accessSecret') return 'test_access_secret_key_123456';
      if (key === 'jwt.accessExpiration') return '15m';
      if (key === 'jwt.refreshSecret') return 'test_refresh_secret_key_123456';
      if (key === 'jwt.refreshExpiration') return '30d';
      return null;
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  describe('generateTokens', () => {
    it('should generate stateless accessToken and refreshToken without DB persistence', async () => {
      const tokens = await service.generateTokens('+919876543210');

      expect(tokens.accessToken).toBe('patient_token_for_+919876543210');
      expect(tokens.refreshToken).toBe('patient_token_for_+919876543210');
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);

      // Access payload check
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: '+919876543210',
          phone: '+919876543210',
          role: 'patient',
        },
        expect.objectContaining({ secret: 'test_access_secret_key_123456' }),
      );

      // Refresh payload check
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: '+919876543210',
          phone: '+919876543210',
          role: 'patient',
          tokenType: 'patient_refresh',
        },
        expect.objectContaining({ secret: 'test_refresh_secret_key_123456' }),
      );
    });
  });

  describe('rotateRefreshToken', () => {
    it('should cryptographically verify refresh token and issue new token pair', async () => {
      mockJwtService.verifyAsync.mockResolvedValueOnce({
        sub: '+919876543210',
        phone: '+919876543210',
        role: 'patient',
        tokenType: 'patient_refresh',
      });

      const result = await service.rotateRefreshToken('valid_patient_refresh_jwt');

      expect(result.accessToken).toBe('patient_token_for_+919876543210');
      expect(result.refreshToken).toBe('patient_token_for_+919876543210');
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        'valid_patient_refresh_jwt',
        expect.objectContaining({ secret: 'test_refresh_secret_key_123456' }),
      );
    });

    it('should throw UnauthorizedException if token verification fails', async () => {
      mockJwtService.verifyAsync.mockRejectedValueOnce(new Error('jwt expired'));

      await expect(
        service.rotateRefreshToken('expired_token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if tokenType or role is not patient_refresh', async () => {
      mockJwtService.verifyAsync.mockResolvedValueOnce({
        sub: '+919876543210',
        phone: '+919876543210',
        role: 'admin',
        tokenType: 'clinic_refresh',
      });

      await expect(
        service.rotateRefreshToken('wrong_token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeRefreshToken', () => {
    it('should safely complete as a no-op in stateless mode', async () => {
      await expect(service.revokeRefreshToken('token')).resolves.toBeUndefined();
    });
  });
});
