import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import axios, { AxiosInstance } from 'axios';
import { estimateItemDimensionsCm } from '../../shipping/parcel-estimator';

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
    weightGrams?: number; // used to estimate per-item box dimensions
  }>;
}

export interface EasyshipAddress {
  name: string;
  company?: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string; // ISO 2
  phone?: string;
  email?: string;
}

export interface EasyshipPurchaseLabelDto {
  orderId: string;
  storeId: string;
  courierId: string; // from getRates serviceCode (courier_service.id)
  toAddress: EasyshipAddress;
  fromAddress: EasyshipAddress;
  items: Array<{
    description: string;
    quantity: number;
    value: number; // declared customs value per unit (USD)
    weightKg: number;
  }>;
  totalWeightKg: number;
  orderNumber?: string;
}

export interface EasyshipLabelResult {
  sellerShipmentId: string;
  easyshipShipmentId: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  labelUrl: string | null;
  courierName: string;
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
        Accept: 'application/json',
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
      // EasyShip requires 'state' for origins with states/provinces
      const COUNTRY_DEFAULT_STATE: Record<string, { state: string; city: string; postal: string }> =
        {
          US: { state: 'NY', city: 'New York', postal: '10001' },
          AU: { state: 'NSW', city: 'Sydney', postal: '2000' },
          CA: { state: 'ON', city: 'Toronto', postal: 'M5H 2N2' },
        };
      const fromCountryUpper = request.fromCountry.toUpperCase();
      const countryDefaults = COUNTRY_DEFAULT_STATE[fromCountryUpper];

      const originAddress: any = {
        country_alpha2: fromCountryUpper,
        city: request.fromCity || countryDefaults?.city || 'City',
        postal_code: request.fromPostalCode || countryDefaults?.postal || '1000',
        ...(request.fromState
          ? { state: request.fromState }
          : countryDefaults
            ? { state: countryDefaults.state }
            : {}),
      };

