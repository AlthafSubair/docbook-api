import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { UserRole } from '../../users/enums/user.enums.js';

export interface ClinicTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ClinicJwtPayload {
  sub: string;
  clinicId: string;
  email: string;
  username: string;
  role: UserRole;
  userType: 'clinic';
}

export interface ClinicRefreshJwtPayload {
  sub: string;
  clinicId: string;
  role: UserRole;
  userType: 'clinic';
  tokenType: 'clinic_refresh';
}

@Injectable()
export class ClinicTokenService {
  private readonly accessSecret: string;
  private readonly accessExpiration: string;
  private readonly refreshSecret: string;
  private readonly refreshExpiration: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecret =
      this.configService.get<string>('jwt.accessSecret') ?? '';
    this.accessExpiration =
      this.configService.get<string>('jwt.accessExpiration') ?? '15m';
    this.refreshSecret =
      this.configService.get<string>('jwt.refreshSecret') ?? '';
    this.refreshExpiration =
      this.configService.get<string>('jwt.refreshExpiration') ?? '7d';

    if (!this.accessSecret || !this.refreshSecret) {
      throw new InternalServerErrorException(
        'JWT secrets are not properly configured',
      );
    }
  }

  /**
   * Pure Stateless JWT Generation:
   * Generates both Access Token (15m) and Refresh Token (7d) for a clinic staff user.
   * Both tokens are signed cryptographically and returned to be delivered via HttpOnly cookies / response.
   * No tokens are persisted in the database.
   */
  async generateTokens(user: User): Promise<ClinicTokenPair> {
    const accessPayload: ClinicJwtPayload = {
      sub: user.userId,
      clinicId: user.clinicId,
      email: user.email,
      username: user.username,
      role: user.role,
      userType: 'clinic',
    };

    const refreshPayload: ClinicRefreshJwtPayload = {
      sub: user.userId,
      clinicId: user.clinicId,
      role: user.role,
      userType: 'clinic',
      tokenType: 'clinic_refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.accessSecret,
        expiresIn: this.accessExpiration as any,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiration as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Pure Stateless Refresh Token Verification & Rotation:
   * 1. Cryptographically verifies JWT signature and expiry.
   * 2. Validates payload claims (clinic type, clinicId, sub).
   * 3. Confirms user account and clinic are active in PostgreSQL.
   * 4. Issues and returns brand-new access + refresh tokens.
   */
  async rotateRefreshToken(
    rawRefreshToken: string,
    userRepo: Repository<User>,
  ): Promise<{ tokens: ClinicTokenPair; user: User }> {
    let payload: ClinicRefreshJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<ClinicRefreshJwtPayload>(
        rawRefreshToken,
        {
          secret: this.refreshSecret,
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (
      !payload ||
      payload.userType !== 'clinic' ||
      payload.tokenType !== 'clinic_refresh' ||
      !payload.sub ||
      !payload.clinicId
    ) {
      throw new UnauthorizedException('Invalid clinic refresh token');
    }

    const user = await userRepo.findOne({
      where: { userId: payload.sub, clinicId: payload.clinicId },
      relations: { clinic: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'User account not found or deactivated',
      );
    }

    if (user.clinic && !user.clinic.isActive) {
      throw new UnauthorizedException(
        'Clinic account is currently inactive.',
      );
    }

    // Issue fresh token pair
    const tokens = await this.generateTokens(user);

    return { tokens, user };
  }

  /**
   * Revokes a refresh token on Logout.
   * In a pure stateless JWT architecture, the session is invalidated by clearing the client HttpOnly cookie.
   */
  async revokeRefreshToken(_rawRefreshToken: string): Promise<void> {
    // Pure stateless JWT: invalidated by clearing the HttpOnly cookie
  }
}
