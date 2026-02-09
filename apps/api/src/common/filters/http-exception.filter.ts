import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Global exception filter to ensure consistent error responses
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = undefined;
    let extra: Record<string, any> = {};

    // Handle NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, any>;
        message = resp.message || exception.message;
        errors = resp.errors;
        // Pass through any extra fields (e.g. canResend, resendEmail)
        const { message: _m, statusCode: _s, error: _e, errors: _er, ...rest } = resp;
        extra = rest;
      } else {
        message = exceptionResponse as string;
      }
    }
    // Handle Prisma errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;

      switch (exception.code) {
        case 'P2002':
          // Unique constraint violation
          const field = exception.meta?.target as string[] | undefined;
          message = field
            ? `A record with this ${field.join(', ')} already exists`
            : 'This record already exists';
          break;
        case 'P2025':
          // Record not found
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          break;
        case 'P2003':
          // Foreign key constraint violation
          message = 'Referenced record not found';
          break;
        case 'P2014':
          // Required relation violation
          message = 'Related record is required';
          break;
        default:
          message = 'Database operation failed';
      }

      this.logger.error(`Prisma error ${exception.code}: ${exception.message}`, exception.stack);
    }
    // Handle Prisma validation errors
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      // Extract more helpful error message from Prisma validation error
      const errorMessage = exception.message;
      if (errorMessage.includes('Argument')) {
        // Try to extract field name from error message
        const match = errorMessage.match(/Argument `(\w+)`/);
        if (match) {
          message = `Invalid value for field: ${match[1]}`;
        } else {
          message = 'Invalid data provided. Please check your input fields.';
        }
      } else {
        message = 'Invalid data provided. Please check all required fields.';
      }
      this.logger.error(`Prisma validation error: ${exception.message}`, exception.stack);
    }
    // Handle other errors
    else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.message, exception.stack);
    }

    // Log error for monitoring
    this.logger.error(`${request.method} ${request.url} - Status: ${status} - Message: ${message}`);

    // Send consistent error response
    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      ...(errors && { errors }),
      ...extra,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
