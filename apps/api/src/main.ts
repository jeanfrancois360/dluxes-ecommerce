import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import compression from 'compression';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  console.log('[BOOTSTRAP] Step 1: Creating Nest application...');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  console.log('[BOOTSTRAP] Step 2: Nest application created');

  const configService = app.get(ConfigService);
  console.log('[BOOTSTRAP] Step 3: Got ConfigService');

  // Enable compression for responses
  app.use(compression());
  console.log('[BOOTSTRAP] Step 4: Compression enabled');

  // Serve static files from public/uploads directory
  const publicPath = join(process.cwd(), 'public');
  console.log('[BOOTSTRAP] Step 5: Setting up static assets from:', publicPath);
  app.useStaticAssets(publicPath, {
    prefix: '/',
  });
  console.log('[BOOTSTRAP] Step 6: Static assets configured');

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
  console.log('[BOOTSTRAP] Step 7: API prefix:', apiPrefix);
  app.setGlobalPrefix(apiPrefix);
  console.log('[BOOTSTRAP] Step 8: Global prefix set');

  // CORS - Parse comma-separated origins from environment variable
  console.log('[BOOTSTRAP] Step 9: Configuring CORS...');
  const corsOrigin = configService.get('CORS_ORIGIN');
  const allowedOrigins = corsOrigin
    ? corsOrigin.split(',').map((origin: string) => origin.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];
  console.log('[BOOTSTRAP] Allowed origins:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
  });
  console.log('[BOOTSTRAP] Step 10: CORS enabled');

  // Global validation pipe
  console.log('[BOOTSTRAP] Step 11: Setting up global pipes...');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );
  console.log('[BOOTSTRAP] Step 12: Global pipes configured');

  // Global exception filter for consistent error responses
  console.log('[BOOTSTRAP] Step 13: Setting up global filters...');
  app.useGlobalFilters(new HttpExceptionFilter());
  console.log('[BOOTSTRAP] Step 14: Global filters configured');

  const port = configService.get('PORT') || 3001;
  console.log('[BOOTSTRAP] Step 15: Starting server on port:', port);
  await app.listen(port);
  console.log('[BOOTSTRAP] Step 16: Server is now listening!');

  console.log(`🚀 NextPik E-commerce API running on: http://localhost:${port}/${apiPrefix}`);
}

process.stderr.write('=== MAIN.TS EXECUTING ===\n');
process.stderr.write(`Node version: ${process.version}\n`);
process.stderr.write(`CWD: ${process.cwd()}\n`);
process.stderr.write('About to call bootstrap()...\n');

bootstrap().catch((error) => {
  process.stderr.write('=== BOOTSTRAP FAILED ===\n');
  process.stderr.write(`Failed to start application: ${error}\n`);
  process.stderr.write(`Error stack: ${error.stack}\n`);
  process.exit(1);
});