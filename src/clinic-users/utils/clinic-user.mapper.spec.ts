import { describe, it, expect } from 'vitest';
import { toSafeClinicUserResponse } from './clinic-user.mapper.js';
import { UserRole } from '../../users/enums/user.enums.js';
import { User } from '../../users/entities/user.entity.js';

describe('toSafeClinicUserResponse mapper', () => {
  it('should map User entity to SafeClinicUserResponse and exclude passwordHash', () => {
    const mockUser: User = {
      userId: '42',
      clinicId: '10',
      fullName: 'Dr. Gregory House',
      username: 'house.md',
      email: 'house@princeton.org',
      phone: '+919876543210',
      role: UserRole.DOCTOR,
      passwordHash: 'super_secret_argon_or_bcrypt_hash',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      deletedAt: null,
    };

    const safe = toSafeClinicUserResponse(mockUser);

    expect(safe).toEqual({
      userId: '42',
      clinicId: '10',
      fullName: 'Dr. Gregory House',
      username: 'house.md',
      email: 'house@princeton.org',
      phone: '+919876543210',
      role: UserRole.DOCTOR,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect((safe as any).passwordHash).toBeUndefined();
    expect((safe as any).deletedAt).toBeUndefined();
  });
});
