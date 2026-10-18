
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import configuration from './config/configuration.js';
import databaseConfig from './config/database.config.js';
import { envValidationSchema } from './config/env.validation.js';

import { DatabaseConnectionLogger } from './database/database-connection-logger.js';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV ?? 'development'}`,
      validationSchema: envValidationSchema,
      load: [configuration, databaseConfig],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database')!,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseConnectionLogger],
})

export class AppModule {}
