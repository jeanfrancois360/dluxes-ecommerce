import { Injectable, Logger, OnModuleInit, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import {
  GelatoCreateOrderRequest,
  GelatoOrderResponse,
  GelatoProduct,
  GelatoShippingMethod,
  GelatoPriceCalculation,
} from './interfaces';
import { GELATO_CONSTANTS } from './constants/gelato.constants';
import * as crypto from 'crypto';

@Injectable()
export class GelatoService implements OnModuleInit {
  private readonly logger = new Logger(GelatoService.name);
  private apiKey: string;
  private baseUrl: string;
  private storeId: string;
  private webhookSecret: string;
  private isConfigured = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService
  ) {}

  async onModuleInit() {
    await this.initializeConfig();
  }

  private async initializeConfig() {
    this.apiKey = this.configService.get('GELATO_API_KEY');
    this.baseUrl = this.configService.get('GELATO_API_URL', 'https://api.gelato.com/v4');
    this.storeId = this.configService.get('GELATO_STORE_ID');
    this.webhookSecret = this.configService.get('GELATO_WEBHOOK_SECRET');

    if (this.apiKey && this.storeId) {
      this.isConfigured = true;
      this.logger.log('Gelato integration initialized successfully');
    } else {
      this.logger.warn('Gelato integration not configured - missing API key or Store ID');
    }
  }

  async isEnabled(): Promise<boolean> {
    if (!this.isConfigured) return false;
    try {
      const setting = await this.settingsService.getSetting('gelato_enabled');
      return setting?.value === true;
    } catch {
      return false;
    }
  }

  async getStatus(): Promise<{
    configured: boolean;
    enabled: boolean;
    storeId: string | null;
    apiConnected: boolean;
  }> {
    const enabled = await this.isEnabled();
    let apiConnected = false;

    if (this.isConfigured) {
      try {
        await this.request('/stores/' + this.storeId);
        apiConnected = true;
      } catch {
        apiConnected = false;
      }
    }

    return {
      configured: this.isConfigured,
      enabled,
      storeId: this.storeId || null,
      apiConnected,
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.isConfigured) {
      throw new HttpException(
        'Gelato integration is not configured',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    const url = `${this.baseUrl}${endpoint}`;
    this.logger.debug(`Gelato API: ${options.method || 'GET'} ${endpoint}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText };
        }
        this.logger.error(`Gelato API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        throw new HttpException(
          { message: errorData.message || 'Gelato API error', gelatoError: errorData },
          response.status
        );
      }

      return responseText ? JSON.parse(responseText) : ({} as T);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Gelato API Request failed: ${error.message}`);
      throw new HttpException(
        'Failed to communicate with Gelato API',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  // ---- PRODUCT CATALOG ----

  async getProductCategories(): Promise<string[]> {
    const response = await this.request<{ categories: string[] }>('/catalogs/categories');
    return response.categories || [...GELATO_CONSTANTS.PRODUCT_CATEGORIES];
  }

  async getProducts(params?: {
    category?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<{ products: GelatoProduct[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.search) query.set('search', params.search);

    return this.request<{ products: GelatoProduct[]; total: number }>(
      `/catalogs/products?${query}`
    );
  }

  async getProduct(productUid: string): Promise<GelatoProduct> {
    return this.request<GelatoProduct>(`/catalogs/products/${productUid}`);
  }

  async getProductVariants(productUid: string): Promise<GelatoProduct['variants']> {
    const product = await this.getProduct(productUid);
    return product.variants || [];
  }

  // ---- SHIPPING ----

  async getShippingMethods(params: {
    productUid: string;
    quantity: number;
    country: string;
    state?: string;
  }): Promise<GelatoShippingMethod[]> {
    const response = await this.request<{ shippingMethods: GelatoShippingMethod[] }>(
      '/shipping/methods',
      {
        method: 'POST',
        body: JSON.stringify({
          storeId: this.storeId,
          items: [{ productUid: params.productUid, quantity: params.quantity }],
          shippingAddress: { country: params.country, state: params.state },
        }),
      }
    );
    return response.shippingMethods || [];
  }

  // ---- PRICE CALCULATION ----

  async calculatePrice(params: {
    items: Array<{ productUid: string; quantity: number }>;
    country: string;
    shippingMethodUid?: string;
  }): Promise<GelatoPriceCalculation> {
    return this.request<GelatoPriceCalculation>('/orders/quote', {
      method: 'POST',
      body: JSON.stringify({
        storeId: this.storeId,
        currency: 'USD',
        items: params.items,
        shippingAddress: { country: params.country },
        shipmentMethodUid: params.shippingMethodUid,
      }),
    });
  }

  // ---- ORDER MANAGEMENT ----

  async createOrder(orderData: GelatoCreateOrderRequest): Promise<GelatoOrderResponse> {
    return this.request<GelatoOrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify({ storeId: this.storeId, ...orderData }),
    });
  }

  async getOrder(gelatoOrderId: string): Promise<GelatoOrderResponse> {
    return this.request<GelatoOrderResponse>(`/orders/${gelatoOrderId}`);
  }

  async cancelOrder(gelatoOrderId: string): Promise<{ success: boolean; message?: string }> {
    try {
      await this.request(`/orders/${gelatoOrderId}/cancel`, { method: 'POST' });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to cancel order' };
    }
  }

  // ---- WEBHOOK VERIFICATION ----

  // Simple token comparison — Gelato sends the secret as a custom HTTP header value
  verifyWebhookToken(token: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('Webhook secret not configured - skipping verification');
      return true;
    }
    try {
      return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(this.webhookSecret));
    } catch {
      return false;
    }
  }
}
