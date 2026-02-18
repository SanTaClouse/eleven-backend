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
  // En producción, las peticiones vienen del mismo origen (proxy de Vercel)
  // pero también permitimos el FRONTEND_URL por si se accede directamente
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (mismo origen via proxy, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }
      // Permitir orígenes configurados
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Bloquear otros orígenes
      callback(new Error('Not allowed by CORS'));
    },
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
    .setDescription('Sistema SaaS de Mantenimiento de Ascensores - Documentación de API')
    .setVersion('1.0')
    .addTag('auth', 'Endpoints de autenticación')
    .addTag('clients', 'Gestión de clientes')
    .addTag('buildings', 'Inventario de edificios')
    .addTag('work-orders', 'Órdenes de trabajo y operaciones')
    .addTag('qr-access', 'Acceso mediante código QR')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'ELEVEN API - Documentación',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
