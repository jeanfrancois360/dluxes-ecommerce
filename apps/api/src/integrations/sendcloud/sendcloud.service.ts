import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import axios, { AxiosInstance } from 'axios';

// Sendcloud supported ship-from countries
export const SENDCLOUD_SUPPORTED_COUNTRIES = [
  'AT', // Austria
  'BE', // Belgium
  'FR', // France
  'DE', // Germany
  'IT', // Italy
  'NL', // Netherlands
  'ES', // Spain
  'GB', // United Kingdom
  'CZ', // Czech Republic
  'DK', // Denmark
  'PL', // Poland
  'PT', // Portugal
  'SE', // Sweden
];

export interface SendcloudRate {
  provider: 'sendcloud';
  serviceCode: string; // shipping method id as string
  serviceName: string; // shipping method name
  carrierName: string; // carrier name
  totalCharge: number; // price in euros
  currency: string; // 'EUR'
  minDeliveryDays: number;
  maxDeliveryDays: number;
  requiresServicePoint: boolean; // true for DPD Shop / parcel pickup methods
}

export interface SendcloudGetRatesRequest {
  fromCountry: string;
  toCountry: string;
  weightGrams: number;
  items: Array<{
    name: string;
    quantity: number;
    value: number;
  }>;
}

export interface SendcloudAddress {
  name: string;
  company?: string;
  address: string; // Street name (SendCloud splits street from house number)
  houseNumber?: string; // House/building number (optional — inferred from address if omitted)
  city: string;
  postalCode: string;
  country: string; // ISO 2
  state?: string; // Required for US/CA/AU/IT destinations (2-letter code, e.g. "CA")
  phone?: string;
  email?: string;
}

export interface SendcloudPurchaseLabelDto {
  orderId: string;
  storeId: string;
  serviceCode: string; // shipping method ID from getRates (string form of numeric ID)
  toAddress: SendcloudAddress;
  fromAddress: SendcloudAddress;
  weightGrams: number;
  orderNumber?: string;
  servicePointId?: number; // Required for DPD Shop and other parcel pickup methods
  items?: Array<{
    description: string;
    quantity: number;
    weight: number; // kg per unit
    value: number; // monetary value per unit
    sku?: string;
    hsCode?: string; // Harmonized System tariff code (required for customs)
    originCountry?: string; // ISO 2-letter country of manufacture (required for customs)
  }>;
}

export interface SendcloudLabelResult {
  sellerShipmentId: string;
  trackingNumber: string;
  trackingUrl: string | null;
  labelUrl: string | null; // PDF for thermal printer
  labelUrlA4: string | null; // A4 format
  sendcloudParcelId: number;
  carrier: string;
}

