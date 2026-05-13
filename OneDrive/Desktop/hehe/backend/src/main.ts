import './instrument';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import express from 'express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import {
  createApiUsageMiddleware,
  createAuditMiddleware,
  createFeatureFlagMiddleware,
} from './common/middleware/admin-observability.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Security headers via helmet
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production'
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: ["'self'", 'https://api.stripe.com'],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(cookieParser());
  app.use(new RequestIdMiddleware().use.bind(new RequestIdMiddleware()));
  app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));
  app.use('/subscriptions/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  const prisma = app.get(PrismaService);
  app.use(createFeatureFlagMiddleware(prisma));
  app.use(createApiUsageMiddleware(prisma));
  app.use(createAuditMiddleware(prisma));

  const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? [];
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new SentryGlobalFilter(), new GlobalExceptionFilter());

  // Swagger / OpenAPI docs (only in non-production environments)
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Postiz Competitor API')
      .setDescription('Multi-platform social media management API with AI-powered content generation, analytics, and agency features.')
      .setVersion(process.env.APP_VERSION ?? '1.0.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication and user management')
      .addTag('posts', 'Post creation and management')
      .addTag('publishing', 'Publishing workflows')
      .addTag('analytics', 'Performance analytics and ROI tracking')
      .addTag('agency', 'AI agency features')
      .addTag('subscriptions', 'Billing and plans')
      .addTag('admin', 'Admin observability')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
