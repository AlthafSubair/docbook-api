import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ClinicsService } from './clinics.service.js';
import { OnboardClinicDto } from './dto/onboard-clinic.dto.js';
import { UpdateClinicDto } from './dto/update-clinic.dto.js';
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard.js';
import { ClinicJwtAuthGuard } from '../auth/guards/clinic-jwt-auth.guard.js';
import { CurrentClinicUser } from '../auth/decorators/current-clinic-user.decorator.js';
import type { ClinicJwtPayload } from '../auth/services/clinic-token.service.js';
import { UserRole } from '../users/enums/user.enums.js';

@ApiTags('Clinics')
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Post('onboard')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AdminApiKeyGuard)
  @ApiSecurity('admin-api-key')
  @ApiHeader({
    name: 'x-admin-api-key',
    description: 'Internal Platform Admin API Key',
    required: true,
    schema: {
      type: 'string',
      default: 'docbook_admin_super_secret_key_dev_2026',
    },
  })
  @ApiOperation({
    summary: 'Onboard a new clinic and its primary admin user (Internal / Platform)',
    description:
      'Creates a new clinic organization and its primary administrator account atomically inside a database transaction. Protected by internal Admin API Key.',
  })
  @ApiResponse({
    status: 201,
    description: 'Clinic and primary admin account created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error in clinic or admin payload',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid x-admin-api-key header',
  })
  @ApiResponse({
    status: 409,
    description: 'Clinic slug or admin email already exists',
  })
  async onboard(@Body() dto: OnboardClinicDto) {
    return this.clinicsService.onboard(dto);
  }

  @Get('public/:slug')
  @ApiOperation({
    summary: 'Get public clinic profile by slug',
    description:
      'Public endpoint used by patient-facing portal to resolve clinic metadata, address, and status via URL slug.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Clinic URL slug (e.g. city-care-dental)',
    example: 'city-care-dental',
  })
  @ApiResponse({
    status: 200,
    description: 'Clinic public information',
  })
  @ApiResponse({
    status: 404,
    description: 'Clinic not found',
  })
  async getBySlug(@Param('slug') slug: string) {
    return this.clinicsService.findBySlug(slug);
  }

  @Get('me')
  @UseGuards(ClinicJwtAuthGuard)
  @ApiBearerAuth('JWT-clinic-auth')
  @ApiOperation({
    summary: 'Get current clinic profile (Clinic Staff / Admin)',
    description:
      'Fetches profile, operational settings, and metadata of the caller clinic organization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current clinic organization details',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired clinic access token',
  })
  @ApiResponse({
    status: 404,
    description: 'Clinic not found',
  })
  async getMe(@CurrentClinicUser() currentUser: ClinicJwtPayload) {
    return this.clinicsService.findOne(currentUser.clinicId);
  }

  @Patch('me')
  @UseGuards(ClinicJwtAuthGuard)
  @ApiBearerAuth('JWT-clinic-auth')
  @ApiOperation({
    summary: 'Update current clinic settings (Clinic Admin only)',
    description:
      'Allows a clinic administrator to update clinic operational details such as phone, email, address, or timezone. Strictly scoped to the caller clinic organization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Updated clinic details',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed on input payload',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired clinic access token',
  })
  @ApiResponse({
    status: 403,
    description:
      'Access denied: Only clinic administrators are authorized to update clinic settings.',
  })
  @ApiResponse({
    status: 404,
    description: 'Clinic not found',
  })
  async updateMe(
    @CurrentClinicUser() currentUser: ClinicJwtPayload,
    @Body() dto: UpdateClinicDto,
  ) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Access denied: Only clinic administrators are authorized to update clinic settings.',
      );
    }
    return this.clinicsService.update(currentUser.clinicId, dto);
  }

  @Get()
  @UseGuards(AdminApiKeyGuard)
  @ApiSecurity('admin-api-key')
  @ApiHeader({
    name: 'x-admin-api-key',
    description: 'Internal Platform Admin API Key',
    required: true,
    schema: {
      type: 'string',
      default: 'docbook_admin_super_secret_key_dev_2026',
    },
  })
  @ApiOperation({
    summary: 'List all clinics (Platform Admin)',
    description:
      'Returns a list of all registered clinics on the platform. Protected by Admin API Key.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of clinics',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid x-admin-api-key header',
  })
  async findAll() {
    return this.clinicsService.findAll();
  }

  @Get(':id')
  @UseGuards(AdminApiKeyGuard)
  @ApiSecurity('admin-api-key')
  @ApiHeader({
    name: 'x-admin-api-key',
    description: 'Internal Platform Admin API Key',
    required: true,
    schema: {
      type: 'string',
      default: 'docbook_admin_super_secret_key_dev_2026',
    },
  })
  @ApiOperation({
    summary: 'Get clinic details by ID (Platform Admin)',
    description:
      'Returns full clinic details including associated staff members. Protected by Admin API Key.',
  })
  @ApiParam({ name: 'id', description: 'Clinic ID (bigint)' })
  @ApiResponse({
    status: 200,
    description: 'Clinic details',
  })
  @ApiResponse({
    status: 404,
    description: 'Clinic not found',
  })
  async findOne(@Param('id') id: string) {
    return this.clinicsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminApiKeyGuard)
  @ApiSecurity('admin-api-key')
  @ApiHeader({
    name: 'x-admin-api-key',
    description: 'Internal Platform Admin API Key',
    required: true,
    schema: {
      type: 'string',
      default: 'docbook_admin_super_secret_key_dev_2026',
    },
  })
  @ApiOperation({
    summary: 'Update clinic settings (Platform Admin)',
    description:
      'Updates clinic details like phone, email, address, or timezone. Protected by Admin API Key.',
  })
  @ApiParam({ name: 'id', description: 'Clinic ID (bigint)' })
  @ApiResponse({
    status: 200,
    description: 'Updated clinic details',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClinicDto,
  ) {
    return this.clinicsService.update(id, dto);
  }
}
