import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

/**
 * Generates a cryptographically secure numeric OTP of the specified digit length.
 * Default is 6 digits (100000 - 999999).
 */
export function generateOtpCode(digits = 6): string {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits;
  return randomInt(min, max).toString();
}

/**
 * Creates an HMAC-SHA256 hex digest using a secret key.
 * Used for securely hashing OTPs and refresh tokens before database storage.
 */
export function hashWithSecret(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('hex');
}

/**
 * Constant-time comparison to prevent side-channel timing attacks.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf-8');
  const bufferB = Buffer.from(b, 'utf-8');

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}

