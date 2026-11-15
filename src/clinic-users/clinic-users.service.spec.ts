import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { vi, describe, beforeEach, it, expect } from 'vitest';
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

  const mockQueryBuilder = {
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    take: vi.fn().mockReturnThis(),
    getManyAndCount: vi.fn(),
  };

  const mockUserRepository = {
    findOne: vi.fn(),
    create: vi.fn().mockImplementation((dto) => ({
      userId: '100',
      createdAt: new Date(),
      ...dto,
    })),
    save: vi.fn().mockImplementation((user) => Promise.resolve(user)),
    softDelete: vi.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
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
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ userId: '98', email: 'john.doe@citycare.com' });

      await expect(
        service.create(mockAdminUser, validDto),
      ).rejects.toThrow(ConflictException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const mockUsersList = [
      {
        userId: '1',
        clinicId: '10',
        fullName: 'Dr. Sarah Thomas',
        username: 'sarah',
        email: 'sarah@citycare.com',
        phone: '+919876543210',
        role: UserRole.ADMIN,
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        passwordHash: 'secret_hash',
        createdAt: new Date(),
      },
      {
        userId: '2',
        clinicId: '10',
        fullName: 'Dr. John Doe',
        username: 'john.doe',
        email: 'john.doe@citycare.com',
        phone: null,
        role: UserRole.DOCTOR,
        isActive: true,
        isEmailVerified: false,
        isPhoneVerified: false,
        passwordHash: 'secret_hash_2',
        createdAt: new Date(),
      },
    ];

    it('should fetch paginated users scoped strictly to the caller clinic', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([mockUsersList, 2]);

      const result = await service.findAll(mockAdminUser, { page: 1, limit: 20 });

      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.clinicId = :clinicId', {
        clinicId: '10',
      });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);

      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      // Ensure passwordHash is never leaked
      expect((result.data[0] as any).passwordHash).toBeUndefined();
      expect((result.data[1] as any).passwordHash).toBeUndefined();
    });

    it('should apply role, isActive, and search filters when provided', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([[mockUsersList[1]], 1]);

      const result = await service.findAll(mockDoctorUser, {
        role: UserRole.DOCTOR,
        isActive: true,
        search: 'john',
        page: 2,
        limit: 10,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.role = :role', {
        role: UserRole.DOCTOR,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.isActive = :isActive', {
        isActive: true,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('LIKE :search'),
        expect.objectContaining({ search: '%john%' }),
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);

      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(2);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('findOne', () => {
    const mockUser = {
      userId: '5',
      clinicId: '10',
      fullName: 'Dr. Emily Stone',
      username: 'emily',
      email: 'emily@citycare.com',
      phone: '+919876543219',
      role: UserRole.DOCTOR,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      passwordHash: 'secret_hash',
      createdAt: new Date(),
    };

    it('should return safe staff profile when found within caller clinic', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);

      const result = await service.findOne(mockAdminUser, '5');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          userId: '5',
          clinicId: '10',
        },
      });
      expect(result.userId).toBe('5');
      expect(result.fullName).toBe('Dr. Emily Stone');
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('should throw NotFoundException if user does not exist or belongs to another clinic', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne(mockAdminUser, '999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const existingStaff = {
      userId: '5',
      clinicId: '10',
      fullName: 'Dr. Emily Stone',
      username: 'emily',
      email: 'emily@citycare.com',
      phone: '+919876543219',
      role: UserRole.DOCTOR,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      createdAt: new Date(),
    };

    it('should successfully update staff member when called by Admin', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ ...existingStaff });

      const result = await service.update(mockAdminUser, '5', {
        fullName: 'Dr. Emily Watson',
        role: UserRole.ADMIN,
        isActive: false,
      });

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '5',
          fullName: 'Dr. Emily Watson',
          role: UserRole.ADMIN,
          isActive: false,
        }),
      );
      expect(result.fullName).toBe('Dr. Emily Watson');
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should throw ForbiddenException if non-admin attempts to update', async () => {
      await expect(
        service.update(mockDoctorUser, '5', { fullName: 'Hacked Name' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if staff member not found in clinic', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.update(mockAdminUser, '999', { fullName: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if admin attempts self-deactivation', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        ...existingStaff,
        userId: '1', // Matches mockAdminUser.sub
      });

      await expect(
        service.update(mockAdminUser, '1', { isActive: false }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if admin attempts self-demotion from admin role', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        ...existingStaff,
        userId: '1',
      });

      await expect(
        service.update(mockAdminUser, '1', { role: UserRole.RECEPTIONIST }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    const staffToDelete = {
      userId: '7',
      clinicId: '10',
      fullName: 'Dr. Gregory House',
      username: 'house',
      isActive: true,
    };

    it('should successfully soft-delete staff member when called by Admin', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ ...staffToDelete });

      const result = await service.remove(mockAdminUser, '7');

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: '7', isActive: false }),
      );
      expect(mockUserRepository.softDelete).toHaveBeenCalledWith({
        userId: '7',
        clinicId: '10',
      });
      expect(result.message).toContain('deactivated successfully');
    });

    it('should throw ForbiddenException if non-admin attempts removal', async () => {
      await expect(service.remove(mockDoctorUser, '7')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if admin attempts to delete their own account', async () => {
      await expect(service.remove(mockAdminUser, '1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if staff member not found in clinic', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.remove(mockAdminUser, '999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('adminResetPassword', () => {
    const staffUser = {
      userId: '7',
      clinicId: '10',
      fullName: 'Dr. Gregory House',
      username: 'house',
      passwordHash: 'old_hash',
    };

    it('should successfully reset staff password when called by Admin', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ ...staffUser });

      const result = await service.adminResetPassword(mockAdminUser, '7', {
        newPassword: 'BrandNewPassword123!',
      });

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '7',
          passwordHash: expect.any(String),
        }),
      );
      expect(result.message).toContain('reset successfully');
    });

    it('should throw ForbiddenException if non-admin attempts password reset', async () => {
      await expect(
        service.adminResetPassword(mockDoctorUser, '7', {
          newPassword: 'BrandNewPassword123!',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if staff member not found in clinic', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.adminResetPassword(mockAdminUser, '999', {
          newPassword: 'BrandNewPassword123!',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
