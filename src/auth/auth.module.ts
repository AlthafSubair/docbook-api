import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { OtpService } from './services/otp.service.js';
import { SmsService } from './services/sms.service.js';
import { TokenService } from './services/token.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { PatientOtpVerification } from './entities/patient-otp-verification.entity.js';
import { PatientRefreshToken } from './entities/patient-refresh-token.entity.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      PatientOtpVerification,
      PatientRefreshToken,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    SmsService,
    TokenService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [AuthService, TokenService, JwtAuthGuard],
})
export class AuthModule {}
