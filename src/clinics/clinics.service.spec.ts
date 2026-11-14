import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { ClinicsService } from './clinics.service.js';
import { Clinic } from './entities/clinic.entity.js';
import { User } from '../users/entities/user.entity.js';
import { UserRole } from '../users/enums/user.enums.js';

describe('ClinicsService', () => {
  let service: ClinicsService;

  const mockClinicRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };

  const mockDataSource = {
    transaction: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicsService,
        {
          provide: getRepositoryToken(Clinic),
          useValue: mockClinicRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ClinicsService>(ClinicsService);
  });

  describe('generateUniqueSlug', () => {
    it('should generate a sanitized lowercase slug from name', async () => {
      mockClinicRepository.findOne.mockResolvedValueOnce(null);

      const slug = await service.generateUniqueSlug('Care Dental & Wellness Clinic!');
      expect(slug).toBe('care-dental-wellness-clinic');
    });

    it('should throw ConflictException if custom slug is already taken', async () => {
      mockClinicRepository.findOne.mockResolvedValueOnce({ clinicId: '1', slug: 'my-clinic' });

      await expect(
        service.generateUniqueSlug('Any Name', 'my-clinic'),
      ).rejects.toThrow(ConflictException);
    });

    it('should increment suffix when auto-generated slug conflicts', async () => {
      mockClinicRepository.findOne
        .mockResolvedValueOnce({ clinicId: '1', slug: 'apollo' })
        .mockResolvedValueOnce(null);

      const slug = await service.generateUniqueSlug('Apollo');
      expect(slug).toBe('apollo-1');
    });
  });

  describe('onboard', () => {
    it('should throw ConflictException if admin email already exists', async () => {
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          getRepository: (entity: any) => {
            if (entity === User) {
              return {
                findOne: vi.fn().mockResolvedValueOnce({ userId: '10', email: 'admin@clinic.com' }),
              };
            }
            return mockClinicRepository;
          },
        };
        return callback(mockManager);
      });

      await expect(
        service.onboard({
          clinic: {
            clinicName: 'Test Clinic',
            clinicPhone: '+919876543210',
          },
          admin: {
            fullName: 'Admin Name',
            username: 'admin.name',
            email: 'admin@clinic.com',
            password: 'Password123!',
          },
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create clinic and admin user within transaction', async () => {
      const mockSavedClinic = {
        clinicId: '1',
        clinicName: 'Test Clinic',
        slug: 'test-clinic',
        clinicPhone: '+919876543210',
        clinicEmail: 'clinic@test.com',
        address: '123 Test St',
        timezone: 'Asia/Kolkata',
        createdAt: new Date(),
      };

      const mockSavedAdmin = {
        userId: '1',
        fullName: 'Admin User',
        username: 'admin.user',
        email: 'admin@test.com',
        phone: '+919876543211',
        role: UserRole.ADMIN,
        createdAt: new Date(),
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          getRepository: (entity: any) => {
            if (entity === User) {
              return {
                findOne: vi.fn().mockResolvedValue(null),
                create: vi.fn().mockReturnValue(mockSavedAdmin),
                save: vi.fn().mockResolvedValue(mockSavedAdmin),
              };
            }
            return {
              findOne: vi.fn().mockResolvedValue(null),
              create: vi.fn().mockReturnValue(mockSavedClinic),
              save: vi.fn().mockResolvedValue(mockSavedClinic),
            };
          },
        };
        return callback(mockManager);
      });

      const result = await service.onboard({
        clinic: {
          clinicName: 'Test Clinic',
          clinicPhone: '+919876543210',
          clinicEmail: 'clinic@test.com',
          address: '123 Test St',
        },
        admin: {
          fullName: 'Admin User',
          username: 'admin.user',
          email: 'admin@test.com',
          phone: '+919876543211',
          password: 'Password123!',
        },
      });

      expect(result.message).toContain('success');
      expect(result.clinic.clinicName).toBe('Test Clinic');
      expect(result.admin.username).toBe('admin.user');
      expect(result.admin.email).toBe('admin@test.com');
      expect(result.admin.role).toBe(UserRole.ADMIN);
    });
  });

  describe('findBySlug', () => {
    it('should return clinic when found', async () => {
      const clinic = { clinicId: '1', slug: 'city-care' };
      mockClinicRepository.findOne.mockResolvedValueOnce(clinic);

      const result = await service.findBySlug('city-care');
      expect(result).toEqual(clinic);
    });

    it('should throw NotFoundException when slug does not exist', async () => {
      mockClinicRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.findBySlug('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