      const toCountryUpper = request.toCountry.toUpperCase();
      const destinationAddress: any = {
        country_alpha2: toCountryUpper,
        city: request.toCity || (toCountryUpper === 'US' ? 'New York' : 'City'),
        postal_code: request.toPostalCode || (toCountryUpper === 'US' ? '10001' : '1000'),
        // state is also required by EasyShip when destination is US
        ...(toCountryUpper === 'US' && { state: 'NY' }),
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
              // hs_code intentionally omitted — a wrong code (e.g. garments for electronics)
              // produces incorrect duty estimates. EasyShip returns rates without duty breakdown
              // when hs_code is absent, which is safer for a multi-category marketplace.
              // Dimensions estimated from item weight; avoids DIM weight overcharges on
              // light/bulky items when a flat 10×10×10 default is used for everything.
              dimensions: estimateItemDimensionsCm(item.weightGrams ?? 500),
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
   * Purchase a shipping label from EasyShip.
   * Creates a shipment via POST /shipments, then fetches the label PDF URL.
   * Stores the result in SellerShipment.
   */
  async createShipment(dto: EasyshipPurchaseLabelDto): Promise<EasyshipLabelResult> {
    if (!this.client) {
      throw new Error('EasyShip is not configured');
    }

    // Build origin address
    const COUNTRY_DEFAULT_STATE: Record<string, { state: string; city: string; postal: string }> = {
      US: { state: 'NY', city: 'New York', postal: '10001' },
      AU: { state: 'NSW', city: 'Sydney', postal: '2000' },
      CA: { state: 'ON', city: 'Toronto', postal: 'M5H 2N2' },
    };
    const fromCountry = dto.fromAddress.country.toUpperCase();
    const countryDefaults = COUNTRY_DEFAULT_STATE[fromCountry];

    const originAddress: any = {
      country_alpha2: fromCountry,
      city: dto.fromAddress.city || countryDefaults?.city || 'City',
      postal_code: dto.fromAddress.postalCode || countryDefaults?.postal || '1000',
      address_line_1: dto.fromAddress.street,
      contact_name: dto.fromAddress.name,
      company_name: dto.fromAddress.company || dto.fromAddress.name,
      phone_number: dto.fromAddress.phone || '',
      email: dto.fromAddress.email || '',
      ...(dto.fromAddress.state
        ? { state: dto.fromAddress.state }
        : countryDefaults
          ? { state: countryDefaults.state }
          : {}),
    };

    const toCountry = dto.toAddress.country.toUpperCase();
    const destinationAddress: any = {
      country_alpha2: toCountry,
      city: dto.toAddress.city,
      postal_code: dto.toAddress.postalCode,
      address_line_1: dto.toAddress.street,
      contact_name: dto.toAddress.name,
      company_name: dto.toAddress.company || dto.toAddress.name,
      phone_number: dto.toAddress.phone || '',
      email: dto.toAddress.email || '',
      ...(dto.toAddress.state ? { state: dto.toAddress.state } : {}),
      ...(toCountry === 'US' && !dto.toAddress.state ? { state: 'NY' } : {}),
    };

    // POST /shipments — create and book in one step
    let shipmentData: any;
    try {
      const response = await this.client.post('/shipments', {
        origin_address: originAddress,
        destination_address: destinationAddress,
        courier_id: dto.courierId,
        incoterms: 'DDU',
        order_data: {
          platform_order_number: dto.orderNumber || dto.orderId,
        },
        parcels: [
          {
            total_actual_weight: dto.totalWeightKg,
            items: dto.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              declared_currency: 'USD',
              declared_customs_value: item.value,
              actual_weight: item.weightKg,
              dimensions: { length: 10, width: 10, height: 10 },
            })),
          },
        ],
      });
      shipmentData = response.data?.shipment ?? response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `EasyShip shipment creation failed: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`
        );
        throw new Error(
          `EasyShip label creation failed: ${error.response?.data?.error?.message || error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }

    if (!shipmentData) {
      throw new Error('EasyShip returned an empty shipment response');
    }

    const easyshipShipmentId: string = shipmentData.easyship_shipment_id || shipmentData.id;
    const trackingNumber: string | null = shipmentData.tracking_number || null;
    const trackingUrl: string | null = shipmentData.tracking_page_url || null;
    const courierName: string = shipmentData.selected_courier?.name || dto.courierId;

    // Fetch label URL — EasyShip generates label asynchronously; poll /label endpoint
    let labelUrl: string | null = null;
    try {
      const labelResponse = await this.client.get(`/shipments/${easyshipShipmentId}/label`, {
        params: { format: 'pdf' },
      });
      labelUrl = labelResponse.data?.label_url || labelResponse.data?.labels?.[0]?.url || null;
    } catch (labelError) {
      // Non-fatal — label may not be ready yet; seller can retry later
      this.logger.warn(
        `[EasyShip] Label not yet available for shipment ${easyshipShipmentId}: ${labelError.message}`
      );
    }

    const shipmentNumber = `ES-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const sellerShipment = await this.prisma.sellerShipment.create({
      data: {
        orderId: dto.orderId,
        storeId: dto.storeId,
        shipmentNumber,
        status: 'LABEL_CREATED',
        carrier: courierName,
        trackingNumber,
        trackingUrl,
        metadata: {
          provider: 'EASYSHIP',
          easyshipShipmentId,
          courierId: dto.courierId,
          labelUrl,
        } as any,
      },
    });

    await this.prisma.order.update({
      where: { id: dto.orderId },
      data: {
        shippingProvider: 'EASYSHIP',
        shippingProviderData: {
          shipmentId: sellerShipment.id,
          easyshipShipmentId,
          trackingNumber,
          carrier: courierName,
        } as any,
      },
    });

    this.logger.log(
      `[EasyShip] Shipment created — ${easyshipShipmentId}, tracking ${trackingNumber}`
    );

    return {
      sellerShipmentId: sellerShipment.id,
      easyshipShipmentId,
      trackingNumber,
      trackingUrl,
      labelUrl,
      courierName,
    };
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
        origin_address: {
          country_alpha2: 'US',
          city: 'New York',
          postal_code: '10001',
          state: 'NY',
        },
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
