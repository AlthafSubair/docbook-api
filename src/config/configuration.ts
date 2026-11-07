import { Logger } from '@nestjs/common';

const logger = new Logger('Configuration');

export default () => {
  const environment = process.env.NODE_ENV ?? 'development';

  logger.log(`Environment: ${environment}`);
  logger.log('Environment configuration loaded');

  return {
    port: Number(process.env.PORT ?? 3000),
    otp: {
      expirationMinutes: Number(process.env.OTP_EXPIRATION_MINUTES ?? 5),
      resendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS ?? 60),
      secret: process.env.OTP_SECRET as string,
    },
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET as string,
      accessExpiration: process.env.JWT_ACCESS_EXPIRATION ?? '15m',
      refreshSecret: process.env.JWT_REFRESH_SECRET as string,
      refreshExpiration: process.env.JWT_REFRESH_EXPIRATION ?? '7d',
    },
  };
};
