import { Injectable } from '@nestjs/common';
import { OtpService } from './services/otp.service.js';
import { SmsService } from './services/sms.service.js';
import { TokenService, TokenPair } from './services/token.service.js';
import { SendOtpDto } from './dto/send-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';

export interface AuthResponse extends TokenPair {
  message: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly otpService: OtpService,
    private readonly smsService: SmsService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Coordinates OTP generation, database persistence, and SMS dispatch.
   */
  async sendOtp(dto: SendOtpDto): Promise<{ message: string }> {
    const { phone, otp } = await this.otpService.generateAndSaveOtp(
      dto.country,
      dto.number,
    );

    await this.smsService.sendOtp(phone, otp);

    return {
      message: 'OTP sent successfully',
    };
  }

  /**
   * Verifies the OTP, marks it consumed, and issues authentication tokens.
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResponse> {
    const { phone } = await this.otpService.verifyOtp(
      dto.country,
      dto.number,
      dto.otp,
    );

    const tokens = await this.tokenService.generateTokens(phone);

    return {
      message: 'Authentication successful',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Rotates a refresh token: revokes the old one and issues a new pair.
   */
  async refreshToken(dto: RefreshTokenDto): Promise<AuthResponse> {
    const tokens = await this.tokenService.rotateRefreshToken(
      dto.refreshToken,
    );

    return {
      message: 'Token refreshed successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Logs out the user by revoking the refresh token session.
   */
  async logout(dto: RefreshTokenDto): Promise<{ message: string }> {
    await this.tokenService.revokeRefreshToken(dto.refreshToken);

    return {
      message: 'Logged out successfully',
    };
  }
}
