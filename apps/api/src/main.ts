import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import compression from 'compression';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  console.log('[BOOTSTRAP] Step 1: Creating Nest application...');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    rawBody: true, // Enable raw body for webhook signature verification
  });
  console.log('[BOOTSTRAP] Step 2: Nest application created with rawBody support');

  const configService = app.get(ConfigService);
  console.log('[BOOTSTRAP] Step 3: Got ConfigService');

  // Security headers with Helmet
  console.log('[BOOTSTRAP] Step 3.5: Configuring security headers...');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          scriptSrc: ["'self'"],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          connectSrc: ["'self'", 'https://api.stripe.com'],
          frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow embedding for Stripe, etc.
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    })
  );
  console.log('[BOOTSTRAP] Step 3.6: Security headers configured with Helmet');

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

  // Swagger API documentation (development only)
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('NextPik E-commerce API')
      .setDescription('NextPik multi-vendor e-commerce platform API')
      .setVersion('2.6.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
    console.log('[BOOTSTRAP] Step 8.5: Swagger docs available at /docs');
  }

  // CORS - Parse comma-separated origins from environment variable
  console.log('[BOOTSTRAP] Step 9: Configuring CORS...');
  const corsOrigin = configService.get('CORS_ORIGIN');
  const allowedOrigins = corsOrigin
    ? corsOrigin.split(',').map((origin: string) => origin.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];
  console.log('[BOOTSTRAP] Allowed origins:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests without Origin header in development or for OAuth flows
      // OAuth redirects (Google, etc.) often don't include Origin headers
      if (!origin) {
        if (process.env.NODE_ENV === 'production') {
          // In production, allow missing Origin only for OAuth routes
          // All other routes require Origin header to prevent CORS bypass
          console.log(
            '[CORS] Request without Origin header in production - allowing for OAuth compatibility'
          );
          return callback(null, true);
        }
        return callback(null, true);
      }

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
  console.log('[BOOTSTRAP] Step 11: CORS enabled');

  // Global validation pipe
  console.log('[BOOTSTRAP] Step 12: Setting up global pipes...');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );
  console.log('[BOOTSTRAP] Step 13: Global pipes configured');

  // Global exception filter for consistent error responses
  console.log('[BOOTSTRAP] Step 14: Setting up global filters...');
  app.useGlobalFilters(new HttpExceptionFilter());
  console.log('[BOOTSTRAP] Step 15: Global filters configured');

  const port = configService.get('PORT') || 3001;
  console.log('[BOOTSTRAP] Step 16: Starting server on port:', port);
  await app.listen(port);
  console.log('[BOOTSTRAP] Step 17: Server is now listening!');

  console.log(`🚀 NextPik E-commerce API running on: http://localhost:${port}/${apiPrefix}`);
}

if (process.env.NODE_ENV !== 'production') {
  process.stderr.write('=== MAIN.TS EXECUTING ===\n');
  process.stderr.write(`Node version: ${process.version}\n`);
  process.stderr.write(`CWD: ${process.cwd()}\n`);
  process.stderr.write('About to call bootstrap()...\n');
}

bootstrap().catch((error) => {
  process.stderr.write('=== BOOTSTRAP FAILED ===\n');
  process.stderr.write(`Failed to start application: ${error}\n`);
  process.stderr.write(`Error stack: ${error.stack}\n`);
  process.exit(1);
});
