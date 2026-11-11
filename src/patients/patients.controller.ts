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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PatientsService } from './patients.service.js';
import { CreatePatientDto } from './dto/create-patient.dto.js';
import { UpdatePatientDto } from './dto/update-patient.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/services/token.service.js';

@ApiTags('Patients')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all patient profiles under authenticated account',
    description:
      'Returns all active family member / patient profiles created under the authenticated phone number.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of patient profiles',
  })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.patientsService.findAllByPhone(user.phone);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a new patient profile',
    description:
      'Creates a new patient profile associated with the authenticated phone number.',
  })
  @ApiResponse({
    status: 201,
    description: 'Patient profile created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePatientDto,
  ) {
    return this.patientsService.create(user.phone, dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single patient profile by ID',
    description:
      'Fetches details of a specific patient profile belonging to the authenticated phone number.',
  })
  @ApiParam({ name: 'id', description: 'Patient ID (bigint)' })
  @ApiResponse({
    status: 200,
    description: 'Patient profile details',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found or unauthorized',
  })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.patientsService.findOne(user.phone, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a patient profile',
    description:
      'Updates details of a patient profile belonging to the authenticated phone number.',
  })
  @ApiParam({ name: 'id', description: 'Patient ID (bigint)' })
  @ApiResponse({
    status: 200,
    description: 'Patient profile updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found or unauthorized',
  })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientsService.update(user.phone, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete (soft-delete) a patient profile',
    description:
      'Soft-deletes a patient profile belonging to the authenticated phone number.',
  })
  @ApiParam({ name: 'id', description: 'Patient ID (bigint)' })
  @ApiResponse({
    status: 200,
    description: 'Patient profile deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found or unauthorized',
  })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.patientsService.remove(user.phone, id);
  }
}
