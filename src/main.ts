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

    const configService = app.get(ConfigService);
    const port = configService.get<number>('port') ?? 3000;
    const isProduction =
      configService.get<string>('NODE_ENV') === 'production';
    const frontendUrl =
      configService.get<string>('cors.frontendUrl') ?? 'http://localhost:3000';
    const baseDomain =
      configService.get<string>('cors.baseDomain') ?? 'docbook.health';

    // Parse comma-separated allowed origins (e.g. "https://docbook.health,http://localhost:3000")
    const allowedOrigins = frontendUrl
      .split(',')
      .map((url) => url.trim().toLowerCase())
      .filter(Boolean);

    const isOriginAllowed = (origin: string): boolean => {
      const lowerOrigin = origin.toLowerCase();

      // 1. Exact match in allowed origins list
      if (allowedOrigins.includes(lowerOrigin)) {
        return true;
      }

      // 2. In development, allow localhost and any dynamic subdomains (e.g. clinic.localhost:3000)
      if (!isProduction) {
        if (/^https?:\/\/([a-z0-9-]+\.)*localhost(:[0-9]+)?$/i.test(origin)) {
          return true;
        }
        if (/^https?:\/\/127\.0\.0\.1(:[0-9]+)?$/i.test(origin)) {
          return true;
        }
      }

      // 3. Dynamic Subdomains of base domain (e.g. https://*.docbook.health and https://docbook.health)
      try {
        const url = new URL(origin);
        const hostname = url.hostname.toLowerCase();
        if (
          baseDomain &&
          (hostname === baseDomain || hostname.endsWith(`.${baseDomain}`))
        ) {
          return true;
        }
      } catch {
        return false;
      }

      return false;
    };

    app.enableCors({
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        // Allow requests with no origin (like mobile apps, curl, Postman, server-to-server)
        if (!origin) {
          return callback(null, true);
        }

        if (isOriginAllowed(origin)) {
          return callback(null, true);
        }

        logger.warn(`CORS blocked for origin: ${origin}`);
        return callback(new Error(`CORS blocked: Origin ${origin} not allowed`));
      },
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Cookie'],
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
