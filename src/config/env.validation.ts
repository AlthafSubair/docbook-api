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
