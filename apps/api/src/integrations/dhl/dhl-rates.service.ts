import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../../settings/settings.service';
import axios, { AxiosInstance } from 'axios';

/**
 * DHL Express Rates Service
 * Calculates shipping rates using DHL Express MyDHL API
 *
 * API Documentation: https://developer.dhl.com/api-reference/mydhl-api-dhl-express
 * Authentication: Basic Auth (API Key + Secret)
 */

export interface DhlRateRequest {
  // Origin address
  originCountryCode: string;
  originPostalCode: string;
  originCityName?: string;

  // Destination address
  destinationCountryCode: string;
  destinationPostalCode: string;
  destinationCityName?: string;

  // Shipment details
  weight: number; // in KG
  length?: number; // in CM
  width?: number; // in CM
  height?: number; // in CM

  // Optional
  accountNumber?: string;
  plannedShippingDate?: string; // YYYY-MM-DD
  isCustomsDeclarable?: boolean;
  unitOfMeasurement?: 'metric' | 'imperial';
}

export interface DhlRateProduct {
  productName: string;
  productCode: string;
  localProductCode?: string;
  networkTypeCode?: string;
  isCustomerAgreement: boolean;

  // Pricing
  totalPrice: {
    price: number;
    priceCurrency: string;
  };

  // Delivery time
  deliveryCapabilities: {
    deliveryTypeCode: string;
    estimatedDeliveryDateAndTime?: string;
    destinationServiceAreaCode?: string;
    destinationFacilityAreaCode?: string;
    deliveryAdditionalDays?: number;
    deliveryDayOfWeek?: number;
    totalTransitDays?: number;
  };

  // Detailed breakdown (optional)
  breakdown?: {
    priceBreakdown: Array<{
      typeCode: string;
      price: number;
      priceBreakdown?: Array<{
        typeCode: string;
        price: number;
      }>;
    }>;
  };
}

export interface DhlRateResponse {
  products: DhlRateProduct[];
}

export interface SimplifiedDhlRate {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  estimatedDays: number;
  carrier: string;
  productCode: string;
  estimatedDeliveryDate?: Date;
}

