import { Logger } from '@nestjs/common';

const logger = new Logger('Configuration');

export default () => {
  const environment = process.env.NODE_ENV ?? 'development';
  const isProduction = environment === 'production';

  logger.log(`Environment: ${environment}`);
  logger.log('Environment configuration loaded');

  return {
    environment,
    port: Number(process.env.PORT ?? 3000),
    cors: {
      frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
      baseDomain: process.env.BASE_DOMAIN ?? 'docbook.health',
    },
    cookie: {
      domain:
        process.env.COOKIE_DOMAIN?.trim() ||
        (isProduction ? `.${process.env.BASE_DOMAIN ?? 'docbook.health'}` : undefined),
      sameSite: (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') ?? 'lax',
      secure:
        process.env.COOKIE_SECURE !== undefined
          ? String(process.env.COOKIE_SECURE).toLowerCase() === 'true'
          : isProduction,
    },
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
