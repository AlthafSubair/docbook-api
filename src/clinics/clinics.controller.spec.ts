import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { ClinicsController } from './clinics.controller.js';
import { ClinicsService } from './clinics.service.js';
import { UserRole } from '../users/enums/user.enums.js';
import type { ClinicJwtPayload } from '../auth/services/clinic-token.service.js';

describe('ClinicsController', () => {
  let controller: ClinicsController;
  let clinicsService: ClinicsService;

  const mockClinic = {
    clinicId: '10',
    clinicName: 'City Care Dental Clinic',
    slug: 'city-care-dental',
    clinicPhone: '+919876543210',
    clinicEmail: 'contact@citycare.com',
    address: '123 Health Ave',
    timezone: 'Asia/Kolkata',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockClinicsService = {
    onboard: vi.fn(),
    findBySlug: vi.fn(),
    findOne: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
  };

  const mockStaffUser: ClinicJwtPayload = {
    sub: '1',
    clinicId: '10',
    email: 'doctor@citycare.com',
    username: 'dr.smith',
    role: UserRole.DOCTOR,
    userType: 'clinic',
  };

  const mockAdminUser: ClinicJwtPayload = {
    sub: '2',
    clinicId: '10',
    email: 'admin@citycare.com',
    username: 'admin.smith',
    role: UserRole.ADMIN,
    userType: 'clinic',
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicsController],
      providers: [
        {
          provide: ClinicsService,
          useValue: mockClinicsService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue('docbook_admin_super_secret_key_dev_2026'),
          },
        },
      ],
    }).compile();

    controller = module.get<ClinicsController>(ClinicsController);
    clinicsService = module.get<ClinicsService>(ClinicsService);
  });

  describe('getMe', () => {
    it('should return caller clinic profile using currentUser.clinicId', async () => {
      mockClinicsService.findOne.mockResolvedValueOnce(mockClinic);

      const result = await controller.getMe(mockStaffUser);

      expect(clinicsService.findOne).toHaveBeenCalledWith('10');
      expect(result).toEqual(mockClinic);
    });
  });

  describe('updateMe', () => {
    it('should allow Clinic Admin to update own clinic settings', async () => {
      const updateDto = {
        clinicPhone: '+919876543299',
        address: '456 Healthcare Blvd',
      };
      const updatedClinic = { ...mockClinic, ...updateDto };
      mockClinicsService.update.mockResolvedValueOnce(updatedClinic);

      const result = await controller.updateMe(mockAdminUser, updateDto);

      expect(clinicsService.update).toHaveBeenCalledWith('10', updateDto);
      expect(result).toEqual(updatedClinic);
    });

    it('should throw ForbiddenException if caller is not a clinic admin', async () => {
      const updateDto = { clinicPhone: '+919876543299' };

      await expect(
        controller.updateMe(mockStaffUser, updateDto),
      ).rejects.toThrow(ForbiddenException);

      expect(clinicsService.update).not.toHaveBeenCalled();
    });
  });

  describe('onboard', () => {
    it('should onboard a new clinic and admin', async () => {
      const onboardDto = {
        clinic: { clinicName: 'New Clinic', clinicPhone: '+919876543210' },
        admin: { fullName: 'Admin', username: 'admin', email: 'a@c.com', password: 'P1!' },
      };
      mockClinicsService.onboard.mockResolvedValueOnce({ clinic: mockClinic });

      const result = await controller.onboard(onboardDto as any);

      expect(clinicsService.onboard).toHaveBeenCalledWith(onboardDto);
      expect(result).toEqual({ clinic: mockClinic });
    });
  });

  describe('getBySlug', () => {
    it('should return clinic profile by slug', async () => {
      mockClinicsService.findBySlug.mockResolvedValueOnce(mockClinic);

      const result = await controller.getBySlug('city-care-dental');

      expect(clinicsService.findBySlug).toHaveBeenCalledWith('city-care-dental');
      expect(result).toEqual(mockClinic);
    });
  });

  describe('findAll', () => {
    it('should return list of all clinics', async () => {
      mockClinicsService.findAll.mockResolvedValueOnce([mockClinic]);

      const result = await controller.findAll();

      expect(clinicsService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockClinic]);
    });
  });

  describe('findOne', () => {
    it('should return a clinic by ID', async () => {
      mockClinicsService.findOne.mockResolvedValueOnce(mockClinic);

      const result = await controller.findOne('10');

      expect(clinicsService.findOne).toHaveBeenCalledWith('10');
      expect(result).toEqual(mockClinic);
    });
  });

  describe('update (Platform Admin)', () => {
    it('should update clinic by ID', async () => {
      const updateDto = { clinicPhone: '+919876543299' };
      const updatedClinic = { ...mockClinic, ...updateDto };
      mockClinicsService.update.mockResolvedValueOnce(updatedClinic);

      const result = await controller.update('10', updateDto);

      expect(clinicsService.update).toHaveBeenCalledWith('10', updateDto);
      expect(result).toEqual(updatedClinic);
    });
  });
});
