import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { UserRole } from '../../users/enums/user.enums.js';

export class UpdateClinicUserDto {
  @ApiPropertyOptional({
    example: 'Dr. Jane Smith',
    description: 'Updated full name of the staff member',
    minLength: 2,
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(150, { message: 'Full name must not exceed 150 characters' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  fullName?: string;

  @ApiPropertyOptional({
    example: '+919876543219',
    description: 'Updated phone number in valid E.164 format',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'Phone number must be in valid E.164 format (e.g. +919876543210)',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  phone?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.DOCTOR,
    description: 'Updated role of the staff member (Admin only)',
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: `Role must be one of: ${Object.values(UserRole).join(', ')}`,
  })
  role?: UserRole;

  @ApiPropertyOptional({
    example: true,
    description: 'Active status of the staff account (Admin only)',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
