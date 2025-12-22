import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as morgan from 'morgan';
import * as cookieParser from 'cookie-parser';
import dataSource from './config/typeorm.config';

async function bootstrap() {
  // Run migrations on startup (only runs pending migrations)
  // TypeORM tracks which migrations have been run, so this is safe to call on every startup
  // It will only execute new migrations that haven't been run yet
  if (process.env.NODE_ENV === 'production') {
    console.log('🔄 Checking for pending migrations...');
    try {
      await dataSource.initialize();
      const pendingMigrations = await dataSource.showMigrations();

      if (pendingMigrations) {
        console.log('🚀 Running pending migrations...');
        await dataSource.runMigrations({ transaction: 'all' });
        console.log('✅ Migrations completed successfully');
      } else {
        console.log('✨ No pending migrations - database is up to date');
      }

      await dataSource.destroy();
    } catch (error) {
      console.error('❌ Migration error:', error);
      // Don't exit - let the app try to start anyway
    }
  }

  const app = await NestFactory.create(AppModule);

  // Cookie parser middleware
  app.use(cookieParser());

  // HTTP request logger
  app.use(morgan('dev'));

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('ELEVEN API')
    .setDescription('Elevator Maintenance SaaS - API Documentation')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('clients', 'Client management endpoints')
    .addTag('buildings', 'Building inventory endpoints')
    .addTag('work-orders', 'Work orders and operations endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'ELEVEN API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
