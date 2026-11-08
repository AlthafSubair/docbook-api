import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number()
    .port()
    .default(3000),

  DB_HOST: Joi.string().trim().required(),

  DB_PORT: Joi.number()
    .port()
    .default(5432),

  DB_USERNAME: Joi.string().trim().required(),

  DB_PASSWORD: Joi.string().required(),

  DB_NAME: Joi.string().trim().required(),

  FRONTEND_URL: Joi.string()
    .default('http://localhost:3000'),

  BASE_DOMAIN: Joi.string()
    .default('docbook.health'),

  COOKIE_DOMAIN: Joi.string()
    .allow('')
    .optional(),

  COOKIE_SAME_SITE: Joi.string()
    .valid('lax', 'strict', 'none')
    .default('lax'),

  COOKIE_SECURE: Joi.boolean()
    .optional(),

  OTP_EXPIRATION_MINUTES: Joi.number()
    .positive()
    .default(5),

  OTP_RESEND_COOLDOWN_SECONDS: Joi.number()
    .positive()
    .default(60),

  OTP_SECRET: Joi.string()
    .min(16)
    .required(),

  JWT_ACCESS_SECRET: Joi.string()
    .min(16)
    .required(),

  JWT_ACCESS_EXPIRATION: Joi.string()
    .default('15m'),

  JWT_REFRESH_SECRET: Joi.string()
    .min(16)
    .required(),

  JWT_REFRESH_EXPIRATION: Joi.string()
    .default('7d'),
});
