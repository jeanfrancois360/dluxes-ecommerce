import { Injectable, Logger, OnModuleInit, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { SellerGelatoSettingsService } from './seller-gelato-settings.service';
import {
  GelatoCreateOrderRequest,
  GelatoOrderResponse,
  GelatoProduct,
  GelatoShippingMethod,
  GelatoPriceCalculation,
} from './interfaces';
import { GELATO_CONSTANTS } from './constants/gelato.constants';
import * as crypto from 'crypto';

interface GelatoCredentials {
  apiKey: string;
  storeId: string;
  webhookSecret?: string;
  isPlatformFallback: boolean;
  cachedAt?: number;
}

/**
 * Gelato Service (Multi-Tenant)
 *
 * Supports both platform-wide Gelato account (fallback) and per-seller accounts.
 * Dynamically loads credentials based on seller context with caching.
 *
 * v2.9.0 - Refactored for per-seller Gelato integration
 */
@Injectable()
export class GelatoService implements OnModuleInit {
  private readonly logger = new Logger(GelatoService.name);

  // Platform credentials (fallback)
  private platformApiKey: string | null = null;
  private platformStoreId: string | null = null;
  private platformWebhookSecret: string | null = null;
  private baseUrl: string;
  private isPlatformConfigured = false;

  // Credentials cache (5-minute TTL)
  private credentialsCache = new Map<string, GelatoCredentials>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Injected after construction to avoid circular dependency
  private sellerSettingsService: SellerGelatoSettingsService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService
  ) {}

  /**
   * Set the seller settings service (called by module)
   * Done this way to avoid circular dependency
   */
  setSellerSettingsService(service: SellerGelatoSettingsService) {
    this.sellerSettingsService = service;
  }

  async onModuleInit() {
    await this.initializeConfig();
  }

  private async initializeConfig() {
    // Load platform credentials as fallback
    this.platformApiKey = this.configService.get('GELATO_API_KEY');
    this.baseUrl = this.configService.get('GELATO_API_URL', 'https://api.gelato.com/v4');
    this.platformStoreId = this.configService.get('GELATO_STORE_ID');
    this.platformWebhookSecret = this.configService.get('GELATO_WEBHOOK_SECRET');

    if (this.platformApiKey && this.platformStoreId) {
      this.isPlatformConfigured = true;
      this.logger.log('Gelato platform account configured (will be used as fallback)');
    } else {
      this.logger.warn(
        'Gelato platform account not configured. ' +
          'Sellers MUST configure their own Gelato accounts to use POD features.'
      );
    }
  }

  /**
   * Get credentials for a seller's store
   * Returns seller credentials if configured, otherwise falls back to platform
   */
  async getSellerCredentials(storeId: string): Promise<GelatoCredentials> {
    // Check cache first (5min TTL)
    const cached = this.credentialsCache.get(storeId);
    if (cached && cached.cachedAt && Date.now() - cached.cachedAt < this.CACHE_TTL) {
      this.logger.debug(`Using cached Gelato credentials for store ${storeId}`);
      return cached;
    }

    // Load seller credentials from database
    if (this.sellerSettingsService) {
      try {
        const sellerCreds = await this.sellerSettingsService.getDecryptedCredentials(storeId);

        if (sellerCreds) {
          const credentials: GelatoCredentials = {
            apiKey: sellerCreds.apiKey,
            storeId: sellerCreds.storeId,
            webhookSecret: sellerCreds.webhookSecret,
            isPlatformFallback: false,
            cachedAt: Date.now(),
          };

          // Cache for 5 minutes
          this.credentialsCache.set(storeId, credentials);

          this.logger.log(`Using seller's Gelato account for store ${storeId}`);
          return credentials;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to load seller Gelato credentials for store ${storeId}: ${error.message}. ` +
            'Falling back to platform account.'
        );
      }
    }

    // Fallback to platform credentials
    if (!this.isPlatformConfigured) {
      throw new HttpException(
        'Gelato integration not available. Please configure your Gelato account in store settings.',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    const fallbackCreds: GelatoCredentials = {
      apiKey: this.platformApiKey,
      storeId: this.platformStoreId,
      webhookSecret: this.platformWebhookSecret,
      isPlatformFallback: true,
      cachedAt: Date.now(),
    };

    // Cache fallback too
    this.credentialsCache.set(storeId, fallbackCreds);

    this.logger.log(`Using platform Gelato account (fallback) for store ${storeId}`);
    return fallbackCreds;
  }

  /**
   * Invalidate credentials cache for a store
   * Call this when seller updates their Gelato settings
   */
  invalidateCredentialCache(storeId: string) {
    this.credentialsCache.delete(storeId);
    this.logger.debug(`Invalidated Gelato credentials cache for store ${storeId}`);
  }

  async isEnabled(): Promise<boolean> {
    if (!this.isPlatformConfigured) return false;
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

    if (this.isPlatformConfigured) {
      try {
        const credentials: GelatoCredentials = {
          apiKey: this.platformApiKey,
          storeId: this.platformStoreId,
          isPlatformFallback: true,
        };
        await this.request('/stores/' + this.platformStoreId, {}, credentials);
        apiConnected = true;
      } catch {
        apiConnected = false;
      }
    }

    return {
      configured: this.isPlatformConfigured,
      enabled,
      storeId: this.platformStoreId || null,
      apiConnected,
    };
  }

  /**
   * Make a request to Gelato API with specific credentials
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    credentials: GelatoCredentials
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    this.logger.debug(
      `Gelato API: ${options.method || 'GET'} ${endpoint} ` +
        `(using ${credentials.isPlatformFallback ? 'platform' : 'seller'} account)`
    );

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'X-API-KEY': credentials.apiKey,
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
  // These methods use platform credentials as they're for browsing the catalog

  async getProductCategories(): Promise<string[]> {
    // Use platform credentials for catalog browsing
    if (!this.isPlatformConfigured) {
      return [...GELATO_CONSTANTS.PRODUCT_CATEGORIES];
    }

    const credentials: GelatoCredentials = {
      apiKey: this.platformApiKey,
      storeId: this.platformStoreId,
      isPlatformFallback: true,
    };

    const response = await this.request<{ categories: string[] }>(
      '/catalogs/categories',
      {},
      credentials
    );
    return response.categories || [...GELATO_CONSTANTS.PRODUCT_CATEGORIES];
  }

  async getProducts(params?: {
    category?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<{ products: GelatoProduct[]; total: number }> {
    // Use platform credentials for catalog browsing
    if (!this.isPlatformConfigured) {
      throw new HttpException(
        'Gelato catalog not available. Platform account not configured.',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    const credentials: GelatoCredentials = {
      apiKey: this.platformApiKey,
      storeId: this.platformStoreId,
      isPlatformFallback: true,
    };

    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.search) query.set('search', params.search);

    return this.request<{ products: GelatoProduct[]; total: number }>(
      `/catalogs/products?${query}`,
      {},
      credentials
    );
  }

  async getProduct(productUid: string): Promise<GelatoProduct> {
    if (!this.isPlatformConfigured) {
      throw new HttpException(
        'Gelato catalog not available. Platform account not configured.',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    const credentials: GelatoCredentials = {
      apiKey: this.platformApiKey,
      storeId: this.platformStoreId,
      isPlatformFallback: true,
    };

    return this.request<GelatoProduct>(`/catalogs/products/${productUid}`, {}, credentials);
  }

  async getProductVariants(productUid: string): Promise<GelatoProduct['variants']> {
    const product = await this.getProduct(productUid);
    return product.variants || [];
  }

  // ---- SHIPPING ---- (requires seller context)

  async getShippingMethods(
    params: {
      productUid: string;
      quantity: number;
      country: string;
      state?: string;
    },
    storeId?: string
  ): Promise<GelatoShippingMethod[]> {
    const credentials = storeId
      ? await this.getSellerCredentials(storeId)
      : ({
          apiKey: this.platformApiKey,
          storeId: this.platformStoreId,
          isPlatformFallback: true,
        } as GelatoCredentials);

    const response = await this.request<{ shippingMethods: GelatoShippingMethod[] }>(
      '/shipping/methods',
      {
        method: 'POST',
        body: JSON.stringify({
          storeId: credentials.storeId,
          items: [{ productUid: params.productUid, quantity: params.quantity }],
          shippingAddress: { country: params.country, state: params.state },
        }),
      },
      credentials
    );
    return response.shippingMethods || [];
  }

  // ---- PRICE CALCULATION ---- (requires seller context)

  async calculatePrice(
    params: {
      items: Array<{ productUid: string; quantity: number }>;
      country: string;
      shippingMethodUid?: string;
    },
    storeId?: string
  ): Promise<GelatoPriceCalculation> {
    const credentials = storeId
      ? await this.getSellerCredentials(storeId)
      : ({
          apiKey: this.platformApiKey,
          storeId: this.platformStoreId,
          isPlatformFallback: true,
        } as GelatoCredentials);

    return this.request<GelatoPriceCalculation>(
      '/orders/quote',
      {
        method: 'POST',
        body: JSON.stringify({
          storeId: credentials.storeId,
          currency: 'USD',
          items: params.items,
          shippingAddress: { country: params.country },
          shipmentMethodUid: params.shippingMethodUid,
        }),
      },
      credentials
    );
  }

  // ---- ORDER MANAGEMENT ---- (requires seller context)

  async createOrder(
    orderData: GelatoCreateOrderRequest,
    storeId?: string
  ): Promise<GelatoOrderResponse> {
    const credentials = storeId
      ? await this.getSellerCredentials(storeId)
      : ({
          apiKey: this.platformApiKey,
          storeId: this.platformStoreId,
          isPlatformFallback: true,
        } as GelatoCredentials);

    return this.request<GelatoOrderResponse>(
      '/orders',
      {
        method: 'POST',
        body: JSON.stringify({ storeId: credentials.storeId, ...orderData }),
      },
      credentials
    );
  }

  async getOrder(gelatoOrderId: string, storeId?: string): Promise<GelatoOrderResponse> {
    const credentials = storeId
      ? await this.getSellerCredentials(storeId)
      : ({
          apiKey: this.platformApiKey,
          storeId: this.platformStoreId,
          isPlatformFallback: true,
        } as GelatoCredentials);

    return this.request<GelatoOrderResponse>(`/orders/${gelatoOrderId}`, {}, credentials);
  }

  async cancelOrder(
    gelatoOrderId: string,
    storeId?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const credentials = storeId
        ? await this.getSellerCredentials(storeId)
        : ({
            apiKey: this.platformApiKey,
            storeId: this.platformStoreId,
            isPlatformFallback: true,
          } as GelatoCredentials);

      await this.request(`/orders/${gelatoOrderId}/cancel`, { method: 'POST' }, credentials);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to cancel order' };
    }
  }

  // ---- WEBHOOK VERIFICATION ----

  /**
   * Verify platform webhook token
   */
  verifyPlatformWebhookToken(token: string): boolean {
    if (!this.platformWebhookSecret) {
      this.logger.warn('Platform webhook secret not configured - skipping verification');
      return true;
    }
    try {
      return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(this.platformWebhookSecret));
    } catch {
      return false;
    }
  }

  /**
   * Verify seller webhook token
   */
  verifySellerWebhookToken(token: string, sellerWebhookSecret: string): boolean {
    if (!sellerWebhookSecret) {
      this.logger.warn('Seller webhook secret not provided - skipping verification');
      return false;
    }
    try {
      return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sellerWebhookSecret));
    } catch {
      return false;
    }
  }
}
