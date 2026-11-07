import { Transform } from 'class-transformer';
import { IsJWT, IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'refreshToken is required' })
  @IsString({ message: 'refreshToken must be a string' })
  @IsJWT({ message: 'refreshToken must be a valid JWT format' })
  refreshToken!: string;
}
