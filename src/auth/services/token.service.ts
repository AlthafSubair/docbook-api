import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientRefreshToken } from '../entities/patient-refresh-token.entity.js';
import { hashWithSecret } from '../../common/utils/crypto.util.js';
import { calculateExpiryDate } from '../../common/utils/date.util.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  phone: string;
  role: 'patient';
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
    @InjectRepository(PatientRefreshToken)
    private readonly refreshTokenRepository: Repository<PatientRefreshToken>,
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
   * Generates both Access Token (15m) and Refresh Token (30d),
   * securely hashes the refresh token, stores it in PostgreSQL,
   * and returns the plain token pair to the client.
   */
  async generateTokens(phone: string): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: phone,
      phone,
      role: 'patient',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.accessSecret,
        expiresIn: this.accessExpiration as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiration as any,
      }),
    ]);

    const tokenHash = hashWithSecret(refreshToken, this.refreshSecret);
    const expiresAt = calculateExpiryDate(this.refreshExpiration);

    const tokenRecord = this.refreshTokenRepository.create({
      phone,
      tokenHash,
      expiresAt,
      isRevoked: false,
    });

    await this.refreshTokenRepository.save(tokenRecord);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Rotates a refresh token:
   * 1. Cryptographically verifies JWT signature.
   * 2. Checks token hash against database.
   * 3. Detects reuse attacks: if a revoked token is presented, revokes ALL sessions for that phone.
   * 4. Revokes the old token and issues a brand-new access + refresh token pair.
   */
  async rotateRefreshToken(rawRefreshToken: string): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(rawRefreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = hashWithSecret(rawRefreshToken, this.refreshSecret);

    const record = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
    });

    if (!record) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Reuse detection: If token was already revoked, someone is trying to reuse an old or stolen token!
    if (record.isRevoked) {
      // Invalidate all tokens for this phone as a security precaution
      await this.refreshTokenRepository.update(
        { phone: payload.phone, isRevoked: false },
        { isRevoked: true },
      );
      throw new UnauthorizedException(
        'Compromised session detected. All sessions revoked. Please log in again.',
      );
    }

    if (new Date() > record.expiresAt) {
      throw new UnauthorizedException(
        'Refresh token has expired. Please log in again.',
      );
    }

    // Revoke the old token (single-use rotation)
    record.isRevoked = true;
    await this.refreshTokenRepository.save(record);

    // Issue fresh token pair
    return this.generateTokens(record.phone);
  }

  /**
   * Revokes a refresh token (used on Logout).
   * Safe and idempotent: if the token is already revoked or does not exist, it completes safely.
   */
  async revokeRefreshToken(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashWithSecret(rawRefreshToken, this.refreshSecret);
    const record = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
    });

    if (record && !record.isRevoked) {
      record.isRevoked = true;
      await this.refreshTokenRepository.save(record);
    }
  }
}
