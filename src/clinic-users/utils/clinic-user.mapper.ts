import { User } from '../../users/entities/user.entity.js';
import { UserRole } from '../../users/enums/user.enums.js';

export interface SafeClinicUserResponse {
  userId: string;
  clinicId: string;
  fullName: string;
  username: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
}

/**
 * Maps a User database entity to a SafeClinicUserResponse,
 * guaranteeing that sensitive fields (e.g. passwordHash) are never exposed.
 */
export function toSafeClinicUserResponse(user: User): SafeClinicUserResponse {
  return {
    userId: user.userId,
    clinicId: user.clinicId,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    createdAt: user.createdAt,
  };
}
