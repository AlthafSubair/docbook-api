import {
  Body,
  Controller,
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
import { ClinicUsersService, SafeClinicUserResponse } from './clinic-users.service.js';
import { CreateClinicUserDto } from './dto/create-clinic-user.dto.js';
import { ClinicJwtAuthGuard } from '../auth/guards/clinic-jwt-auth.guard.js';
import { CurrentClinicUser } from '../auth/decorators/current-clinic-user.decorator.js';
import type { ClinicJwtPayload } from '../auth/services/clinic-token.service.js';

@ApiTags('Clinic Users')
@ApiBearerAuth('JWT-clinic-auth')
@UseGuards(ClinicJwtAuthGuard)
@Controller('clinic-users')
export class ClinicUsersController {
  constructor(private readonly clinicUsersService: ClinicUsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a new clinic staff member',
    description:
      'Creates a new staff account (Doctor, Receptionist, Accountant, or Admin) under the caller clinic organization. Only accessible by clinic administrators.',
  })
  @ApiResponse({
    status: 201,
    description: 'Staff account successfully created',
    schema: {
      example: {
        userId: '2',
        clinicId: '1',
        fullName: 'Dr. Jane Doe',
        username: 'jane.doe',
        email: 'jane.doe@citycare.com',
        phone: '+919876543210',
        role: 'doctor',
        isActive: true,
        isEmailVerified: false,
        isPhoneVerified: false,
        createdAt: '2026-11-14T17:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (e.g. invalid username format, weak password, invalid email)',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired clinic access token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Only clinic administrators can create new staff members',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Username already in use in this clinic or email already registered',
  })
  async create(
    @CurrentClinicUser() currentUser: ClinicJwtPayload,
    @Body() dto: CreateClinicUserDto,
  ): Promise<SafeClinicUserResponse> {
    return this.clinicUsersService.create(currentUser, dto);
  }
}
