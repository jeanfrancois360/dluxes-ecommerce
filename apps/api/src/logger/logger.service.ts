import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';

/**
 * Custom Logger Service using Winston
 *
 * Features:
 * - Structured JSON logging
 * - Multiple transports (console, file, error file)
 * - Environment-based log levels
 * - Timestamped logs with metadata
 * - Separate error log file
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const isProduction = process.env.NODE_ENV === 'production';

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    );

    // Console format for development (human-readable)
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        const ctx = context ? `[${context}]` : '';
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} ${level} ${ctx} ${message} ${metaStr}`;
      }),
    );

    // Create transports
    const transports: winston.transport[] = [
      // Console transport
      new winston.transports.Console({
        format: isProduction ? logFormat : consoleFormat,
      }),
    ];

    // Add file transports in production
    if (isProduction) {
      // Ensure logs directory exists
      const logsDir = path.join(process.cwd(), 'logs');

      transports.push(
        // Combined log file
        new winston.transports.File({
          filename: path.join(logsDir, 'combined.log'),
          format: logFormat,
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),
        // Error log file
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
          format: logFormat,
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports,
      exitOnError: false,
    });
  }

  /**
   * Log informational messages
   */
  log(message: string, context?: string, meta?: Record<string, any>) {
    this.logger.info(message, { context, ...meta });
  }

  /**
   * Log error messages
   */
  error(message: string, trace?: string, context?: string, meta?: Record<string, any>) {
    this.logger.error(message, { context, trace, ...meta });
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: string, meta?: Record<string, any>) {
    this.logger.warn(message, { context, ...meta });
  }

  /**
   * Log debug messages
   */
  debug(message: string, context?: string, meta?: Record<string, any>) {
    this.logger.debug(message, { context, ...meta });
  }

  /**
   * Log verbose messages
   */
  verbose(message: string, context?: string, meta?: Record<string, any>) {
    this.logger.verbose(message, { context, ...meta });
  }

  /**
   * Log authentication events
   */
  logAuthEvent(
    event: 'login' | 'logout' | 'register' | 'password_reset' | '2fa_enable' | '2fa_disable' | 'session_revoke' | 'backup_code_used',
    userId: string,
    meta?: Record<string, any>,
  ) {
    this.logger.info(`Auth Event: ${event}`, {
      context: 'Authentication',
      event,
      userId,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(
    activity: string,
    userId: string | null,
    ipAddress: string,
    meta?: Record<string, any>,
  ) {
    this.logger.warn(`Suspicious Activity: ${activity}`, {
      context: 'Security',
      activity,
      userId,
      ipAddress,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }

  /**
   * Log API requests (for audit trail)
   */
  logApiRequest(
    method: string,
    path: string,
    statusCode: number,
    userId?: string,
    duration?: number,
    meta?: Record<string, any>,
  ) {
    this.logger.info(`API Request: ${method} ${path}`, {
      context: 'API',
      method,
      path,
      statusCode,
      userId,
      duration,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }

  /**
   * Get the underlying Winston logger instance
   */
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}
