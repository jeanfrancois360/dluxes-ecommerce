import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheck,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';
import { RedisHealthIndicator } from './indicators/redis.health';
import { EmailHealthIndicator } from './indicators/email.health';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Health Check Controller
 *
 * Provides endpoints to monitor application health and service availability.
 * Used by monitoring tools, load balancers, and DevOps for health checks.
 */
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
    private redisHealth: RedisHealthIndicator,
    private emailHealth: EmailHealthIndicator,
  ) {}

  /**
   * Basic health check
   * GET /health
   *
   * Returns overall application health status
   */
  @Get()
  @Public()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Database health check
   * GET /health/db
   *
   * Verifies PostgreSQL database connectivity
   */
  @Get('db')
  @Public()
  @HealthCheck()
  checkDatabase() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }

  /**
   * Redis health check
   * GET /health/redis
   *
   * Verifies Redis cache connectivity
   */
  @Get('redis')
  @Public()
  @HealthCheck()
  checkRedis() {
    return this.health.check([
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }

  /**
   * Email service health check
   * GET /health/email
   *
   * Verifies Resend email service configuration
   */
  @Get('email')
  @Public()
  @HealthCheck()
  checkEmail() {
    return this.health.check([
      () => this.emailHealth.isHealthy('email'),
    ]);
  }

  /**
   * Comprehensive health check
   * GET /health/all
   *
   * Checks all services at once
   */
  @Get('all')
  @Public()
  @HealthCheck()
  checkAll() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.redisHealth.isHealthy('redis'),
      () => this.emailHealth.isHealthy('email'),
    ]);
  }
}
