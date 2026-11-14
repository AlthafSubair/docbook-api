import {
  IsEmail,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsTimeZone,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateClinicDto {
  @ApiProperty({
    example: 'City Care Dental Clinic',
    description: 'Official name of the clinic',
    minLength: 2,
    maxLength: 150,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  clinicName!: string;

  @ApiPropertyOptional({
    example: 'city-care-dental',
    description:
      'Unique URL slug for clinic booking page. If omitted, automatically generated from clinic name.',
    maxLength: 180,
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'slug must contain only lowercase alphanumeric characters and hyphens (e.g. city-care-dental)',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  slug?: string;

  @ApiProperty({
    example: '+919876543210',
    description: 'Primary contact phone number for the clinic in E.164 format',
  })
  @IsString()
  @Matches(/^\+[1-9][0-9]{7,14}$/, {
    message: 'clinicPhone must be in E.164 format (e.g. +919876543210)',
  })
  clinicPhone!: string;

  @ApiPropertyOptional({
    example: 'contact@citycare.com',
    description: 'Public contact email for the clinic',
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  clinicEmail?: string;

  @ApiPropertyOptional({
    example: '123 Health Ave, MG Road, Kochi, Kerala 682001',
    description: 'Physical address of the clinic',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  address?: string;

  @ApiPropertyOptional({
    example: '9.9312328',
    description: 'Latitude coordinates for map pin',
  })
  @IsOptional()
  @IsLatitude()
  latitude?: string;

  @ApiPropertyOptional({
    example: '76.2673041',
    description: 'Longitude coordinates for map pin',
  })
  @IsOptional()
  @IsLongitude()
  longitude?: string;

  @ApiPropertyOptional({
    example: 'Asia/Kolkata',
    description: 'Clinic timezone (IANA identifier)',
    default: 'Asia/Kolkata',
  })
  @IsOptional()
  @IsTimeZone()
  timezone?: string;
}
