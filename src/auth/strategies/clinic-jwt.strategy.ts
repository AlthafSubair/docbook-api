import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ClinicJwtPayload } from '../services/clinic-token.service.js';

@Injectable()
export class ClinicJwtStrategy extends PassportStrategy(Strategy, 'jwt-clinic') {
  constructor(configService: ConfigService) {
    const accessSecret = configService.get<string>('jwt.accessSecret');

    if (!accessSecret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: accessSecret,
    });
  }

  async validate(payload: ClinicJwtPayload): Promise<ClinicJwtPayload> {
    if (
      !payload.sub ||
      !payload.clinicId ||
      payload.userType !== 'clinic'
    ) {
      throw new UnauthorizedException('Invalid clinic token payload');
    }

    return payload;
  }
}
