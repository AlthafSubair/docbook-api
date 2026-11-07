import {
  parsePhoneNumberWithError,
  type CountryCode,
  ParseError,
} from 'libphonenumber-js';
import { BadRequestException } from '@nestjs/common';

/**
 * Validates and normalizes country + local number into E.164 standard format.
 * Example: ("IN", "9876543210") -> "+919876543210"
 */
export function normalizePhoneNumber(country: string, number: string): string {
  try {
    const parsed = parsePhoneNumberWithError(number, country as CountryCode);

    if (!parsed.isValid()) {
      throw new BadRequestException(
        `The phone number provided is not valid for country ${country}`,
      );
    }

    return parsed.format('E.164');
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }

    if (error instanceof ParseError) {
      throw new BadRequestException(
        `Invalid phone number for country ${country}: ${error.message}`,
      );
    }

    throw new BadRequestException(
      `Unable to parse phone number for country ${country}. Please verify the number.`,
    );
  }
}

