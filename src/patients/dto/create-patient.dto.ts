import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PatientRelationship, PatientSex } from '../enums/patient.enums.js';

export class CreatePatientDto {
  @ApiProperty({
    example: 'Rahul Sharma',
    description: 'Full name of the patient',
    maxLength: 150,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString({ message: 'Full name must be a string' })
  @MaxLength(150, { message: 'Full name cannot exceed 150 characters' })
  fullName!: string;

  @ApiPropertyOptional({
    example: PatientRelationship.SELF,
    description:
      'Relationship of the patient to the account holder',
    enum: PatientRelationship,
    enumName: 'PatientRelationship',
    default: PatientRelationship.SELF,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsEnum(PatientRelationship, {
    message: `Relationship must be one of: ${Object.values(PatientRelationship).join(', ')}`,
  })
  relationship?: PatientRelationship;

  @ApiPropertyOptional({
    example: 'rahul.sharma@example.com',
    description: 'Email address of the patient',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address format' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  email?: string;

  @ApiPropertyOptional({
    example: '1995-08-15',
    description: 'Date of birth in YYYY-MM-DD format',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be a valid ISO date (YYYY-MM-DD)' })
  dob?: string;

  @ApiPropertyOptional({
    example: PatientSex.MALE,
    description: 'Biological sex of patient',
    enum: PatientSex,
    enumName: 'PatientSex',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsEnum(PatientSex, {
    message: `Sex must be one of: ${Object.values(PatientSex).join(', ')}`,
  })
  sex?: PatientSex;
}
