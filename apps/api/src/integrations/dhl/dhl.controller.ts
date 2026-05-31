import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { DhlRatesService, DhlRateRequest } from './dhl-rates.service';
import { DhlShipmentService, DhlShipmentRequest } from './dhl-shipment.service';
import { DhlTrackingService, TrackingOptions } from './dhl-tracking.service';

/**
 * DHL Express Integration Controller
 * Provides endpoints for DHL shipping rates, shipment creation, and tracking
 *
 * Security:
 * - Rates: Any authenticated user can get shipping rates
 * - Shipments: Only ADMIN or SELLER can create shipments and labels
 * - Tracking: Any authenticated user can track shipments
 * - Health: Only ADMIN can check API health
 */
@Controller('dhl')
export class DhlController {
  private readonly logger = new Logger(DhlController.name);

  constructor(
    private readonly dhlRatesService: DhlRatesService,
    private readonly dhlShipmentService: DhlShipmentService,
    private readonly dhlTrackingService: DhlTrackingService
  ) {}

  /**
   * POST /dhl/rates
   * Get DHL Express shipping rates
   * @auth Any authenticated user
   */
  @Post('rates')
  @UseGuards(JwtAuthGuard)
  async getRates(@Body() request: DhlRateRequest) {
    try {
      if (!this.dhlRatesService.isApiEnabled()) {
        throw new HttpException(
          'DHL Express API is not configured. Please contact support.',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      const rates = await this.dhlRatesService.getSimplifiedRates(request);

      return {
        success: true,
        data: {
          rates,
          count: rates.length,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get DHL rates:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to fetch DHL rates: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /dhl/shipment
   * Create a DHL Express shipment and generate shipping label
   * @auth ADMIN or SELLER only
   */
  @Post('shipment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async createShipment(@Body() request: DhlShipmentRequest) {
    try {
      if (!this.dhlShipmentService.isApiEnabled()) {
        throw new HttpException(
          'DHL Express API is not configured. Please contact support.',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      const shipment = await this.dhlShipmentService.createShipment(request);

      return {
        success: true,
        data: shipment,
      };
    } catch (error) {
      this.logger.error('Failed to create DHL shipment:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to create DHL shipment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /dhl/tracking/:trackingNumber
   * Track a DHL Express shipment
   * @auth Any authenticated user
   */
  @Get('tracking/:trackingNumber')
  @UseGuards(JwtAuthGuard)
  async trackShipment(
    @Param('trackingNumber') trackingNumber: string,
    @Body() options?: TrackingOptions
  ) {
    try {
      const trackingData = await this.dhlTrackingService.trackShipment(trackingNumber, options);

      return {
        success: true,
        data: {
          tracking: trackingData,
          trackingUrl: this.dhlTrackingService.generateTrackingUrl(trackingNumber),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to track DHL shipment ${trackingNumber}:`, error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to track DHL shipment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /dhl/health
   * Validate DHL API credentials and check service health
   * @auth ADMIN only
   */
  @Get('health')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getHealthStatus() {
    try {
      const [ratesHealth, shipmentHealth] = await Promise.all([
        this.dhlRatesService.getHealthStatus(),
        this.dhlShipmentService.getHealthStatus(),
      ]);

      // Test credentials by attempting validation (only if enabled)
      let credentialsValid = false;
      if (ratesHealth.enabled) {
        try {
          credentialsValid = await this.dhlRatesService.validateCredentials();
        } catch (error) {
          this.logger.warn('DHL credentials validation failed:', error.message);
        }
      }

      return {
        success: true,
        data: {
          rates: {
            ...ratesHealth,
            credentialsValid,
          },
          shipments: shipmentHealth,
          overall: {
            healthy: ratesHealth.enabled && credentialsValid,
            message: this.getHealthMessage(ratesHealth.enabled, credentialsValid),
          },
        },
      };
    } catch (error) {
      this.logger.error('Failed to get DHL health status:', error.message);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Helper: Generate health status message
   */
  private getHealthMessage(enabled: boolean, credentialsValid: boolean): string {
    if (!enabled) {
      return 'DHL API is not configured. Set DHL_EXPRESS_API_KEY and DHL_EXPRESS_API_SECRET in .env';
    }

    if (!credentialsValid) {
      return 'DHL API credentials are invalid. Please check your API key and secret.';
    }

    return 'DHL Express API is healthy and ready';
  }
}
