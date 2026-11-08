import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);

    app.enableShutdownHooks();

    app.enableCors({
      origin: true,
      credentials: true,
    });

    app.use(cookieParser());

    app.setGlobalPrefix('api/v1');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Swagger / OpenAPI documentation
    const swaggerConfig = new DocumentBuilder()
      .setTitle('DocBook API')
      .setDescription(
        'DocBook – QR-based clinic appointment booking platform backend API',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter your JWT access token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    const configService = app.get(ConfigService);
    const port = configService.get<number>('port') ?? 3000;

    await app.listen(port);

    logger.log(`DocBook API listening on port ${port}`);
    logger.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
  } catch (error) {
    logger.error(
      'Application startup failed',
      error instanceof Error ? error.stack : String(error),
    );

    throw error;
  }
}

await bootstrap();
