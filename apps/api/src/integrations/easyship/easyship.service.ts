import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  toCountry: string;
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
  private readonly baseUrl = 'https://public-api.easyship.com/2024-09';

  constructor(private readonly configService: ConfigService) {
    this.initializeClient();
  }

  /**
   * Initialize Easyship API client with Bearer token
   */
  private initializeClient(): void {
    const apiKey = this.configService.get<string>('EASYSHIP_API_KEY');

    if (!apiKey) {
      this.logger.warn('Easyship API key not configured. Set EASYSHIP_API_KEY');
      return;
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 10000,
    });

    this.logger.log('Easyship client initialized');
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
      // POST /rates
      const response = await this.client.post('/rates', {
        origin_country_alpha2: request.fromCountry.toUpperCase(),
        destination_country_alpha2: request.toCountry.toUpperCase(),
        taxes_duties_paid_by: 'Sender',
        is_insured: false,
        items: request.items.map((item) => ({
          quantity: item.quantity,
          dimensions: {
            length: 10,
            width: 10,
            height: 10,
          },
          actual_weight: request.weightKg / request.items.length, // Distribute weight across items
          declared_currency: 'USD',
          declared_customs_value: item.value,
        })),
      });

      const rates = response.data?.rates || [];

      if (rates.length === 0) {
        this.logger.warn(
          `No Easyship rates found for ${request.fromCountry} → ${request.toCountry}`
        );
        return [];
      }

      // Map to our EasyshipRate format
      const easyshipRates: EasyshipRate[] = rates.map((rate: any) => ({
        provider: 'easyship' as const,
        serviceCode: rate.courier_id,
        serviceName: rate.courier_name,
        carrierName: rate.courier_name,
        totalCharge: parseFloat(rate.total_charge || rate.shipment_charge),
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
    error?: string;
  }> {
    if (!this.client) {
      return {
        enabled: false,
        configured: false,
        error: 'API key not configured',
      };
    }

    try {
      // GET /account to validate API key
      const response = await this.client.get('/account');

      return {
        enabled: true,
        configured: !!response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          enabled: false,
          configured: false,
          error: `API error: ${error.response?.status} - ${error.response?.data?.message || error.message}`,
        };
      }
      return {
        enabled: false,
        configured: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
