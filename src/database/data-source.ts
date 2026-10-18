import 'reflect-metadata';
import dotenv from 'dotenv';

import { DataSource } from 'typeorm';
import { getDatabaseOptions } from '../config/database.options.js';
import { Clinic } from '../clinics/entities/clinic.entity.js';

dotenv.config({
  path: `.env.${process.env.NODE_ENV ?? 'development'}`,
});

export default new DataSource({
  ...getDatabaseOptions(),
  entities: [Clinic],
  migrations: ['src/database/migrations/*.ts'],
});