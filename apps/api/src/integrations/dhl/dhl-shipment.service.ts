import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../../settings/settings.service';
import { PrismaService } from '../../database/prisma.service';
import axios, { AxiosInstance } from 'axios';

/**
 * DHL Express Shipment Service
 * Creates shipments and generates labels using DHL Express MyDHL API
 *
 * API Documentation: https://developer.dhl.com/api-reference/mydhl-api-dhl-express
 * Authentication: Basic Auth (API Key + Secret)
 */

// Address Interface
export interface DhlAddress {
  name: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  city: string;
  stateOrProvince?: string;
  postalCode: string;
  countryCode: string; // ISO 2-letter code
  phone?: string;
  email?: string;
}

// Package Interface
export interface DhlPackage {
  weight: number; // in KG
  length: number; // in CM
  width: number; // in CM
  height: number; // in CM
  customerReferences?: string[];
}

// Shipment Request Interface
export interface DhlShipmentRequest {
  // Addresses
  shipperAddress: DhlAddress;
  receiverAddress: DhlAddress;

  // Packages
  packages: DhlPackage[];

  // Shipment Options
  productCode: string; // DHL product code (P, U, K, etc.)
  plannedShippingDate: string; // YYYY-MM-DD
  description: string; // Contents description (required for customs)

  // Optional
  declaredValue?: number;
  declaredValueCurrency?: string;
  incoterm?: string; // DDP, DDU, DAP, etc.
  customerReference?: string;

  // Label options
  labelFormat?: 'PDF' | 'PNG' | 'ZPL' | 'EPL';
  labelTemplate?: string; // ECOM26_84_001, etc.
}

// Shipment Response Interface
export interface DhlShipmentResponse {
  shipmentTrackingNumber: string;
  trackingUrl: string;
  dispatchConfirmationNumber?: string;
  packages: Array<{
    trackingNumber: string;
    referenceNumber?: number;
  }>;
  documents: Array<{
    typeCode: string;
    content: string; // Base64 encoded
    format: string;
  }>;
  estimatedDeliveryDate?: string;
  totalPrice?: {
    price: number;
    currency: string;
  };
}

// Pickup Request Interface
export interface DhlPickupRequest {
  plannedPickupDate: string; // YYYY-MM-DD
  pickupTimeFrom: string; // HH:mm
  pickupTimeTo: string; // HH:mm
  pickupAddress: DhlAddress;
  packages: Array<{
    weight: number;
    dimensions?: { length: number; width: number; height: number };
  }>;
  specialInstructions?: string;
}

// Pickup Response Interface
export interface DhlPickupResponse {
  dispatchConfirmationNumber: string;
  readyByTime: string;
  callInTime: string;
}

@Injectable()
export class DhlShipmentService {
  private readonly logger = new Logger(DhlShipmentService.name);
  private apiClient: AxiosInstance;

