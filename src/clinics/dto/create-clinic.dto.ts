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

export class CreateClinicDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  clinicName!: string;

  @IsString()
  @Matches(/^\+[1-9][0-9]{7,14}$/, {
    message: 'clinicPhone must be in E.164 format (e.g. +919876543210)',
  })
  clinicPhone!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  clinicEmail?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: string;

  @IsOptional()
  @IsLongitude()
  longitude?: string;

  @IsOptional()
  @IsTimeZone()
  timezone?: string;
}