import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller.js';
import { ClinicAuthController } from './clinic-auth.controller.js';
import { AuthService } from './auth.service.js';
import { ClinicAuthService } from './services/clinic-auth.service.js';
import { OtpService } from './services/otp.service.js';
import { SmsService } from './services/sms.service.js';
import { TokenService } from './services/token.service.js';
import { ClinicTokenService } from './services/clinic-token.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { ClinicJwtStrategy } from './strategies/clinic-jwt.strategy.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { ClinicJwtAuthGuard } from './guards/clinic-jwt-auth.guard.js';
import { PatientOtpVerification } from './entities/patient-otp-verification.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Clinic } from '../clinics/entities/clinic.entity.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      PatientOtpVerification,
      User,
      Clinic,
    ]),
  ],
  controllers: [AuthController, ClinicAuthController],
  providers: [
    AuthService,
    ClinicAuthService,
    OtpService,
    SmsService,
    TokenService,
    ClinicTokenService,
    JwtStrategy,
    ClinicJwtStrategy,
    JwtAuthGuard,
    ClinicJwtAuthGuard,
  ],
  exports: [
    AuthService,
    ClinicAuthService,
    TokenService,
    ClinicTokenService,
    JwtAuthGuard,
    ClinicJwtAuthGuard,
  ],
})
export class AuthModule {}
