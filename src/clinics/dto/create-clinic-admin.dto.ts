import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateClinicAdminDto {
  @ApiProperty({
    example: 'Dr. Sarah Thomas',
    description: 'Full name of the clinic administrator',
    minLength: 2,
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(150, { message: 'Full name cannot exceed 150 characters' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  fullName!: string;

  @ApiProperty({
    example: 'sarah.thomas',
    description:
      'Unique login username for the clinic administrator within this clinic',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username cannot exceed 50 characters' })
  @Matches(/^[a-z0-9._-]+$/, {
    message:
      'Username must contain only lowercase letters, numbers, dots, hyphens, or underscores',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  username!: string;

  @ApiProperty({
    example: 'sarah.admin@citycare.com',
    description: 'Login email for the clinic administrator',
    maxLength: 255,
  })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiPropertyOptional({
    example: '+919876543211',
    description: 'Direct phone number for the admin in E.164 format',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9][0-9]{7,14}$/, {
    message: 'phone must be in E.164 format (e.g. +919876543211)',
  })
  phone?: string;

  @ApiProperty({
    example: 'SecurePass@2026!',
    description:
      'Initial password for the clinic admin (minimum 8 characters, at least 1 letter and 1 number)',
    minLength: 8,
    maxLength: 64,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(64, { message: 'Password cannot exceed 64 characters' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  password!: string;
}
