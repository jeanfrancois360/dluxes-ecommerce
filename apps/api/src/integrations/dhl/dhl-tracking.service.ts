import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { DeliveryStatus } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';

interface DhlLocation {
  address?: {
    addressLocality?: string; // City
    countryCode?: string;
  };
  servicePoint?: {
    label?: string; // Facility name
  };
}

interface DhlEvent {
  timestamp: string;
  statusCode: string;
  status: string;
  description: string;
  location?: DhlLocation;
}

interface DhlShipment {
  id: string;
  service: string;
  origin: DhlLocation;
  destination: DhlLocation;
  status: {
    timestamp: string;
    statusCode: string;
    status: string;
    description: string;
    location?: DhlLocation;
  };
  estimatedDeliveryDate?: string;
  events: DhlEvent[];
}

interface DhlTrackingResponse {
  shipments: DhlShipment[];
}

interface TrackingOptions {
  service?: string;
  recipientPostalCode?: string;
  originCountryCode?: string;
  language?: string;
}

@Injectable()
export class DhlTrackingService {
  private readonly logger = new Logger(DhlTrackingService.name);
  private apiClient: AxiosInstance;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const baseUrl = this.configService.get<string>('DHL_API_BASE_URL', 'https://api-eu.dhl.com');

    this.apiClient = axios.create({
      baseURL: baseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Check if DHL API is enabled
   */
  private isApiEnabled(): boolean {
    return this.configService.get<boolean>('DHL_TRACKING_ENABLED', false);
  }

  /**
   * Track shipment with retry logic for transient errors
   *
   * @param trackingNumber DHL tracking number
   * @param options Optional parameters to improve tracking accuracy
   * @param retryCount Current retry attempt (internal use)
   * @returns DHL tracking response
   */
  async trackShipment(
    trackingNumber: string,
    options?: TrackingOptions,
    retryCount: number = 0,
  ): Promise<DhlTrackingResponse> {
    const maxRetries = 3;

    if (!this.isApiEnabled()) {
      throw new HttpException(
        'DHL API integration is disabled. Set DHL_TRACKING_ENABLED=true in .env',
        HttpStatus.BAD_REQUEST,
      );
    }

    // ✅ CORRECT: Get API key from environment (NOT OAuth)
    const apiKey = this.configService.get<string>('DHL_API_KEY');

    if (!apiKey) {
      throw new HttpException(
        'DHL API key not configured. Please set DHL_API_KEY in .env file.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Build query parameters
    const params: any = {
      trackingNumber,
      service: options?.service || 'express',
    };

    // Add optional parameters (improves tracking quality)
    if (options?.recipientPostalCode) {
      params.recipientPostalCode = options.recipientPostalCode;
    }

    if (options?.originCountryCode) {
      params.originCountryCode = options.originCountryCode;
    }

    if (options?.language) {
      params.language = options.language;
    }

    try {
      // ✅ CORRECT: Simple API key in header (NOT Bearer token)
      const response = await this.apiClient.get<DhlTrackingResponse>(
        '/track/shipments',
        {
          params,
          headers: {
            'DHL-API-Key': apiKey,  // ✅ Correct header name
          },
        },
      );

      this.logger.log(`DHL tracking data fetched for ${trackingNumber}`);
      return response.data;
    } catch (error) {
      // Retry on rate limit (429) or server errors (5xx)
      const shouldRetry =
        error.response?.status === 429 ||
        (error.response?.status >= 500 && error.response?.status < 600);

      if (shouldRetry && retryCount < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCount) * 1000;

        this.logger.warn(
          `DHL API error ${error.response?.status}. Retrying after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`,
        );

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.trackShipment(trackingNumber, options, retryCount + 1);
      }

      // Log and rethrow error
      this.logger.error(
        `Failed to track DHL shipment ${trackingNumber}:`,
        error.response?.data || error.message,
      );

      if (error.response?.status === 404) {
        throw new HttpException('Tracking number not found', HttpStatus.NOT_FOUND);
      }

      if (error.response?.status === 429) {
        throw new HttpException(
          'DHL API rate limit exceeded. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new HttpException(
          'Invalid DHL API key. Please check your credentials.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      throw new HttpException(
        `Failed to fetch tracking data from DHL: ${error.response?.data?.detail || error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Map DHL status code to DeliveryStatus enum
   */
  private mapDhlStatusToDeliveryStatus(statusCode: string): DeliveryStatus {
    const statusMap: Record<string, DeliveryStatus> = {
      // Pre-transit
      'pre-transit': 'PENDING_PICKUP',
      'PU': 'PICKED_UP',

      // In transit
      'transit': 'IN_TRANSIT',
      'IT': 'IN_TRANSIT',
      'DF': 'IN_TRANSIT', // Departed facility
      'AF': 'IN_TRANSIT', // Arrived at facility

      // Out for delivery
      'OD': 'OUT_FOR_DELIVERY',
      'out-for-delivery': 'OUT_FOR_DELIVERY',

      // Delivered
      'delivered': 'DELIVERED',
      'OK': 'DELIVERED',
      'DL': 'DELIVERED',

      // Failed/Exception
      'failure': 'FAILED_DELIVERY',
      'FD': 'FAILED_DELIVERY',
      'exception': 'EXCEPTION',
      'NH': 'EXCEPTION', // Not home
      'CD': 'EXCEPTION', // Clearance delay

      // Returned
      'RD': 'RETURNED',
      'returned': 'RETURNED',
    };

    return statusMap[statusCode] || 'IN_TRANSIT'; // Default to IN_TRANSIT
  }

  /**
   * Extract location data from DHL location object
   */
  private extractLocation(location?: DhlLocation): Record<string, any> | null {
    if (!location) return null;

    return {
      city: location.address?.addressLocality || null,
      country: location.address?.countryCode || null,
      facility: location.servicePoint?.label || null,
    };
  }

  /**
   * Update delivery record with latest DHL tracking data
   *
   * @param deliveryId Delivery ID to update
   * @param options Optional parameters for DHL API
   */
  async updateDeliveryFromDhl(
    deliveryId: string,
    options?: TrackingOptions,
  ): Promise<void> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: {
        id: true,
        trackingNumber: true,
        currentStatus: true,
      },
    });

    if (!delivery) {
      throw new HttpException('Delivery not found', HttpStatus.NOT_FOUND);
    }

    if (!delivery.trackingNumber) {
      throw new HttpException(
        'Delivery has no tracking number',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Fetch tracking data from DHL
    const trackingResponse = await this.trackShipment(
      delivery.trackingNumber,
      options,
    );

    if (!trackingResponse.shipments || trackingResponse.shipments.length === 0) {
      this.logger.warn(`No DHL tracking data available for delivery ${deliveryId}`);
      return;
    }

    const shipment = trackingResponse.shipments[0];

    // Map DHL status to our DeliveryStatus
    const newStatus = this.mapDhlStatusToDeliveryStatus(shipment.status.statusCode);
    const currentLocation = this.extractLocation(shipment.status.location);

    // Update delivery record
    await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        currentStatus: newStatus,
        dhlServiceType: shipment.service,
        dhlTrackingData: shipment as any, // Store full response
        dhlLastSyncedAt: new Date(),
        dhlEstimatedDelivery: shipment.estimatedDeliveryDate
          ? new Date(shipment.estimatedDeliveryDate)
          : null,
        currentLocation: currentLocation as any,
      },
    });

    // Store tracking events
    if (shipment.events && shipment.events.length > 0) {
      for (const event of shipment.events) {
        const eventLocation = this.extractLocation(event.location);

        // Check if event already exists
        const existingEvent = await this.prisma.deliveryTrackingEvent.findFirst({
          where: {
            deliveryId: deliveryId,
            timestamp: new Date(event.timestamp),
            status: event.statusCode,
          },
        });

        if (!existingEvent) {
          await this.prisma.deliveryTrackingEvent.create({
            data: {
              deliveryId: deliveryId,
              timestamp: new Date(event.timestamp),
              status: event.statusCode,
              statusDescription: event.description || event.status,
              location: eventLocation as any,
              rawEventData: event as any,
            },
          });
        }
      }
    }

    this.logger.log(`Updated delivery ${deliveryId} with DHL tracking data`);
  }

  /**
   * Generate DHL tracking URL for customer
   */
  generateTrackingUrl(trackingNumber: string): string {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}&brand=DHL`;
  }

  /**
   * Sync all active deliveries with DHL API
   * Called by cron job every 10 minutes
   */
  async syncAllActiveDeliveries(): Promise<void> {
    if (!this.isApiEnabled()) {
      this.logger.debug('DHL Tracking API is disabled, skipping sync');
      return;
    }

    const cacheTtl = this.configService.get<number>('DHL_TRACKING_CACHE_TTL', 300);
    const cacheExpiry = new Date(Date.now() - cacheTtl * 1000);

    // Find all active deliveries that need syncing
    const deliveriesToSync = await this.prisma.delivery.findMany({
      where: {
        carrier: 'DHL',
        currentStatus: {
          in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'],
        },
        trackingNumber: {
          not: null,
        },
        OR: [
          { dhlLastSyncedAt: null },
          { dhlLastSyncedAt: { lt: cacheExpiry } },
        ],
      },
      select: {
        id: true,
        trackingNumber: true,
      },
      take: 50, // Process max 50 deliveries per run
    });

    if (deliveriesToSync.length === 0) {
      this.logger.debug('No active deliveries to sync');
      return;
    }

    this.logger.log(`Syncing ${deliveriesToSync.length} active deliveries with DHL API`);

    let successCount = 0;
    let errorCount = 0;

    for (const delivery of deliveriesToSync) {
      try {
        await this.updateDeliveryFromDhl(delivery.id);
        successCount++;

        // Rate limiting: Wait 5 seconds between requests (DHL limit: 1 call per 5 seconds)
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        errorCount++;
        this.logger.error(
          `Failed to sync delivery ${delivery.id}`,
          error.message,
        );
      }
    }

    this.logger.log(
      `DHL sync completed: ${successCount} successful, ${errorCount} failed`,
    );
  }
}
