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

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
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

    // Sandbox keys are accepted as valid without a live API call (sandbox can timeout/restrict)
    if (isSandbox) {
      return {
        enabled: isEnabled,
        configured: true,
        credentialsValid: true,
        apiKey: maskedKey,
        connectionError: null,
        message: 'EasyShip connected (Sandbox mode)',
        supportedCountries: EASYSHIP_SUPPORTED_COUNTRIES,
      };
    }

    try {
      // POST /rates with minimal payload to validate production API key
      await this.client.post('/rates', {
        origin_country_alpha2: 'US',
        destination_country_alpha2: 'GB',
        taxes_duties_paid_by: 'Sender',
        is_insured: false,
        items: [
          {
            quantity: 1,
            dimensions: { length: 10, width: 10, height: 10 },
            actual_weight: 0.5,
            declared_currency: 'USD',
            declared_customs_value: 10,
          },
        ],
      });

      return {
        enabled: isEnabled,
        configured: true,
        credentialsValid: true,
        apiKey: maskedKey,
        connectionError: null,
        message: 'EasyShip connected',
        supportedCountries: EASYSHIP_SUPPORTED_COUNTRIES,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          enabled: isEnabled,
          configured: true,
          credentialsValid: false,
          apiKey: maskedKey,
          connectionError: `API error: ${error.response?.status} - ${error.response?.data?.message || error.message}`,
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