@Injectable()
export class SendcloudService {
  private readonly logger = new Logger(SendcloudService.name);
  private client: AxiosInstance | null = null;
  private readonly baseUrl = 'https://panel.sendcloud.sc/api/v2';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.initializeClient();
  }

  /**
   * Initialize Sendcloud API client with HTTP Basic Auth
   */
  private initializeClient(): void {
    const publicKey = this.configService.get<string>('SENDCLOUD_PUBLIC_KEY');
    const secretKey = this.configService.get<string>('SENDCLOUD_SECRET_KEY');

    if (!publicKey || !secretKey) {
      this.logger.warn(
        'Sendcloud credentials not configured. Set SENDCLOUD_PUBLIC_KEY and SENDCLOUD_SECRET_KEY'
      );
      return;
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: publicKey,
        password: secretKey,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    this.logger.log('Sendcloud client initialized');
  }

  /**
   * Check if Sendcloud supports a given ship-from country
   */
  isCountrySupported(countryCode: string): boolean {
    return SENDCLOUD_SUPPORTED_COUNTRIES.includes(countryCode.toUpperCase());
  }

  /**
   * Check if Sendcloud is configured
   */
  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Get shipping rates from Sendcloud
   */
  async getRates(request: SendcloudGetRatesRequest): Promise<SendcloudRate[]> {
    if (!this.client) {
      throw new Error('Sendcloud is not configured');
    }

    if (!this.isCountrySupported(request.fromCountry)) {
      throw new Error(
        `Sendcloud does not support shipping from ${request.fromCountry}. ` +
          `Supported countries: ${SENDCLOUD_SUPPORTED_COUNTRIES.join(', ')}`
      );
    }

    try {
      // GET /shipping_methods?from_country=FR&to_country=DE&weight=1000
      const response = await this.client.get('/shipping_methods', {
        params: {
          from_country: request.fromCountry.toUpperCase(),
          to_country: request.toCountry.toUpperCase(),
          weight: request.weightGrams,
        },
      });

      const shippingMethods = response.data?.shipping_methods || [];

      if (shippingMethods.length === 0) {
        this.logger.warn(
          `No Sendcloud shipping methods found for ${request.fromCountry} → ${request.toCountry}`
        );
        return [];
      }

      // Extract rates from shipping methods
      const rates: SendcloudRate[] = [];

      for (const method of shippingMethods) {
        // Find price for destination country
        const countryData = method.countries?.find(
          (c: any) => c.iso_2 === request.toCountry.toUpperCase()
        );

        if (!countryData || !countryData.price) {
          continue; // Skip if no price for this destination
        }

        rates.push({
          provider: 'sendcloud',
          serviceCode: String(method.id),
          serviceName: method.name || 'Standard Shipping',
          carrierName: method.carrier || 'Sendcloud',
          totalCharge: parseFloat(countryData.price),
          currency: 'EUR',
          minDeliveryDays: method.min_delivery_time || 3,
          maxDeliveryDays: method.max_delivery_time || 7,
          requiresServicePoint: Boolean(method.requires_service_point),
        });
      }

      // Sort by price (cheapest first)
      rates.sort((a, b) => a.totalCharge - b.totalCharge);

      // Return top 5 cheapest options
      return rates.slice(0, 5);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Sendcloud API error: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`
        );
        throw new Error(`Sendcloud API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Purchase a shipping label from Sendcloud.
   * Creates a parcel via POST /parcels and stores the result in SellerShipment.
   */
  async createLabel(dto: SendcloudPurchaseLabelDto): Promise<SendcloudLabelResult> {
    if (!this.client) {
      throw new Error('Sendcloud is not configured');
    }

    // POST /parcels — single parcel creation
    const isInternational =
      dto.toAddress.country.toUpperCase() !== dto.fromAddress.country.toUpperCase();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const parcelPayload = {
      parcel: {
        name: dto.toAddress.name,
        company_name: dto.toAddress.company || '',
        // SendCloud separates street name from house number for European addresses.
        // For non-EU addresses the full street+number goes in `address`; house_number stays empty.
        address: dto.toAddress.address,
        house_number: dto.toAddress.houseNumber || '',
        city: dto.toAddress.city,
        postal_code: dto.toAddress.postalCode,
        country: dto.toAddress.country.toUpperCase(), // SendCloud expects plain ISO-2 string
        // Required for US, Canada, Australia, and Italy destinations
        ...(dto.toAddress.state ? { country_state: dto.toAddress.state } : {}),
        telephone: dto.toAddress.phone || '',
        email: dto.toAddress.email || '',
        // Weight must be a string in kg with 3 decimal places per SendCloud docs
        weight: (dto.weightGrams / 1000).toFixed(3),
        shipment: { id: parseInt(dto.serviceCode, 10) },
        order_number: dto.orderNumber || dto.orderId,
        request_label: true,
        // Disable automatic shipping rule application to avoid mandatory return-label
        // validation when no return carrier contracts are configured on the account.
        apply_shipping_rules: false,
        // Service point — required for DPD Shop and other parcel-pickup methods
        ...(dto.servicePointId ? { to_service_point: dto.servicePointId } : {}),
        // Customs information — MUST be nested under customs_information (not at root level)
        // Required: customs_invoice_nr, customs_shipment_type
        ...(isInternational
          ? {
              customs_information: {
                customs_invoice_nr: dto.orderNumber || dto.orderId,
                customs_shipment_type: 2, // 2 = Commercial Goods
                export_type: 'commercial_b2c', // B2C e-commerce
                invoice_date: today,
              },
            }
          : {}),
        // Parcel items — hs_code is always required per SendCloud item schema
        ...(dto.items && dto.items.length > 0
          ? {
              parcel_items: dto.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                // Weight per unit as string in kg (3 decimal places)
                weight: item.weight.toFixed(3),
                value: item.value.toFixed(2),
                sku: item.sku || '',
                // hs_code is required in parcel_items schema; empty string is accepted when unknown
                hs_code: item.hsCode || '',
                // origin_country is optional but strongly recommended for customs
                origin_country: item.originCountry ? item.originCountry.toUpperCase() : undefined,
              })),
            }
          : {}),
      },
    };

    let parcel: any;
    try {
      const response = await this.client.post('/parcels', parcelPayload);
      parcel = response.data?.parcel;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errMsg = error.response?.data?.error?.message || error.message;
        this.logger.error(
          `Sendcloud parcel creation failed: ${status} - ${JSON.stringify(error.response?.data)}`
        );

        // 412 = "User not allowed to announce" — two root causes:
        //   1. Unpaid invoice in the SendCloud account (most common — SEPA bank verification €0.02)
        //      Fix: panel.sendcloud.sc → Settings → Billing → pay the outstanding invoice
        //   2. Missing carrier contracts on the account
        //      Fix: panel.sendcloud.sc → Settings → Carriers → activate a carrier
        // Try again without request_label to at least register the parcel.
        if (status === 412) {
          this.logger.warn(
            'Sendcloud label generation blocked (412 — User not allowed to announce). ' +
              'Possible causes: (1) unpaid invoice in SendCloud billing settings, ' +
              '(2) missing carrier contracts. Creating parcel without label as fallback.'
          );
          try {
            const fallbackResponse = await this.client.post('/parcels', {
              parcel: { ...parcelPayload.parcel, request_label: false },
            });
            parcel = fallbackResponse.data?.parcel;
            if (!parcel) throw new Error('empty');
          } catch (fallbackErr) {
            throw new Error(
              `Sendcloud label creation failed (412). This is a billing or carrier contract issue — ` +
                `check panel.sendcloud.sc → Settings → Billing for unpaid invoices, ` +
                `or Settings → Carriers to ensure carrier contracts are active.`
            );
          }
        } else {
          throw new Error(`Sendcloud label creation failed: ${errMsg}`);
        }
      } else {
        throw error;
      }
    }

    if (!parcel) {
      throw new Error('Sendcloud returned an empty parcel response');
    }

    const trackingNumber: string = parcel.tracking_number || '';
    const trackingUrl: string | null = parcel.tracking_url || null;
    const labelUrl: string | null = parcel.label?.label_printer || null;
    const labelUrlA4: string | null = parcel.label?.normal_printer || null;
    const carrier: string = parcel.carrier?.code || 'sendcloud';

    // Generate a short shipment number
    const shipmentNumber = `SC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Persist in SellerShipment (metadata holds provider-specific fields)
    const sellerShipment = await this.prisma.sellerShipment.create({
      data: {
        orderId: dto.orderId,
        storeId: dto.storeId,
        shipmentNumber,
        status: trackingNumber ? 'LABEL_CREATED' : 'PROCESSING',
        carrier,
        trackingNumber: trackingNumber || null,
        trackingUrl,
        metadata: {
          provider: 'SENDCLOUD',
          sendcloudParcelId: parcel.id,
          serviceCode: dto.serviceCode,
          servicePointId: dto.servicePointId ?? null,
          labelUrl,
          labelUrlA4,
          weightGrams: dto.weightGrams,
        } as any,
      },
    });

    // Persist shipping provider on the order so the cascade remembers which provider won
    await this.prisma.order.update({
      where: { id: dto.orderId },
      data: {
        shippingProvider: 'SENDCLOUD',
        shippingProviderData: {
          shipmentId: sellerShipment.id,
          sendcloudParcelId: parcel.id,
          trackingNumber,
          carrier,
        } as any,
      },
    });

    this.logger.log(`[Sendcloud] Label created — parcel ${parcel.id}, tracking ${trackingNumber}`);

    return {
      sellerShipmentId: sellerShipment.id,
      trackingNumber,
      trackingUrl,
      labelUrl,
      labelUrlA4,
      sendcloudParcelId: parcel.id,
      carrier,
    };
  }

  /**
   * Get health status - validates credentials
   */
  async getHealthStatus(): Promise<{
    enabled: boolean;
    configured: boolean;
    credentialsValid: boolean;
    billingBlocked: boolean;
    unpaidInvoice: string | null;
    publicKey: string;
    connectionError: string | null;
    message: string;
    supportedCountries: string[];
  }> {
    // Read actual enabled status from database
    const enabledSetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'sendcloud_enabled' },
    });
    const isEnabled = enabledSetting?.value === true || enabledSetting?.value === 'true';

    const publicKey = this.configService.get<string>('SENDCLOUD_PUBLIC_KEY');
    const maskedKey = publicKey ? `${publicKey.slice(0, 8)}...${publicKey.slice(-4)}` : '';

    if (!this.client) {
      return {
        enabled: isEnabled,
        configured: false,
        credentialsValid: false,
        billingBlocked: false,
        unpaidInvoice: null,
        publicKey: 'Not Configured',
        connectionError: 'SENDCLOUD_PUBLIC_KEY and SENDCLOUD_SECRET_KEY not set',
        message: 'SendCloud not configured',
        supportedCountries: SENDCLOUD_SUPPORTED_COUNTRIES,
      };
    }

    try {
      // GET /user to validate credentials and check billing
      const response = await this.client.get('/user');
      const user = response.data?.user;

      // Detect unpaid invoices — SendCloud blocks label generation (412) when any invoice is unpaid.
      // The most common case is an "initial_payment" for SEPA bank account verification (€0.02).
      const unpaidInvoices: any[] = (user?.invoices || []).filter((inv: any) => !inv.isPayed);
      const unpaidRef: string | null = unpaidInvoices.length > 0 ? unpaidInvoices[0].ref : null;
      const billingBlocked = unpaidInvoices.length > 0;

      return {
        enabled: isEnabled,
        configured: true,
        credentialsValid: true,
        billingBlocked,
        unpaidInvoice: unpaidRef,
        publicKey: maskedKey,
        connectionError: billingBlocked
          ? `Billing issue: unpaid invoice ${unpaidRef} — label printing is blocked. ` +
            `Go to panel.sendcloud.sc → Settings → Billing to resolve.`
          : null,
        message: billingBlocked
          ? `SendCloud connected but BILLING BLOCKED (invoice ${unpaidRef} unpaid). Labels cannot be printed until resolved.`
          : `SendCloud connected (${user?.company_name || user?.email || 'Account'})`,
        supportedCountries: SENDCLOUD_SUPPORTED_COUNTRIES,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          enabled: isEnabled,
          configured: true,
          credentialsValid: false,
          billingBlocked: false,
          unpaidInvoice: null,
          publicKey: maskedKey,
          connectionError: `API error: ${error.response?.status} - ${error.response?.data?.message || error.message}`,
          message: 'SendCloud credentials invalid',
          supportedCountries: SENDCLOUD_SUPPORTED_COUNTRIES,
        };
      }
      return {
        enabled: isEnabled,
        configured: true,
        credentialsValid: false,
        billingBlocked: false,
        unpaidInvoice: null,
        publicKey: maskedKey,
        connectionError: error instanceof Error ? error.message : 'Unknown error',
        message: 'SendCloud connection error',
        supportedCountries: SENDCLOUD_SUPPORTED_COUNTRIES,
      };
    }
  }
}
