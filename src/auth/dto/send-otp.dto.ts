import { Transform } from 'class-transformer';
import {
  IsISO31661Alpha2,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    example: 'IN',
    description: 'ISO 3166-1 alpha-2 country code (e.g. IN, US, AE)',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsNotEmpty({ message: 'country is required' })
  @IsString({ message: 'country must be a string' })
  @IsISO31661Alpha2({
    message:
      'country must be a valid 2-letter ISO country code (e.g. IN, US, AE)',
  })
  country!: string;

  @ApiProperty({
    example: '9876543210',
    description: 'National phone number digits without country code',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'number is required' })
  @IsString({ message: 'number must be a string' })
  @Matches(/^[0-9\s\-()]{4,15}$/, {
    message: 'number must contain valid phone digits',
  })
  number!: string;
}
