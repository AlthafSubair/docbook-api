import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
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
});
