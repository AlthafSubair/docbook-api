import { ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateClinicDto } from './create-clinic.dto.js';
import { CreateClinicAdminDto } from './create-clinic-admin.dto.js';

export class OnboardClinicDto {
  @ApiProperty({
    type: () => CreateClinicDto,
    description: 'Clinic organization details',
  })
  @ValidateNested()
  @Type(() => CreateClinicDto)
  clinic!: CreateClinicDto;

  @ApiProperty({
    type: () => CreateClinicAdminDto,
    description: 'Initial clinic administrator account details',
  })
  @ValidateNested()
  @Type(() => CreateClinicAdminDto)
  admin!: CreateClinicAdminDto;
}