  // DHL product code descriptions
  private readonly productCodes: Record<string, string> = {
    P: 'DHL Express Worldwide',
    U: 'DHL Express Worldwide',
    D: 'DHL Express Worldwide Document',
    K: 'DHL Express 9:00',
    L: 'DHL Express 10:30',
    Y: 'DHL Express 12:00',
    N: 'DHL Express Domestic',
    G: 'DHL Express Domestic Economy',
    W: 'DHL Express Economy Select',
    I: 'DHL Express Domestic 9:00',
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService,
    private readonly prisma: PrismaService
  ) {
    this.apiClient = axios.create({
      timeout: 60000, // 60 seconds for shipment creation
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    this.logger.log('DHL Shipment Service initialized');
  }

  /**
   * Get DHL API base URL based on environment setting
   */
  private async getApiBaseUrl(): Promise<string> {
    try {
      const envSetting = await this.settingsService.getSetting('dhl_api_environment');
      const environment = String(envSetting.value);

      return environment === 'production'
        ? 'https://express.api.dhl.com/mydhlapi'
        : 'https://express.api.dhl.com/mydhlapi/test';
    } catch {
      const env = this.configService.get<string>('DHL_API_ENVIRONMENT', 'sandbox');
      return env === 'production'
        ? 'https://express.api.dhl.com/mydhlapi'
        : 'https://express.api.dhl.com/mydhlapi/test';
    }
  }

  /**
   * Get DHL API credentials from environment variables ONLY
   */
  private getApiCredentials(): { apiKey: string; apiSecret: string } | null {
    const apiKey = this.configService.get<string>('DHL_EXPRESS_API_KEY');
    const apiSecret = this.configService.get<string>('DHL_EXPRESS_API_SECRET');

    if (apiKey && apiSecret) {
      return { apiKey, apiSecret };
    }

    return null;
  }

  /**
   * Get DHL account number from environment
   */
  private getAccountNumber(): string | null {
    return this.configService.get<string>('DHL_ACCOUNT_NUMBER') || null;
  }

  /**
   * Check if shipment API is enabled
   */
  isApiEnabled(): boolean {
    return this.getApiCredentials() !== null;
  }

  /**
   * Create a DHL Express shipment
   *
   * @param request Shipment request parameters
   * @returns Shipment response with tracking number and labels
   */
  async createShipment(request: DhlShipmentRequest): Promise<DhlShipmentResponse> {
    const credentials = this.getApiCredentials();

    if (!credentials) {
      throw new HttpException(
        'DHL Express API is not configured. Please set DHL_EXPRESS_API_KEY and DHL_EXPRESS_API_SECRET.',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    const { apiKey, apiSecret } = credentials;
    const accountNumber = this.getAccountNumber();
    const baseUrl = await this.getApiBaseUrl();
    const isSandbox = baseUrl.includes('/test');

    // Build shipment payload according to DHL API specification
    const payload: any = {
      plannedShippingDateAndTime: `${request.plannedShippingDate}T10:00:00 GMT+00:00`,
      pickup: {
        isRequested: false, // Can be changed to true if pickup is needed
      },
      productCode: request.productCode,
      localProductCode: request.productCode,
      accounts: [
        {
          // Use 'shipper' when shipping FROM Belgium (account country)
          typeCode: 'shipper',
          number: accountNumber || '123456789',
        },
      ],
    };

    payload.customerDetails = {
      shipperDetails: {
        postalAddress: {
          postalCode: request.shipperAddress.postalCode,
          cityName: request.shipperAddress.city,
          countryCode: request.shipperAddress.countryCode,
          addressLine1: request.shipperAddress.addressLine1,
          addressLine2: request.shipperAddress.addressLine2,
          addressLine3: request.shipperAddress.addressLine3,
          provinceCode: request.shipperAddress.stateOrProvince,
        },
        contactInformation: {
          phone: request.shipperAddress.phone || '',
          companyName: request.shipperAddress.company || request.shipperAddress.name,
          fullName: request.shipperAddress.name,
          email: request.shipperAddress.email,
        },
      },
      receiverDetails: {
        postalAddress: {
          postalCode: request.receiverAddress.postalCode,
          cityName: request.receiverAddress.city,
          countryCode: request.receiverAddress.countryCode,
          addressLine1: request.receiverAddress.addressLine1,
          addressLine2: request.receiverAddress.addressLine2,
          addressLine3: request.receiverAddress.addressLine3,
          provinceCode: request.receiverAddress.stateOrProvince,
        },
        contactInformation: {
          phone: request.receiverAddress.phone || '',
          companyName: request.receiverAddress.company || request.receiverAddress.name,
          fullName: request.receiverAddress.name,
          email: request.receiverAddress.email,
        },
      },
    };

    payload.content = {
      packages: request.packages.map((pkg, index) => ({
        weight: pkg.weight,
        dimensions: {
          length: pkg.length,
          width: pkg.width,
          height: pkg.height,
        },
        customerReferences: pkg.customerReferences || [
          { value: request.customerReference || `PKG-${index + 1}` },
        ],
      })),
      isCustomsDeclarable:
        request.shipperAddress.countryCode !== request.receiverAddress.countryCode,
      description: request.description,
      incoterm: request.incoterm || 'DAP',
      unitOfMeasurement: 'metric',
    };

    payload.outputImageProperties = {
      imageOptions: [
        {
          typeCode: 'label',
          templateName: request.labelTemplate || 'ECOM26_84_001',
        },
        {
          typeCode: 'waybillDoc',
          templateName: 'ARCH_8X4_A4_002',
          isRequested: true,
        },
      ],
    };

    payload.customerReferences = request.customerReference
      ? [{ value: request.customerReference, typeCode: 'CU' }]
      : undefined;

    // Add declared value if provided (for customs)
    if (request.declaredValue && request.declaredValue > 0) {
      (payload.content as any).declaredValue = request.declaredValue;
      (payload.content as any).declaredValueCurrency = request.declaredValueCurrency || 'USD';
    }

    try {
      const authToken = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

      this.logger.debug(
        `Creating DHL shipment: ${request.shipperAddress.countryCode} → ${request.receiverAddress.countryCode}`
      );

      const response = await this.apiClient.post(`${baseUrl}/shipments`, payload, {
        headers: {
          Authorization: `Basic ${authToken}`,
        },
      });

      const data = response.data;

      // Extract tracking number and documents
      const result: DhlShipmentResponse = {
        shipmentTrackingNumber: data.shipmentTrackingNumber,
        trackingUrl: `https://www.dhl.com/en/express/tracking.html?AWB=${data.shipmentTrackingNumber}&brand=DHL`,
        dispatchConfirmationNumber: data.dispatchConfirmationNumber,
        packages:
          data.packages?.map((pkg: any) => ({
            trackingNumber: pkg.trackingNumber,
            referenceNumber: pkg.referenceNumber,
          })) || [],
        documents:
          data.documents?.map((doc: any) => ({
            typeCode: doc.typeCode,
            content: doc.content,
            format: doc.format || 'PDF',
          })) || [],
        estimatedDeliveryDate: data.estimatedDeliveryDate?.estimatedDeliveryDate,
        totalPrice: data.shipmentCharges?.[0]
          ? {
              price: data.shipmentCharges[0].price,
              currency: data.shipmentCharges[0].currencyType,
            }
          : undefined,
      };

      this.logger.log(`DHL shipment created successfully: ${result.shipmentTrackingNumber}`);
      return result;
    } catch (error: any) {
      this.logger.error('DHL Shipment API error:', error.response?.data || error.message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new HttpException('Invalid DHL API credentials.', HttpStatus.UNAUTHORIZED);
      }

      if (error.response?.status === 400) {
        const errorDetail =
          error.response?.data?.detail ||
          error.response?.data?.message ||
          error.response?.data?.additionalDetails?.[0]?.message ||
          'Invalid shipment request';
        throw new HttpException(`DHL API error: ${errorDetail}`, HttpStatus.BAD_REQUEST);
      }

      if (error.response?.status === 422) {
        const detail = error.response?.data?.detail || 'Validation error';
        const additionalDetails = error.response?.data?.additionalDetails || [];

        // Format additional validation errors
        const detailedErrors = additionalDetails
          .map((err: any, index: number) => `${index + 1}. ${err.message || JSON.stringify(err)}`)
          .join('\n');

        const fullErrorMessage = detailedErrors
          ? `${detail}\n\nDetails:\n${detailedErrors}`
          : detail;

        this.logger.error('DHL Validation Error:', fullErrorMessage);

        throw new HttpException(
          `DHL validation error: ${fullErrorMessage}`,
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      }

      throw new HttpException(
        `Failed to create DHL shipment: ${error.response?.data?.detail || error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Cancel a DHL shipment
   *
   * @param trackingNumber The shipment tracking number
   * @returns True if cancellation was successful
   */
  async cancelShipment(trackingNumber: string): Promise<boolean> {
    const credentials = this.getApiCredentials();

    if (!credentials) {
      throw new HttpException('DHL Express API is not configured.', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const { apiKey, apiSecret } = credentials;

    try {
      const authToken = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
      const baseUrl = await this.getApiBaseUrl();

      this.logger.debug(`Cancelling DHL shipment: ${trackingNumber}`);

      await this.apiClient.delete(`${baseUrl}/shipments/${trackingNumber}`, {
        headers: {
          Authorization: `Basic ${authToken}`,
        },
      });

      this.logger.log(`DHL shipment cancelled: ${trackingNumber}`);
      return true;
    } catch (error: any) {
      this.logger.error('DHL Cancel Shipment error:', error.response?.data || error.message);

      if (error.response?.status === 404) {
        throw new HttpException('Shipment not found or already cancelled.', HttpStatus.NOT_FOUND);
      }

      if (error.response?.status === 400) {
        throw new HttpException(
          'Shipment cannot be cancelled (may have been picked up).',
          HttpStatus.BAD_REQUEST
        );
      }

      throw new HttpException(
        `Failed to cancel DHL shipment: ${error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Request a DHL pickup
   *
   * @param request Pickup request parameters
   * @returns Pickup confirmation
   */
  async requestPickup(request: DhlPickupRequest): Promise<DhlPickupResponse> {
    const credentials = this.getApiCredentials();

    if (!credentials) {
      throw new HttpException('DHL Express API is not configured.', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const { apiKey, apiSecret } = credentials;
    const accountNumber = this.getAccountNumber();

    if (!accountNumber) {
      throw new HttpException(
        'DHL account number is required for pickup requests.',
        HttpStatus.BAD_REQUEST
      );
    }

    const payload = {
      plannedPickupDateAndTime: `${request.plannedPickupDate}T${request.pickupTimeFrom}:00`,
      closeTime: request.pickupTimeTo,
      location: 'reception',
      locationType: 'business',
      accounts: [
        {
          typeCode: 'shipper',
          number: accountNumber,
        },
      ],
      customerDetails: {
        shipperDetails: {
          postalAddress: {
            postalCode: request.pickupAddress.postalCode,
            cityName: request.pickupAddress.city,
            countryCode: request.pickupAddress.countryCode,
            addressLine1: request.pickupAddress.addressLine1,
          },
          contactInformation: {
            phone: request.pickupAddress.phone || '',
            companyName: request.pickupAddress.company || request.pickupAddress.name,
            fullName: request.pickupAddress.name,
          },
        },
      },
      shipmentDetails: request.packages.map((pkg) => ({
        productCode: 'P',
        isCustomsDeclarable: false,
        unitOfMeasurement: 'metric',
        packages: [
          {
            weight: pkg.weight,
            dimensions: pkg.dimensions,
          },
        ],
      })),
      specialInstructions: request.specialInstructions
        ? [{ value: request.specialInstructions }]
        : undefined,
    };

    try {
      const authToken = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
      const baseUrl = await this.getApiBaseUrl();

      this.logger.debug(`Requesting DHL pickup for ${request.plannedPickupDate}`);

      const response = await this.apiClient.post(`${baseUrl}/pickups`, payload, {
        headers: {
          Authorization: `Basic ${authToken}`,
        },
      });

      const data = response.data;

      this.logger.log(`DHL pickup scheduled: ${data.dispatchConfirmationNumber}`);

      return {
        dispatchConfirmationNumber: data.dispatchConfirmationNumber,
        readyByTime: data.readyByTime,
        callInTime: data.callInTime,
      };
    } catch (error: any) {
      this.logger.error('DHL Pickup API error:', error.response?.data || error.message);

      throw new HttpException(
        `Failed to request DHL pickup: ${error.response?.data?.detail || error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get shipment label by tracking number
   * Useful for reprinting labels
   *
   * @param trackingNumber The shipment tracking number
   * @returns Label document in base64
   */
  async getShipmentLabel(trackingNumber: string): Promise<{ content: string; format: string }> {
    const credentials = this.getApiCredentials();

    if (!credentials) {
      throw new HttpException('DHL Express API is not configured.', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const { apiKey, apiSecret } = credentials;

    try {
      const authToken = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
      const baseUrl = await this.getApiBaseUrl();

      const response = await this.apiClient.get(`${baseUrl}/shipments/${trackingNumber}/image`, {
        headers: {
          Authorization: `Basic ${authToken}`,
        },
        params: {
          typeCode: 'label',
          encodingFormat: 'PDF',
        },
      });

      return {
        content: response.data.documents?.[0]?.content || '',
        format: 'PDF',
      };
    } catch (error: any) {
      this.logger.error('DHL Get Label error:', error.response?.data || error.message);

      throw new HttpException(
        `Failed to retrieve DHL label: ${error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get DHL product code description
   */
  getProductDescription(productCode: string): string {
    return this.productCodes[productCode] || `DHL Express (${productCode})`;
  }

  /**
   * Get API health status for shipment service
   */
  async getHealthStatus(): Promise<{
    enabled: boolean;
    configured: boolean;
    accountNumber: boolean;
    environment: string;
  }> {
    const credentials = this.getApiCredentials();
    const accountNumber = this.getAccountNumber();
    const environment = this.configService.get<string>('DHL_API_ENVIRONMENT', 'sandbox');

    return {
      enabled: credentials !== null,
      configured: credentials !== null,
      accountNumber: accountNumber !== null && accountNumber !== '',
      environment,
    };
  }
}
