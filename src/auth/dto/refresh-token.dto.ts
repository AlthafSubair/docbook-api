import { Transform } from 'class-transformer';
import { IsJWT, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description:
      'Long-lived JWT refresh token. Optional if provided automatically via the HttpOnly cookie.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'refreshToken must be a string' })
  @IsJWT({ message: 'refreshToken must be a valid JWT format' })
  refreshToken?: string;
}
