import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  phone: string;
  role: 'patient';
}

export interface PatientRefreshJwtPayload {
  sub: string;
  phone: string;
  role: 'patient';
  tokenType: 'patient_refresh';
}

@Injectable()
export class TokenService {
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
      this.configService.get<string>('jwt.refreshExpiration') ?? '30d';

    if (!this.accessSecret || !this.refreshSecret) {
      throw new InternalServerErrorException(
        'JWT secrets are not properly configured',
      );
    }
  }

  /**
   * Pure Stateless JWT Generation:
   * Generates both Access Token (15m) and Refresh Token (30d) for a patient.
   * Both tokens are signed cryptographically and returned to be delivered via HttpOnly cookies / response.
   * No tokens are persisted in the database.
   */
  async generateTokens(phone: string): Promise<TokenPair> {
    const accessPayload: JwtPayload = {
      sub: phone,
      phone,
      role: 'patient',
    };

    const refreshPayload: PatientRefreshJwtPayload = {
      sub: phone,
      phone,
      role: 'patient',
      tokenType: 'patient_refresh',
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
   * 2. Confirms role and tokenType match expected patient refresh payload.
   * 3. Issues and returns a brand-new token pair.
   */
  async rotateRefreshToken(rawRefreshToken: string): Promise<TokenPair> {
    let payload: PatientRefreshJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<PatientRefreshJwtPayload>(
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
      payload.role !== 'patient' ||
      payload.tokenType !== 'patient_refresh' ||
      !payload.phone
    ) {
      throw new UnauthorizedException('Invalid refresh token type');
    }

    return this.generateTokens(payload.phone);
  }

  /**
   * Revokes a refresh token on Logout.
   * In a pure stateless JWT architecture, the session is invalidated by clearing the client HttpOnly cookie.
   */
  async revokeRefreshToken(_rawRefreshToken: string): Promise<void> {
    // Pure stateless JWT: invalidated by clearing the HttpOnly cookie
  }
}
