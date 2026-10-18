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
});