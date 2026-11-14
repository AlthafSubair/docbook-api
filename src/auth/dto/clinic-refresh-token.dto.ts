import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ClinicRefreshTokenDto {
  @ApiPropertyOptional({
    description:
      'Clinic Refresh token. Required only if client cannot receive or store HttpOnly cookies (e.g. mobile apps).',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
