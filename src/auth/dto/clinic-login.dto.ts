import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ClinicLoginDto {
  @ApiProperty({
    example: 'admin',
    description:
      'Clinic staff username or email address. When using username, provide clinic slug via x-clinic-slug header or clinicSlug body field.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Username or email is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  identifier!: string;

  @ApiProperty({
    example: 'AdminPassword123!',
    description: 'Account password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  @ApiPropertyOptional({
    example: 'test-clinic',
    description:
      'Clinic slug. Optional alternative to providing the x-clinic-slug header.',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  clinicSlug?: string;
}
