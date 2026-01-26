import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { SettingsService } from '../../settings/settings.service';
import { DeliveryStatus } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';

interface DhlOAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number; // Timestamp when token expires
}

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

@Injectable()
export class DhlTrackingService {
  private readonly logger = new Logger(DhlTrackingService.name);
  private httpClient: AxiosInstance;
  private tokenCache: DhlOAuthToken | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly configService: ConfigService,
  ) {
    this.httpClient = axios.create({
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get OAuth 2.0 access token with caching
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.tokenCache && this.tokenCache.expires_at > Date.now()) {
      this.logger.debug('Using cached DHL OAuth token');
      return this.tokenCache.access_token;
    }

    // Fetch fresh token from DHL API using environment variables
    const apiKey = this.configService.get<string>('DHL_API_KEY');
    const apiSecret = this.configService.get<string>('DHL_API_SECRET');
    const baseUrl = this.configService.get<string>('DHL_API_BASE_URL', 'https://api-eu.dhl.com');

    if (!apiKey || !apiSecret) {
      throw new HttpException(
        'DHL API credentials not configured. Please configure in System Settings.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      this.logger.log('Fetching new DHL OAuth token...');

      const response = await this.httpClient.post(
        `${baseUrl}/oauth/token`,
        {
          grant_type: 'client_credentials',
        },
        {
          auth: {
            username: apiKey,
            password: apiSecret,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const { access_token, token_type, expires_in } = response.data;

      // Cache token with 5-minute buffer before expiration
      this.tokenCache = {
        access_token,
        token_type,
        expires_in,
        expires_at: Date.now() + (expires_in - 300) * 1000,
      };

      this.logger.log('Successfully obtained DHL OAuth token');
      return access_token;
    } catch (error) {
      this.logger.error('Failed to obtain DHL OAuth token', error.response?.data || error.message);
      throw new HttpException(
        'Failed to authenticate with DHL API',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Track a shipment by tracking number
   */
  async trackShipment(trackingNumber: string): Promise<DhlShipment | null> {
    const apiEnabled = this.configService.get<boolean>('DHL_TRACKING_ENABLED', false);

    if (!apiEnabled) {
      this.logger.warn('DHL Tracking API is disabled in environment config');
      return null;
    }

    try {
      const accessToken = await this.getAccessToken();
      const baseUrl = this.configService.get<string>('DHL_API_BASE_URL', 'https://api-eu.dhl.com');

      this.logger.log(`Tracking shipment: ${trackingNumber}`);

      const response = await this.httpClient.get<DhlTrackingResponse>(
        `${baseUrl}/track/shipments`,
        {
          params: {
            trackingNumber,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.data.shipments && response.data.shipments.length > 0) {
        const shipment = response.data.shipments[0];
        this.logger.log(`Successfully tracked shipment: ${trackingNumber}`);
        return shipment;
      }

      this.logger.warn(`No tracking data found for: ${trackingNumber}`);
      return null;
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.warn(`Tracking number not found: ${trackingNumber}`);
        return null;
      }

      this.logger.error(
        `Failed to track shipment ${trackingNumber}`,
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to fetch tracking data from DHL',
        HttpStatus.SERVICE_UNAVAILABLE,
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
   */
  async updateDeliveryFromDhl(deliveryId: string): Promise<void> {
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
    const shipment = await this.trackShipment(delivery.trackingNumber);

    if (!shipment) {
      this.logger.warn(`No DHL tracking data available for delivery ${deliveryId}`);
      return;
    }

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
    const apiEnabled = this.configService.get<boolean>('DHL_TRACKING_ENABLED', false);

    if (!apiEnabled) {
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
