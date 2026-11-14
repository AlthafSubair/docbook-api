import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { ClinicTokenService } from './clinic-token.service.js';
import { UserRole } from '../../users/enums/user.enums.js';
import { User } from '../../users/entities/user.entity.js';

describe('ClinicTokenService', () => {
  let service: ClinicTokenService;

  const mockUser: User = {
    userId: '1',
    clinicId: '10',
    fullName: 'Dr. Sarah Thomas',
    username: 'sarah',
    email: 'sarah@citycare.com',
    passwordHash: 'hash',
    role: UserRole.ADMIN,
    phone: null,
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockJwtService = {
    signAsync: vi.fn().mockImplementation((payload) =>
      Promise.resolve(`signed_token_for_${payload.sub}`),
    ),
    verifyAsync: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn().mockImplementation((key: string) => {
      if (key === 'jwt.accessSecret') return 'test_access_secret_key_123456';
      if (key === 'jwt.accessExpiration') return '15m';
      if (key === 'jwt.refreshSecret') return 'test_refresh_secret_key_123456';
      if (key === 'jwt.refreshExpiration') return '7d';
      return null;
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicTokenService,
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

    service = module.get<ClinicTokenService>(ClinicTokenService);
  });

  describe('generateTokens', () => {
    it('should generate stateless accessToken and refreshToken without DB persistence', async () => {
      const tokens = await service.generateTokens(mockUser);

      expect(tokens.accessToken).toBe('signed_token_for_1');
      expect(tokens.refreshToken).toBe('signed_token_for_1');
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);

      // Verify access payload
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: '1',
          clinicId: '10',
          email: 'sarah@citycare.com',
          username: 'sarah',
          role: UserRole.ADMIN,
          userType: 'clinic',
        }),
        expect.objectContaining({ secret: 'test_access_secret_key_123456' }),
      );

      // Verify refresh payload
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: '1',
          clinicId: '10',
          role: UserRole.ADMIN,
          userType: 'clinic',
          tokenType: 'clinic_refresh',
        }),
        expect.objectContaining({ secret: 'test_refresh_secret_key_123456' }),
      );
    });
  });

  describe('rotateRefreshToken', () => {
    const mockUserRepo = {
      findOne: vi.fn(),
    };

    it('should rotate valid refresh token cryptographically and verify active user', async () => {
      mockJwtService.verifyAsync.mockResolvedValueOnce({
        sub: '1',
        clinicId: '10',
        role: UserRole.ADMIN,
        userType: 'clinic',
        tokenType: 'clinic_refresh',
      });
      mockUserRepo.findOne.mockResolvedValueOnce(mockUser);

      const result = await service.rotateRefreshToken(
        'valid_token',
        mockUserRepo as any,
      );

      expect(result.tokens.accessToken).toBe('signed_token_for_1');
      expect(result.tokens.refreshToken).toBe('signed_token_for_1');
      expect(result.user).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if refresh token verification fails', async () => {
      mockJwtService.verifyAsync.mockRejectedValueOnce(new Error('Invalid signature'));

      await expect(
        service.rotateRefreshToken('invalid_token', mockUserRepo as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if payload tokenType is invalid', async () => {
      mockJwtService.verifyAsync.mockResolvedValueOnce({
        sub: '1',
        clinicId: '10',
        role: UserRole.ADMIN,
        userType: 'clinic',
        tokenType: 'wrong_type',
      });

      await expect(
        service.rotateRefreshToken('token', mockUserRepo as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is deactivated or deleted', async () => {
      mockJwtService.verifyAsync.mockResolvedValueOnce({
        sub: '1',
        clinicId: '10',
        role: UserRole.ADMIN,
        userType: 'clinic',
        tokenType: 'clinic_refresh',
      });
      mockUserRepo.findOne.mockResolvedValueOnce({ ...mockUser, isActive: false });

      await expect(
        service.rotateRefreshToken('token', mockUserRepo as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeRefreshToken', () => {
    it('should safely complete as a no-op in stateless mode', async () => {
      await expect(service.revokeRefreshToken('token')).resolves.toBeUndefined();
    });
  });
});
