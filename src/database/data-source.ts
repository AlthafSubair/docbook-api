import 'reflect-metadata';
import dotenv from 'dotenv';

import { DataSource } from 'typeorm';
import { getDatabaseOptions } from '../config/database.options.js';
import { Clinic } from '../clinics/entities/clinic.entity.js';
import { PatientOtpVerification } from '../auth/entities/patient-otp-verification.entity.js';
import { PatientRefreshToken } from '../auth/entities/patient-refresh-token.entity.js';
import { Patient } from '../patients/entities/patient.entity.js';

dotenv.config({
  path: `.env.${process.env.NODE_ENV ?? 'development'}`,
});

export default new DataSource({
  ...getDatabaseOptions(),
  entities: [Clinic, PatientOtpVerification, PatientRefreshToken, Patient],
  migrations: ['src/database/migrations/*.ts'],
});
