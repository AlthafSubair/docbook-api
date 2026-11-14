import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import { ClinicAuthService } from './clinic-auth.service.js';
import { ClinicTokenService } from './clinic-token.service.js';
import { User } from '../../users/entities/user.entity.js';
import { Clinic } from '../../clinics/entities/clinic.entity.js';
import { UserRole } from '../../users/enums/user.enums.js';

describe('ClinicAuthService', () => {
  let service: ClinicAuthService;

  const mockUser: User = {
    userId: '1',
    clinicId: '10',
    fullName: 'Dr. Sarah Thomas',
    username: 'sarah',
    email: 'sarah@citycare.com',
    passwordHash: '',
    role: UserRole.ADMIN,
    phone: '+919876543210',
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    clinic: {
      clinicId: '10',
      clinicName: 'City Care Dental Clinic',
      slug: 'city-care',
      clinicPhone: '+919876543210',
      clinicEmail: 'contact@citycare.com',
      address: '123 Health Ave',
      latitude: null,
      longitude: null,
      timezone: 'Asia/Kolkata',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  };

  const mockUserRepository = {
    findOne: vi.fn(),
  };

  const mockClinicRepository = {
    findOne: vi.fn(),
  };

  const mockClinicTokenService = {
    generateTokens: vi.fn().mockResolvedValue({
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
    }),
    rotateRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUser.passwordHash = await bcrypt.hash('CorrectPassword123!', 10);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicAuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Clinic),
          useValue: mockClinicRepository,
        },
        {
          provide: ClinicTokenService,
          useValue: mockClinicTokenService,
        },
      ],
    }).compile();

    service = module.get<ClinicAuthService>(ClinicAuthService);
  });

  describe('login', () => {
    it('should successfully log in via Email (Global Fallback)', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);

      const result = await service.login({
        identifier: 'sarah@citycare.com',
        password: 'CorrectPassword123!',
      });

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'sarah@citycare.com' },
        relations: { clinic: true },
      });
      expect(result.tokens.accessToken).toBe('mock_access_token');
      expect(result.user.username).toBe('sarah');
      expect(result.clinic.slug).toBe('city-care');
    });

    it('should successfully log in via Username + x-clinic-slug header', async () => {
      mockClinicRepository.findOne.mockResolvedValueOnce(mockUser.clinic);
      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);

      const result = await service.login(
        {
          identifier: 'sarah',
          password: 'CorrectPassword123!',
        },
        'city-care',
      );

      expect(mockClinicRepository.findOne).toHaveBeenCalledWith({
        where: { slug: 'city-care' },
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { clinicId: '10', username: 'sarah' },
        relations: { clinic: true },
      });
      expect(result.tokens.accessToken).toBe('mock_access_token');
    });

    it('should throw BadRequestException if logging in with username without x-clinic-slug header', async () => {
      await expect(
        service.login({
          identifier: 'sarah',
          password: 'CorrectPassword123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);

      await expect(
        service.login({
          identifier: 'sarah@citycare.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is inactive', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        ...mockUser,
        isActive: false,
      });

      await expect(
        service.login({
          identifier: 'sarah@citycare.com',
          password: 'CorrectPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('checkUsernameAvailability', () => {
    it('should return available: true when username does not exist in clinic', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      const result = await service.checkUsernameAvailability('10', 'reception2');
      expect(result.available).toBe(true);
      expect(result.username).toBe('reception2');
    });

    it('should return available: false when username exists in clinic', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ userId: '2' });

      const result = await service.checkUsernameAvailability('10', 'sarah');
      expect(result.available).toBe(false);
    });
  });

  describe('getMe', () => {
    it('should return user profile details', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);

      const result = await service.getMe('1');
      expect(result.userId).toBe('1');
      expect(result.username).toBe('sarah');
      expect(result.clinic?.clinicName).toBe('City Care Dental Clinic');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.getMe('999')).rejects.toThrow(NotFoundException);
    });
  });
});
