import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity.js';
import { UserRole } from '../users/enums/user.enums.js';
import { CreateClinicUserDto } from './dto/create-clinic-user.dto.js';
import type { ClinicJwtPayload } from '../auth/services/clinic-token.service.js';

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

@Injectable()
export class ClinicUsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Creates a new staff member within the caller's clinic organization.
   * Only clinic administrators can perform this action.
   */
  async create(
    currentUser: ClinicJwtPayload,
    dto: CreateClinicUserDto,
  ): Promise<SafeClinicUserResponse> {
    // 1. Authorization: Only clinic Admins can add staff members
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only clinic administrators are authorized to add staff members.',
      );
    }

    const normalizedUsername = dto.username.toLowerCase().trim();
    const normalizedEmail = dto.email.toLowerCase().trim();

    // 2. Check for duplicate username within the caller's clinic
    const existingUsername = await this.userRepository.findOne({
      where: {
        clinicId: currentUser.clinicId,
        username: normalizedUsername,
      },
    });

    if (existingUsername) {
      throw new ConflictException(
        `Username '${normalizedUsername}' is already taken in this clinic.`,
      );
    }

    // 3. Check for duplicate email globally across users
    const existingEmail = await this.userRepository.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingEmail) {
      throw new ConflictException(
        `Email '${normalizedEmail}' is already registered in DocBook.`,
      );
    }

    // 4. Hash password securely
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 5. Create and persist user entity
    const user = this.userRepository.create({
      clinicId: currentUser.clinicId,
      fullName: dto.fullName.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      phone: dto.phone?.trim() ?? null,
      role: dto.role,
      passwordHash,
      isActive: true,
      isEmailVerified: false,
      isPhoneVerified: false,
    });

    const savedUser = await this.userRepository.save(user);

    // 6. Return safe representation without passwordHash
    return {
      userId: savedUser.userId,
      clinicId: savedUser.clinicId,
      fullName: savedUser.fullName,
      username: savedUser.username,
      email: savedUser.email,
      phone: savedUser.phone,
      role: savedUser.role,
      isActive: savedUser.isActive,
      isEmailVerified: savedUser.isEmailVerified,
      isPhoneVerified: savedUser.isPhoneVerified,
      createdAt: savedUser.createdAt,
    };
  }
}
