import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { User } from '../../users/entities/user.entity.js';
import { Clinic } from '../../clinics/entities/clinic.entity.js';
import { ClinicTokenService, ClinicTokenPair } from './clinic-token.service.js';
import { ClinicLoginDto } from '../dto/clinic-login.dto.js';

export interface ClinicLoginResponse {
  tokens: ClinicTokenPair;
  user: {
    userId: string;
    clinicId: string;
    fullName: string;
    username: string;
    email: string;
    role: string;
  };
  clinic: {
    clinicId: string;
    clinicName: string;
    slug: string;
    timezone: string;
  };
}

@Injectable()
export class ClinicAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
    private readonly clinicTokenService: ClinicTokenService,
  ) {}

  /**
   * Authenticates a clinic staff member.
   * Supports two identification methods:
   * 1. Global Email Fallback: If identifier contains '@', performs a global lookup without requiring clinicSlug.
   * 2. Scoped Username: Looks up the clinic first via clinicSlug, then scopes the username to that clinic.
   */
  async login(
    dto: ClinicLoginDto,
    headerClinicSlug?: string,
  ): Promise<ClinicLoginResponse> {
    const identifier = dto.identifier.toLowerCase().trim();
    const isEmail = identifier.includes('@');

    let user: User | null = null;

    if (isEmail) {
      // 1. Global Email Fallback
      user = await this.userRepository.findOne({
        where: { email: identifier },
        relations: { clinic: true },
      });
    } else {
      // 2. Scoped Username via x-clinic-slug header or dto.clinicSlug
      const slug = (headerClinicSlug || dto.clinicSlug)?.toLowerCase().trim();

      if (!slug) {
        throw new BadRequestException(
          'Clinic slug is required when logging in with a username (provide via x-clinic-slug header or clinicSlug field). Alternatively, log in using your email address.',
        );
      }

      const clinic = await this.clinicRepository.findOne({
        where: { slug },
      });

      if (!clinic) {
        throw new UnauthorizedException('Invalid credentials');
      }

      user = await this.userRepository.findOne({
        where: { clinicId: clinic.clinicId, username: identifier },
        relations: { clinic: true },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account status
    if (!user.isActive) {
      throw new UnauthorizedException(
        'Account is deactivated. Please contact your clinic administrator.',
      );
    }

    // Check clinic status
    if (user.clinic && !user.clinic.isActive) {
      throw new UnauthorizedException(
        'Clinic account is currently inactive.',
      );
    }

    // Generate tokens
    const tokens = await this.clinicTokenService.generateTokens(user);

    return {
      tokens,
      user: {
        userId: user.userId,
        clinicId: user.clinicId,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      clinic: {
        clinicId: user.clinic?.clinicId ?? user.clinicId,
        clinicName: user.clinic?.clinicName ?? '',
        slug: user.clinic?.slug ?? '',
        timezone: user.clinic?.timezone ?? 'Asia/Kolkata',
      },
    };
  }

  /**
   * Refreshes a clinic staff session via single-use token rotation.
   */
  async refreshToken(rawRefreshToken: string) {
    const { tokens, user } = await this.clinicTokenService.rotateRefreshToken(
      rawRefreshToken,
      this.userRepository,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        userId: user.userId,
        clinicId: user.clinicId,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      clinic: {
        clinicId: user.clinic?.clinicId ?? user.clinicId,
        clinicName: user.clinic?.clinicName ?? '',
        slug: user.clinic?.slug ?? '',
        timezone: user.clinic?.timezone ?? 'Asia/Kolkata',
      },
    };
  }

  /**
   * Revokes a clinic staff refresh token on logout.
   */
  async logout(rawRefreshToken: string): Promise<void> {
    await this.clinicTokenService.revokeRefreshToken(rawRefreshToken);
  }

  /**
   * Fetches profile details for the currently authenticated clinic staff member.
   */
  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: { clinic: true },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      userId: user.userId,
      clinicId: user.clinicId,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      createdAt: user.createdAt,
      clinic: user.clinic
        ? {
            clinicId: user.clinic.clinicId,
            clinicName: user.clinic.clinicName,
            slug: user.clinic.slug,
            clinicPhone: user.clinic.clinicPhone,
            clinicEmail: user.clinic.clinicEmail,
            address: user.clinic.address,
            timezone: user.clinic.timezone,
          }
        : null,
    };
  }

  /**
   * Checks whether a username is already taken within a specific clinic.
   * Useful for debounced frontend form validation when clinic admins add staff.
   */
  async checkUsernameAvailability(
    clinicId: string,
    username: string,
  ): Promise<{ username: string; available: boolean }> {
    const normalized = username.toLowerCase().trim();
    const existing = await this.userRepository.findOne({
      where: { clinicId, username: normalized },
    });

    return {
      username: normalized,
      available: !existing,
    };
  }
}
