import { ConflictException } from '@nestjs/common';
import { describe, it, expect, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { slugify, generateUniqueClinicSlug } from './slug.util.js';
import type { Clinic } from '../../clinics/entities/clinic.entity.js';

describe('slug.util', () => {
  describe('slugify', () => {
    it('should convert strings to lowercase hyphenated slugs', () => {
      expect(slugify('Care Dental & Wellness Clinic!')).toBe('care-dental-wellness-clinic');
      expect(slugify('  Multi   Space   Name  ')).toBe('multi-space-name');
      expect(slugify('Special@#$Characters---Here')).toBe('special-characters-here');
    });
  });

  describe('generateUniqueClinicSlug', () => {
    const mockRepo = {
      findOne: vi.fn(),
    } as unknown as Repository<Clinic>;

    it('should generate a sanitized lowercase slug from name', async () => {
      vi.mocked(mockRepo.findOne).mockResolvedValueOnce(null);

      const slug = await generateUniqueClinicSlug(mockRepo, 'Care Dental & Wellness Clinic!');
      expect(slug).toBe('care-dental-wellness-clinic');
    });

    it('should throw ConflictException if custom slug is already taken', async () => {
      vi.mocked(mockRepo.findOne).mockResolvedValueOnce({
        clinicId: '1',
        slug: 'my-clinic',
      } as Clinic);

      await expect(
        generateUniqueClinicSlug(mockRepo, 'Any Name', 'my-clinic'),
      ).rejects.toThrow(ConflictException);
    });

    it('should increment suffix when auto-generated slug conflicts', async () => {
      vi.mocked(mockRepo.findOne)
        .mockResolvedValueOnce({ clinicId: '1', slug: 'apollo' } as Clinic)
        .mockResolvedValueOnce(null);

      const slug = await generateUniqueClinicSlug(mockRepo, 'Apollo');
      expect(slug).toBe('apollo-1');
    });
  });
});
