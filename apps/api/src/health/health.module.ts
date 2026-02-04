import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './indicators/redis.health';
import { EmailHealthIndicator } from './indicators/email.health';
import { DatabaseModule } from '../database/database.module';

/**
 * Health Check Module
 *
 * Provides health check endpoints for monitoring application status
 * and service availability.
 */
@Module({
  imports: [
    TerminusModule,
    HttpModule,
    DatabaseModule,
  ],
  controllers: [HealthController],
  providers: [
    RedisHealthIndicator,
    EmailHealthIndicator,
  ],
})
export class HealthModule {}
