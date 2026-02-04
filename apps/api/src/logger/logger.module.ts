import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

/**
 * Logger Module
 *
 * Provides Winston-based structured logging throughout the application.
 * Marked as @Global so it's available everywhere without importing.
 */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
