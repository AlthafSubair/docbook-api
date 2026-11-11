import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

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
    example: 'male',
    description: 'Biological sex or gender of patient',
    enum: ['male', 'female', 'other'],
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsIn(['male', 'female', 'other'], {
    message: 'Sex must be either male, female, or other',
  })
  sex?: string;
}
