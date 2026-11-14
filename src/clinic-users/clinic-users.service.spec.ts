import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import { ClinicUsersService } from './clinic-users.service.js';
import { User } from '../users/entities/user.entity.js';
import { UserRole } from '../users/enums/user.enums.js';
import type { ClinicJwtPayload } from '../auth/services/clinic-token.service.js';

describe('ClinicUsersService', () => {
  let service: ClinicUsersService;

  const mockAdminUser: ClinicJwtPayload = {
    sub: '1',
    clinicId: '10',
    email: 'admin@citycare.com',
    username: 'admin',
    role: UserRole.ADMIN,
    userType: 'clinic',
  };

  const mockDoctorUser: ClinicJwtPayload = {
    sub: '2',
    clinicId: '10',
    email: 'doctor@citycare.com',
    username: 'dr.smith',
    role: UserRole.DOCTOR,
    userType: 'clinic',
  };

  const mockUserRepository = {
    findOne: vi.fn(),
    create: vi.fn().mockImplementation((dto) => ({
      userId: '100',
      createdAt: new Date(),
      ...dto,
    })),
    save: vi.fn().mockImplementation((user) => Promise.resolve(user)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicUsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<ClinicUsersService>(ClinicUsersService);
  });

  describe('create', () => {
    const validDto = {
      fullName: 'Dr. John Doe',
      username: 'john.doe',
      email: 'john.doe@citycare.com',
      phone: '+919876543210',
      role: UserRole.DOCTOR,
      password: 'SecurePassword123!',
    };

    it('should successfully create a new staff user when called by an Admin', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.create(mockAdminUser, validDto);

      expect(result.userId).toBe('100');
      expect(result.clinicId).toBe('10');
      expect(result.fullName).toBe('Dr. John Doe');
      expect(result.username).toBe('john.doe');
      expect(result.email).toBe('john.doe@citycare.com');
      expect(result.role).toBe(UserRole.DOCTOR);
      expect((result as any).passwordHash).toBeUndefined();

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          clinicId: '10',
          fullName: 'Dr. John Doe',
          username: 'john.doe',
          email: 'john.doe@citycare.com',
          role: UserRole.DOCTOR,
          isActive: true,
        }),
      );
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if non-admin attempts to create a user', async () => {
      await expect(
        service.create(mockDoctorUser, validDto),
      ).rejects.toThrow(ForbiddenException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if username is already taken in caller clinic', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ userId: '99', username: 'john.doe' });

      await expect(
        service.create(mockAdminUser, validDto),
      ).rejects.toThrow(ConflictException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if email is already registered globally', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(null) // username check passes
        .mockResolvedValueOnce({ userId: '98', email: 'john.doe@citycare.com' }); // email check conflicts

      await expect(
        service.create(mockAdminUser, validDto),
      ).rejects.toThrow(ConflictException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });
});
