import { Transform } from 'class-transformer';
import { IsJWT, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Long-lived JWT refresh token',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'refreshToken is required' })
  @IsString({ message: 'refreshToken must be a string' })
  @IsJWT({ message: 'refreshToken must be a valid JWT format' })
  refreshToken!: string;
}
