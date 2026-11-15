import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity.js';
import { UserRole } from '../users/enums/user.enums.js';
import { CreateClinicUserDto } from './dto/create-clinic-user.dto.js';
import { UpdateClinicUserDto } from './dto/update-clinic-user.dto.js';
import { QueryClinicUsersDto } from './dto/query-clinic-users.dto.js';
import { paginateQueryBuilder } from '../common/utils/pagination.util.js';
import {
  toSafeClinicUserResponse,
  type SafeClinicUserResponse,
} from './utils/clinic-user.mapper.js';
import type { PaginatedResponse } from '../common/interfaces/paginated-response.interface.js';
import type { ClinicJwtPayload } from '../auth/services/clinic-token.service.js';

export type { SafeClinicUserResponse };

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
    return toSafeClinicUserResponse(savedUser);
  }

  /**
   * Fetches paginated staff members belonging strictly to the caller's clinic.
   * Utilizes the global paginateQueryBuilder utility for consistent pagination metadata.
   */
  async findAll(
    currentUser: ClinicJwtPayload,
    query: QueryClinicUsersDto,
  ): Promise<PaginatedResponse<SafeClinicUserResponse>> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.clinicId = :clinicId', { clinicId: currentUser.clinicId });

    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(user.fullName) LIKE :search OR LOWER(user.username) LIKE :search OR LOWER(user.email) LIKE :search OR user.phone LIKE :rawSearch)',
        {
          search: `%${query.search.toLowerCase()}%`,
          rawSearch: `%${query.search}%`,
        },
      );
    }

    qb.orderBy('user.createdAt', 'DESC');

    return paginateQueryBuilder(qb, query, toSafeClinicUserResponse);
  }

  /**
   * Fetches a single staff member by ID within the caller's clinic organization.
   */
  async findOne(
    currentUser: ClinicJwtPayload,
    userId: string,
  ): Promise<SafeClinicUserResponse> {
    const user = await this.userRepository.findOne({
      where: {
        userId,
        clinicId: currentUser.clinicId,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `Staff member with ID '${userId}' not found in this clinic.`,
      );
    }

    return toSafeClinicUserResponse(user);
  }

  /**
   * Updates an existing staff member's profile or status.
   * Only clinic administrators can update staff roles or active status.
   * Admins cannot deactivate themselves or revoke their own admin role.
   */
  async update(
    currentUser: ClinicJwtPayload,
    userId: string,
    dto: UpdateClinicUserDto,
  ): Promise<SafeClinicUserResponse> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only clinic administrators are authorized to update staff members.',
      );
    }

    const user = await this.userRepository.findOne({
      where: {
        userId,
        clinicId: currentUser.clinicId,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `Staff member with ID '${userId}' not found in this clinic.`,
      );
    }

    // Safety guard: Admin cannot deactivate their own account or remove their own admin role
    if (currentUser.sub === userId) {
      if (dto.isActive === false) {
        throw new BadRequestException(
          'Administrators cannot deactivate their own account.',
        );
      }
      if (dto.role && dto.role !== UserRole.ADMIN) {
        throw new BadRequestException(
          'Administrators cannot revoke their own administrator role.',
        );
      }
    }

    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName.trim();
    }
    if (dto.phone !== undefined) {
      user.phone = dto.phone.trim();
    }
    if (dto.role !== undefined) {
      user.role = dto.role;
    }
    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }

    const updated = await this.userRepository.save(user);
    return toSafeClinicUserResponse(updated);
  }

  /**
   * Deactivates and soft-deletes a clinic staff member.
   * Only clinic administrators can delete staff. Admins cannot delete themselves.
   */
  async remove(
    currentUser: ClinicJwtPayload,
    userId: string,
  ): Promise<{ message: string }> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only clinic administrators are authorized to remove staff members.',
      );
    }

    if (currentUser.sub === userId) {
      throw new BadRequestException(
        'Administrators cannot delete their own account.',
      );
    }

    const user = await this.userRepository.findOne({
      where: {
        userId,
        clinicId: currentUser.clinicId,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `Staff member with ID '${userId}' not found in this clinic.`,
      );
    }

    // Mark inactive and soft-delete
    user.isActive = false;
    await this.userRepository.save(user);
    await this.userRepository.softDelete({
      userId,
      clinicId: currentUser.clinicId,
    });

    return {
      message: `Staff member '${user.fullName}' (${user.username}) deactivated successfully.`,
    };
  }
}
