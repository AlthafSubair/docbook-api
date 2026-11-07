import { Transform } from 'class-transformer';
import {
  IsISO31661Alpha2,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';

export class SendOtpDto {
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
