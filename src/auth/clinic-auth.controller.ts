import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ClinicAuthService } from './services/clinic-auth.service.js';
import { ClinicLoginDto } from './dto/clinic-login.dto.js';
import { ClinicRefreshTokenDto } from './dto/clinic-refresh-token.dto.js';
import { ClinicJwtAuthGuard } from './guards/clinic-jwt-auth.guard.js';
import { CurrentClinicUser } from './decorators/current-clinic-user.decorator.js';
import {
  CLINIC_REFRESH_COOKIE_NAME,
  getClinicRefreshCookieOptions,
  getClearClinicRefreshCookieOptions,
  type CookieConfig,
} from './constants/cookie.constants.js';
import type { ClinicJwtPayload } from './services/clinic-token.service.js';

@ApiTags('Clinic Authentication')
@Controller('auth/clinic')
export class ClinicAuthController {
  private readonly cookieConfig: CookieConfig;

  constructor(
    private readonly clinicAuthService: ClinicAuthService,
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

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clinic staff login (Username or Email)',
    description:
      'Authenticates clinic staff (Admin, Doctor, Receptionist, Accountant). If identifier is an email, x-clinic-slug is not required. If identifier is a username, clinic slug must be provided via the x-clinic-slug header. Returns 15m access token in body and sets 7-day HttpOnly cookie.',
  })
  @ApiHeader({
    name: 'x-clinic-slug',
    description: 'Clinic slug header (required when identifier is a username)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns access token, user, and clinic profile.',
  })
  @ApiResponse({
    status: 400,
    description: 'Missing x-clinic-slug header when logging in with a username',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or deactivated account',
  })
  async login(
    @Body() dto: ClinicLoginDto,
    @Headers('x-clinic-slug') headerSlug: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.clinicAuthService.login(dto, headerSlug);

    // Set security-hardened HttpOnly cookie
    res.cookie(
      CLINIC_REFRESH_COOKIE_NAME,
      result.tokens.refreshToken,
      getClinicRefreshCookieOptions(this.cookieConfig),
    );

    return {
      message: 'Login successful',
      accessToken: result.tokens.accessToken,
      user: result.user,
      clinic: result.clinic,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh clinic staff access token',
    description:
      'Performs single-use refresh token rotation. Reads from HttpOnly cookie or body fallback, issues a new 15m access token, and sets a fresh 7-day HttpOnly cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens successfully rotated',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid, expired, or reused refresh token',
  })
  async refresh(
    @Req() req: Request,
    @Body() dto: ClinicRefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken =
      req.cookies?.[CLINIC_REFRESH_COOKIE_NAME] ?? dto?.refreshToken;

    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const result = await this.clinicAuthService.refreshToken(rawRefreshToken);

    res.cookie(
      CLINIC_REFRESH_COOKIE_NAME,
      result.refreshToken,
      getClinicRefreshCookieOptions(this.cookieConfig),
    );

    return {
      message: 'Session refreshed successfully',
      accessToken: result.accessToken,
      user: result.user,
      clinic: result.clinic,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log out clinic staff member',
    description:
      'Revokes the refresh token in the database and clears the HttpOnly cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
  })
  async logout(
    @Req() req: Request,
    @Body() dto: ClinicRefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken =
      req.cookies?.[CLINIC_REFRESH_COOKIE_NAME] ?? dto?.refreshToken;

    if (rawRefreshToken) {
      await this.clinicAuthService.logout(rawRefreshToken);
    }

    res.clearCookie(
      CLINIC_REFRESH_COOKIE_NAME,
      getClearClinicRefreshCookieOptions(this.cookieConfig),
    );

    return { message: 'Successfully logged out' };
  }

  @Get('me')
  @UseGuards(ClinicJwtAuthGuard)
  @ApiBearerAuth('JWT-clinic-auth')
  @ApiOperation({
    summary: 'Get current authenticated clinic staff profile',
    description:
      'Returns profile details and clinic information for the currently authenticated clinic user session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Staff member profile and clinic metadata',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or invalid clinic token',
  })
  async getMe(@CurrentClinicUser() user: ClinicJwtPayload) {
    return this.clinicAuthService.getMe(user.sub);
  }

  @Get('check-username')
  @UseGuards(ClinicJwtAuthGuard)
  @ApiBearerAuth('JWT-clinic-auth')
  @ApiOperation({
    summary: 'Check username availability within caller clinic',
    description:
      'Used by clinic admins when adding new staff. Checks whether a username is available under their own clinic.',
  })
  @ApiQuery({
    name: 'username',
    description: 'Username to check (e.g. reception1, dr.john)',
    example: 'reception1',
  })
  @ApiResponse({
    status: 200,
    description: 'Availability status ({ username, available })',
  })
  async checkUsername(
    @CurrentClinicUser() user: ClinicJwtPayload,
    @Query('username') username: string,
  ) {
    return this.clinicAuthService.checkUsernameAvailability(
      user.clinicId,
      username,
    );
  }
}
