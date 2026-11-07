import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService, AuthResponse } from './auth.service.js';
import { SendOtpDto } from './dto/send-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import type { JwtPayload } from './services/token.service.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
      'Verifies the submitted 6-digit OTP, marks it consumed, and issues a 15-minute Access Token and 30-day Refresh Token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful with JWT token pair',
    schema: {
      example: {
        message: 'Authentication successful',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP, expired OTP, or maximum attempts exceeded',
  })
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<AuthResponse> {
    return this.authService.verifyOtp(dto);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renew Access Token (Token Rotation)',
    description:
      'Validates the refresh token, revokes it, and issues a fresh Access Token and Refresh Token pair.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token rotated and new token pair issued',
    schema: {
      example: {
        message: 'Token refreshed successfully',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid, expired, or compromised refresh token',
  })
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<AuthResponse> {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log Out',
    description:
      'Revokes the current refresh token session in the database so it can never be used again.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out and session revoked',
    schema: {
      example: { message: 'Logged out successfully' },
    },
  })
  async logout(@Body() dto: RefreshTokenDto): Promise<{ message: string }> {
    return this.authService.logout(dto);
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
