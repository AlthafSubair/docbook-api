import { ConflictException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { Clinic } from '../../clinics/entities/clinic.entity.js';

/**
 * Converts a string into a clean, URL-friendly slug.
 * Example: "City Care & Dental Clinic!" -> "city-care-dental-clinic"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates a unique clinic slug.
 * - If a custom slug is provided, validates that it is not already taken.
 * - If auto-generating, slugifies the clinic name and increments suffix (-1, -2, etc.) until unique.
 */
export async function generateUniqueClinicSlug(
  clinicRepo: Repository<Clinic>,
  name: string,
  customSlug?: string,
): Promise<string> {
  if (customSlug) {
    const normalizedCustom = customSlug.toLowerCase().trim();
    const existing = await clinicRepo.findOne({
      where: { slug: normalizedCustom },
    });

    if (existing) {
      throw new ConflictException(
        `Clinic slug '${normalizedCustom}' is already taken. Please choose another slug.`,
      );
    }

    return normalizedCustom;
  }

  const baseSlug = slugify(name) || 'clinic';
  let candidateSlug = baseSlug;
  let counter = 1;

  while (await clinicRepo.findOne({ where: { slug: candidateSlug } })) {
    candidateSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return candidateSlug;
}
