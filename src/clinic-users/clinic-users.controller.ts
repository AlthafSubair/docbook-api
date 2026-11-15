import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ClinicUsersService,
  SafeClinicUserResponse,
} from './clinic-users.service.js';
import { CreateClinicUserDto } from './dto/create-clinic-user.dto.js';
import { UpdateClinicUserDto } from './dto/update-clinic-user.dto.js';
import { QueryClinicUsersDto } from './dto/query-clinic-users.dto.js';
import { ClinicJwtAuthGuard } from '../auth/guards/clinic-jwt-auth.guard.js';
import { CurrentClinicUser } from '../auth/decorators/current-clinic-user.decorator.js';
import type { ClinicJwtPayload } from '../auth/services/clinic-token.service.js';
import type { PaginatedResponse } from '../common/interfaces/paginated-response.interface.js';

@ApiTags('Clinic Users')
@ApiBearerAuth('JWT-clinic-auth')
@UseGuards(ClinicJwtAuthGuard)
@Controller('clinic-users')
export class ClinicUsersController {
  constructor(private readonly clinicUsersService: ClinicUsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List all staff members in caller clinic',
    description:
      'Fetches paginated staff members belonging to the caller clinic with optional role filtering, active status filtering, and keyword search.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of clinic staff members',
    schema: {
      example: {
        data: [
          {
            userId: '1',
            clinicId: '10',
            fullName: 'Dr. Sarah Thomas',
            username: 'sarah',
            email: 'sarah@citycare.com',
            phone: '+919876543210',
            role: 'admin',
            isActive: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            createdAt: '2026-11-14T17:00:00.000Z',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired clinic access token',
  })
  async findAll(
    @CurrentClinicUser() currentUser: ClinicJwtPayload,
    @Query() query: QueryClinicUsersDto,
  ): Promise<PaginatedResponse<SafeClinicUserResponse>> {
    return this.clinicUsersService.findAll(currentUser, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a staff member by ID',
    description:
      'Fetches the profile details of a single staff member belonging to the caller clinic organization.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique staff user ID',
    example: '2',
  })
  @ApiResponse({
    status: 200,
    description: 'Staff member profile',
    schema: {
      example: {
        userId: '2',
        clinicId: '10',
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
    status: 401,
    description: 'Missing, invalid, or expired clinic access token',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff member not found in this clinic',
  })
  async findOne(
    @CurrentClinicUser() currentUser: ClinicJwtPayload,
    @Param('id') id: string,
  ): Promise<SafeClinicUserResponse> {
    return this.clinicUsersService.findOne(currentUser, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update clinic staff member profile or status',
    description:
      'Updates an existing staff member (fullName, phone, role, isActive). Only accessible by clinic administrators. Admins cannot deactivate themselves or revoke their own admin role.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique staff user ID',
    example: '2',
  })
  @ApiResponse({
    status: 200,
    description: 'Staff member successfully updated',
    schema: {
      example: {
        userId: '2',
        clinicId: '10',
        fullName: 'Dr. Jane Smith',
        username: 'jane.doe',
        email: 'jane.doe@citycare.com',
        phone: '+919876543219',
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
    description: 'Bad request (e.g. admin attempting self-deactivation or invalid payload)',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired clinic access token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Only clinic administrators can update staff members',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff member not found in this clinic',
  })
  async update(
    @CurrentClinicUser() currentUser: ClinicJwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateClinicUserDto,
  ): Promise<SafeClinicUserResponse> {
    return this.clinicUsersService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deactivate / remove a clinic staff member',
    description:
      'Soft-deletes and marks the staff account inactive. Only accessible by clinic administrators. Admins cannot delete their own account.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique staff user ID',
    example: '2',
  })
  @ApiResponse({
    status: 200,
    description: 'Staff member deactivated successfully',
    schema: {
      example: {
        message: "Staff member 'Dr. Jane Doe' (jane.doe) deactivated successfully.",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request: Administrators cannot delete their own account',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired clinic access token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Only clinic administrators can remove staff members',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff member not found in this clinic',
  })
  async remove(
    @CurrentClinicUser() currentUser: ClinicJwtPayload,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.clinicUsersService.remove(currentUser, id);
  }

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
