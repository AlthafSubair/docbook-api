import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { OtpService } from './services/otp.service.js';
import { SmsService } from './services/sms.service.js';
import { TokenService } from './services/token.service.js';
import { PatientOtpVerification } from './entities/patient-otp-verification.entity.js';
import { PatientRefreshToken } from './entities/patient-refresh-token.entity.js';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      PatientOtpVerification,
      PatientRefreshToken,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, SmsService, TokenService],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
