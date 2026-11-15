import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldSecurePassword123!',
    description: 'Current password for verification',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  @MinLength(8, { message: 'Current password must be at least 8 characters long' })
  currentPassword!: string;

  @ApiProperty({
    example: 'NewSecurePassword456!',
    description: 'New desired password (minimum 8 characters)',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword!: string;
}
