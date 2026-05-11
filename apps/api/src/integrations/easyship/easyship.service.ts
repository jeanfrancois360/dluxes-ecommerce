import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import axios, { AxiosInstance } from 'axios';

// Easyship supported ship-from countries
export const EASYSHIP_SUPPORTED_COUNTRIES = [
  'AU', // Australia
  'BE', // Belgium
  'CA', // Canada
  'FR', // France
  'DE', // Germany
  'HK', // Hong Kong
  'NL', // Netherlands
  'SG', // Singapore
  'US', // United States
  'GB', // United Kingdom
];

export interface EasyshipRate {
  provider: 'easyship';
  serviceCode: string; // courier_id
  serviceName: string; // courier_name
  carrierName: string; // courier_name
  totalCharge: number;
  currency: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
}

export interface EasyshipGetRatesRequest {
  fromCountry: string;
  fromCity?: string;
  fromPostalCode?: string;
  fromState?: string;
  toCountry: string;
  toCity?: string;
  toPostalCode?: string;
  weightKg: number;
  items: Array<{
    quantity: number;
    value: number;
    name: string;
  }>;
}

@Injectable()
export class EasyshipService {
  private readonly logger = new Logger(EasyshipService.name);
  private client: AxiosInstance | null = null;
  private readonly productionBaseUrl = 'https://public-api.easyship.com/2024-09';
  private readonly sandboxBaseUrl = 'https://public-api-sandbox.easyship.com/2024-09';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.initializeClient();
  }

  /**
   * Initialize Easyship API client with Bearer token
   * Automatically selects sandbox or production base URL based on key prefix
   */
  private initializeClient(): void {
    const apiKey = this.configService.get<string>('EASYSHIP_API_KEY');

    if (!apiKey) {
      this.logger.warn('Easyship API key not configured. Set EASYSHIP_API_KEY');
      return;
    }

    const isSandbox = apiKey.startsWith('sand_');
    const baseURL = isSandbox ? this.sandboxBaseUrl : this.productionBaseUrl;

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 30000, // EasyShip API can be slow — allow 30s
    });

    this.logger.log(`Easyship client initialized (${isSandbox ? 'sandbox' : 'production'})`);
  }

  /**
   * Check if Easyship supports a given ship-from country
   */
  isCountrySupported(countryCode: string): boolean {
    return EASYSHIP_SUPPORTED_COUNTRIES.includes(countryCode.toUpperCase());
  }

  /**
   * Check if Easyship is configured
   */
  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Get shipping rates from Easyship
   */
  async getRates(request: EasyshipGetRatesRequest): Promise<EasyshipRate[]> {
    if (!this.client) {
      throw new Error('Easyship is not configured');
    }

    if (!this.isCountrySupported(request.fromCountry)) {
      throw new Error(
        `Easyship does not support shipping from ${request.fromCountry}. ` +
          `Supported countries: ${EASYSHIP_SUPPORTED_COUNTRIES.join(', ')}`
      );
    }

    try {
      // POST /2024-09/rates — v2024-09 format
      const originAddress: any = {
        country_alpha2: request.fromCountry.toUpperCase(),
        city: request.fromCity || 'City',
        postal_code: request.fromPostalCode || '1000',
      };
      if (request.fromState) originAddress.state = request.fromState;

      const destinationAddress: any = {
        country_alpha2: request.toCountry.toUpperCase(),
        city: request.toCity || 'City',
        postal_code: request.toPostalCode || '1000',
      };

      const response = await this.client.post('/rates', {
        origin_address: originAddress,
        destination_address: destinationAddress,
        incoterms: 'DDU',
        parcels: [
          {
            total_actual_weight: request.weightKg,
            items: request.items.map((item) => ({
              quantity: item.quantity,
              declared_currency: 'USD',
              declared_customs_value: item.value,
              hs_code: '621790', // Generic HS code for miscellaneous goods
              dimensions: { length: 10, width: 10, height: 10 },
            })),
          },
        ],
      });

      const rates = response.data?.rates || [];

      if (rates.length === 0) {
        this.logger.warn(
          `No Easyship rates found for ${request.fromCountry} → ${request.toCountry}`
        );
        return [];
      }

      // Map to our EasyshipRate format — v2024-09 response structure
      const easyshipRates: EasyshipRate[] = rates.map((rate: any) => ({
        provider: 'easyship' as const,
        serviceCode: rate.courier_service?.id || rate.courier_service?.courier_id,
        serviceName: rate.courier_service?.name || rate.courier_service?.umbrella_name,
        carrierName: rate.courier_service?.umbrella_name || rate.courier_service?.name,
        totalCharge: parseFloat(rate.total_charge || rate.shipment_charge || 0),
        currency: rate.currency || 'USD',
        minDeliveryDays: rate.min_delivery_time || 3,
        maxDeliveryDays: rate.max_delivery_time || 7,
      }));

      // Sort by price (cheapest first)
      easyshipRates.sort((a, b) => a.totalCharge - b.totalCharge);

      // Return top 5 cheapest options
      return easyshipRates.slice(0, 5);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Easyship API error: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`
        );
        throw new Error(`Easyship API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get health status - validates API key
   */
  async getHealthStatus(): Promise<{
    enabled: boolean;
    configured: boolean;
    credentialsValid: boolean;
    apiKey: string;
    connectionError: string | null;
    message: string;
    supportedCountries: string[];
  }> {
    // Read actual enabled status from database
    const enabledSetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'easyship_enabled' },
    });
    const isEnabled = enabledSetting?.value === true || enabledSetting?.value === 'true';

    const apiKey = this.configService.get<string>('EASYSHIP_API_KEY');
    const maskedKey = apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : '';

    if (!this.client) {
      return {
        enabled: isEnabled,
        configured: false,
        credentialsValid: false,
        apiKey: 'Not Configured',
        connectionError: 'EASYSHIP_API_KEY not set',
        message: 'EasyShip not configured',
        supportedCountries: EASYSHIP_SUPPORTED_COUNTRIES,
      };
    }

    const isSandbox = apiKey?.startsWith('sand_');

    try {
      // POST /2024-09/rates with minimal payload to validate API key (both sandbox and production)
      await this.client.post('/rates', {
        origin_address: { country_alpha2: 'BE', city: 'Brussels', postal_code: '1000' },
        destination_address: { country_alpha2: 'GB', city: 'London', postal_code: 'SW1A 1AA' },
        incoterms: 'DDU',
        parcels: [
          {
            total_actual_weight: 0.5,
            items: [
              {
                quantity: 1,
                declared_currency: 'USD',
                declared_customs_value: 10,
                category: 'gifts',
                dimensions: { length: 10, width: 10, height: 10 },
              },
            ],
          },
        ],
      });

      return {
        enabled: isEnabled,
        configured: true,
        credentialsValid: true,
        apiKey: maskedKey,
        connectionError: null,
        message: `EasyShip connected (${isSandbox ? 'Sandbox' : 'Production'} mode)`,
        supportedCountries: EASYSHIP_SUPPORTED_COUNTRIES,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        // 422 = request understood but no routes available — credentials are valid
        if (status === 422) {
          return {
            enabled: isEnabled,
            configured: true,
            credentialsValid: true,
            apiKey: maskedKey,
            connectionError: null,
            message: `EasyShip connected (${isSandbox ? 'Sandbox' : 'Production'} mode)`,
            supportedCountries: EASYSHIP_SUPPORTED_COUNTRIES,
          };
        }
        return {
          enabled: isEnabled,
          configured: true,
          credentialsValid: false,
          apiKey: maskedKey,
          connectionError: `API error: ${status} - ${error.response?.data?.message || error.message}`,
          message: 'EasyShip credentials invalid',
          supportedCountries: EASYSHIP_SUPPORTED_COUNTRIES,
        };
      }
      return {
        enabled: isEnabled,
        configured: true,
        credentialsValid: false,
        apiKey: maskedKey,
        connectionError: error instanceof Error ? error.message : 'Unknown error',
        message: 'EasyShip connection error',
        supportedCountries: EASYSHIP_SUPPORTED_COUNTRIES,
      };
    }
  }
}
