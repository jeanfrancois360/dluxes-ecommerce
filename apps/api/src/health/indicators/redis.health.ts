import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import Redis from 'ioredis';

/**
 * Redis Health Indicator
 *
 * Custom health indicator to check Redis connectivity
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private redis: Redis;

  constructor() {
    super();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: () => null, // Don't retry on health check
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  /**
   * Check if Redis is healthy by pinging it
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.redis.ping();

      return this.getStatus(key, true, {
        message: 'Redis is healthy',
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      });
    } catch (error) {
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false, {
          message: error.message,
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        }),
      );
    }
  }
}
