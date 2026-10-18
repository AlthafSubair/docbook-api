import { Logger, ValidationPipe } from '@nestjs/common';

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);

    app.enableShutdownHooks();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    const configService = app.get(ConfigService);
    const port = configService.get<number>('port') ?? 3000;

    await app.listen(port);

    logger.log(`DocBook API listening on port ${port}`);
  } catch (error) {
    logger.error(
      'Application startup failed',
      error instanceof Error ? error.stack : String(error),
    );

    throw error;
  }
}

await bootstrap();