@Injectable()
export class DhlRatesService {
  private readonly logger = new Logger(DhlRatesService.name);
  private apiClient: AxiosInstance;
  private readonly productNames: Record<string, string> = {
    // DHL Express product codes
    'N': 'DHL Express Domestic',
    'P': 'DHL Express Worldwide',
    'D': 'DHL Express Worldwide Document',
    'U': 'DHL Express Worldwide',
    'K': 'DHL Express 9:00',
    'L': 'DHL Express 10:30',
    'G': 'DHL Express Domestic Economy',
    'W': 'DHL Express Economy Select',
    'I': 'DHL Express Domestic 9:00',
    'Y': 'DHL Express 12:00',
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService
  ) {
    // API client will be configured dynamically
    this.apiClient = axios.create({
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    this.logger.log('DHL Rates Service initialized');
  }

  /**
   * Get DHL API base URL based on environment setting
   * SECURITY: Environment preference from database, but NEVER credentials
   */
  private async getApiBaseUrl(): Promise<string> {
    try {
      const envSetting = await this.settingsService.getSetting('dhl_api_environment');
      const environment = String(envSetting.value);

      return environment === 'production'
        ? 'https://express.api.dhl.com/mydhlapi'
        : 'https://express.api.dhl.com/mydhlapi/test';
    } catch (error) {
      // Fallback to env variable if setting not found
      const env = this.configService.get<string>('DHL_API_ENVIRONMENT', 'sandbox');
      return env === 'production'
        ? 'https://express.api.dhl.com/mydhlapi'
        : 'https://express.api.dhl.com/mydhlapi/test';
    }
  }

  /**
   * Get DHL API credentials from environment variables ONLY
   * SECURITY: NEVER retrieve credentials from database
   */
  private getApiCredentials(): { apiKey: string; apiSecret: string } | null {
    // SECURITY: Only use environment variables for API credentials
    const apiKey = this.configService.get<string>('DHL_EXPRESS_API_KEY');
    const apiSecret = this.configService.get<string>('DHL_EXPRESS_API_SECRET');

    if (apiKey && apiSecret) {
      return { apiKey, apiSecret };
    }

    return null;
  }

  /**
   * Check if DHL Rates API is enabled and configured
   * SECURITY: Only checks environment variables
   */
  isApiEnabled(): boolean {
    const credentials = this.getApiCredentials();
    return credentials !== null;
  }

  /**
   * Get DHL Express shipping rates
   *
   * @param request Rate request parameters
   * @returns Array of available DHL products with rates
   */
  async getRates(request: DhlRateRequest): Promise<DhlRateResponse> {
    // SECURITY: Only get credentials from environment variables
    const credentials = this.getApiCredentials();

    if (!credentials) {
      throw new HttpException(
        'DHL Express API is not configured. Please set DHL_EXPRESS_API_KEY and DHL_EXPRESS_API_SECRET in .env file.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const { apiKey, apiSecret } = credentials;

    // Get account number from env only (also sensitive)
    const accountNumber = request.accountNumber || this.configService.get<string>('DHL_ACCOUNT_NUMBER', '');

    // Build request payload according to DHL API specification
    const payload = {
      customerDetails: {
        shipperDetails: {
          postalCode: request.originPostalCode,
          cityName: request.originCityName || '',
          countryCode: request.originCountryCode,
        },
        receiverDetails: {
          postalCode: request.destinationPostalCode,
          cityName: request.destinationCityName || '',
          countryCode: request.destinationCountryCode,
        },
      },
      accounts: accountNumber ? [{ typeCode: 'shipper', number: accountNumber }] : [],

      // Shipment details
      plannedShippingDateAndTime: request.plannedShippingDate || new Date().toISOString().split('T')[0],
      unitOfMeasurement: request.unitOfMeasurement || 'metric',
      isCustomsDeclarable: request.isCustomsDeclarable ?? (request.originCountryCode !== request.destinationCountryCode),

      // Package details
      packages: [
        {
          weight: request.weight,
          dimensions: {
            length: request.length || 10,
            width: request.width || 10,
            height: request.height || 10,
          },
        },
      ],

      // Request all products and delivery options
      productCode: undefined, // Don't filter, get all available products
      requestAllValueAddedServices: false, // We just need basic rates
      estimatedDeliveryDate: {
        isRequested: true, // Request estimated delivery dates
        typeCode: 'QDDF', // Quoted delivery date and time
      },
    };

    try {
      // Create Basic Auth credentials
      const authToken = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

      this.logger.debug(`Requesting DHL rates: ${request.originCountryCode} → ${request.destinationCountryCode}, ${request.weight}kg`);

      const baseUrl = await this.getApiBaseUrl();
      const response = await this.apiClient.post<DhlRateResponse>(
        `${baseUrl}/rates`,
        payload,
        {
          headers: {
            'Authorization': `Basic ${authToken}`,
          },
        },
      );

      this.logger.log(`DHL rates fetched successfully: ${response.data.products?.length || 0} products available`);
      return response.data;

    } catch (error) {
      this.logger.error('DHL Rates API error:', error.response?.data || error.message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new HttpException(
          'Invalid DHL API credentials. Please check DHL_EXPRESS_API_KEY and DHL_EXPRESS_API_SECRET.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Invalid request parameters';
        throw new HttpException(
          `DHL API request error: ${errorMessage}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (error.response?.status === 429) {
        throw new HttpException(
          'DHL API rate limit exceeded. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new HttpException(
        `Failed to fetch DHL rates: ${error.response?.data?.detail || error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get simplified rate options for checkout
   * Converts DHL API response to a format compatible with our shipping options
   *
   * @param request Rate request parameters
   * @returns Simplified rate options
   */
  async getSimplifiedRates(request: DhlRateRequest): Promise<SimplifiedDhlRate[]> {
    try {
      const rateResponse = await this.getRates(request);

      if (!rateResponse.products || rateResponse.products.length === 0) {
        this.logger.warn('No DHL products available for the given route');
        return [];
      }

      // Convert DHL products to our simplified format
      const simplifiedRates = rateResponse.products.map((product) => {
        const productName = this.productNames[product.productCode] || product.productName;
        const estimatedDays = product.deliveryCapabilities.totalTransitDays || 3;

        let deliveryDate: Date | undefined;
        if (product.deliveryCapabilities.estimatedDeliveryDateAndTime) {
          deliveryDate = new Date(product.deliveryCapabilities.estimatedDeliveryDateAndTime);
        }

        // Determine description based on transit time
        let description = `${estimatedDays} business days`;
        if (estimatedDays === 1) {
          description = 'Next business day';
        } else if (estimatedDays === 2) {
          description = '2 business days';
        } else if (estimatedDays <= 3) {
          description = '2-3 business days';
        } else if (estimatedDays <= 7) {
          description = '5-7 business days';
        } else {
          description = `${estimatedDays} business days`;
        }

        return {
          id: `dhl-${product.productCode.toLowerCase()}`,
          name: productName,
          description,
          price: product.totalPrice.price,
          currency: product.totalPrice.priceCurrency,
          estimatedDays,
          carrier: 'DHL Express',
          productCode: product.productCode,
          estimatedDeliveryDate: deliveryDate,
        };
      });

      // Sort by price (cheapest first)
      simplifiedRates.sort((a, b) => a.price - b.price);

      this.logger.log(`Converted ${simplifiedRates.length} DHL rates to simplified format`);
      return simplifiedRates;

    } catch (error) {
      // If DHL API fails, log error and return empty array (fallback to manual rates)
      this.logger.error('Failed to get simplified DHL rates:', error.message);
      throw error; // Re-throw so caller can handle fallback
    }
  }

  /**
   * Calculate shipping cost for a single route
   * Convenience method that returns the cheapest available option
   *
   * @param request Rate request parameters
   * @returns Cheapest available rate or null if none available
   */
  async getCheapestRate(request: DhlRateRequest): Promise<SimplifiedDhlRate | null> {
    try {
      const rates = await this.getSimplifiedRates(request);

      if (rates.length === 0) {
        return null;
      }

      // Return cheapest option (already sorted by price)
      return rates[0];

    } catch (error) {
      this.logger.error('Failed to get cheapest DHL rate:', error.message);
      return null;
    }
  }

  /**
   * Validate DHL API credentials
   * Makes a test API call to verify credentials are working
   *
   * @returns true if credentials are valid
   */
  async validateCredentials(): Promise<boolean> {
    if (!this.isApiEnabled()) {
      return false;
    }

    try {
      // Test with a simple rate request (US domestic)
      await this.getRates({
        originCountryCode: 'US',
        originPostalCode: '10001',
        destinationCountryCode: 'US',
        destinationPostalCode: '90001',
        weight: 1,
      });

      return true;
    } catch (error) {
      this.logger.error('DHL credentials validation failed:', error.message);
      return false;
    }
  }

  /**
   * Get DHL API health status
   *
   * @returns API health information
   */
  async getHealthStatus(): Promise<{
    enabled: boolean;
    configured: boolean;
    credentialsValid?: boolean;
    environment: string;
  }> {
    const enabled = this.isApiEnabled();
    const environment = this.configService.get<string>('DHL_API_ENVIRONMENT', 'test');

    if (!enabled) {
      return {
        enabled: false,
        configured: false,
        environment,
      };
    }

    let credentialsValid: boolean | undefined;
    try {
      credentialsValid = await this.validateCredentials();
    } catch (error) {
      credentialsValid = false;
    }

    return {
      enabled: true,
      configured: true,
      credentialsValid,
      environment,
    };
  }
}
