import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { SendOtpDto } from './dto/send-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import {
  REFRESH_COOKIE_NAME,
  getRefreshCookieOptions,
  getClearRefreshCookieOptions,
  type CookieConfig,
} from './constants/cookie.constants.js';
import type { JwtPayload } from './services/token.service.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly cookieConfig: CookieConfig;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    this.cookieConfig = {
      isProduction,
      domain: this.configService.get<string>('cookie.domain'),
      sameSite:
        this.configService.get<'lax' | 'strict' | 'none'>('cookie.sameSite') ??
        'lax',
      secure:
        this.configService.get<boolean>('cookie.secure') ?? isProduction,
    };
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request OTP',
    description:
      'Validates phone number and country code, checks 60-second cooldown, generates a secure 6-digit OTP, and dispatches SMS.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP generated and sent successfully',
    schema: {
      example: { message: 'OTP sent successfully' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid phone format or active resend cooldown',
  })
  async sendOtp(@Body() dto: SendOtpDto): Promise<{ message: string }> {
    return this.authService.sendOtp(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP & Log In',
    description:
      'Verifies the submitted 6-digit OTP, marks it consumed, issues a 15-minute Access Token, and sets a 7-day HttpOnly Refresh Token cookie.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Authentication successful. Access token returned in response body; Refresh token set in HttpOnly cookie.',
    schema: {
      example: {
        message: 'Authentication successful',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP, expired OTP, or maximum attempts exceeded',
  })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string; accessToken: string }> {
    const result = await this.authService.verifyOtp(dto);

    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      getRefreshCookieOptions(this.cookieConfig),
    );

    return {
      message: result.message,
      accessToken: result.accessToken,
    };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renew Access Token (Token Rotation)',
    description:
      'Validates the refresh token (read from HttpOnly cookie or request body), revokes it, and issues a fresh Access Token and new HttpOnly Refresh Token cookie.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Token rotated. Fresh access token returned in body; new refresh token set in HttpOnly cookie.',
    schema: {
      example: {
        message: 'Token refreshed successfully',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid, expired, or compromised refresh token',
  })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto?: RefreshTokenDto,
  ): Promise<{ message: string; accessToken: string }> {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] ?? dto?.refreshToken;

    if (!rawToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const result = await this.authService.refreshToken(rawToken);

    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      getRefreshCookieOptions(this.cookieConfig),
    );

    return {
      message: result.message,
      accessToken: result.accessToken,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log Out',
    description:
      'Revokes the current refresh token session in the database and clears the HttpOnly Refresh Token cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out, session revoked, and cookie cleared',
    schema: {
      example: { message: 'Logged out successfully' },
    },
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto?: RefreshTokenDto,
  ): Promise<{ message: string }> {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] ?? dto?.refreshToken;

    if (rawToken) {
      await this.authService.logout(rawToken);
    }

    res.clearCookie(
      REFRESH_COOKIE_NAME,
      getClearRefreshCookieOptions(this.cookieConfig),
    );

    return {
      message: 'Logged out successfully',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get Current Authenticated Session',
    description:
      'Validates the Bearer Access Token in the Authorization header and returns the authenticated session details.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current session information',
    schema: {
      example: {
        authenticated: true,
        phone: '+919876543210',
        role: 'patient',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired Access Token',
  })
  getMe(@CurrentUser() user: JwtPayload) {
    return {
      authenticated: true,
      phone: user.phone,
      role: user.role,
    };
  }
}
