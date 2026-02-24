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
 * Per-seller Gelato integration - sellers MUST configure their own accounts.
 * Platform credentials are used ONLY by admins for catalog browsing.
 * Dynamically loads credentials based on seller context with caching.
 *
 * v2.9.0 - Refactored for per-seller Gelato integration
 */
@Injectable()
export class GelatoService implements OnModuleInit {
  private readonly logger = new Logger(GelatoService.name);

  // Platform credentials (ADMIN ONLY - for catalog browsing)
  private platformApiKey: string | null = null;
  private platformStoreId: string | null = null;
  private platformWebhookSecret: string | null = null;
  private baseUrl: string; // For orders API (v4)
  private catalogBaseUrl: string; // For product catalog API (v3)
  private ecommerceBaseUrl: string; // For ecommerce API (v1) - store products
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

  private catalogUid: string | null = null; // Cached catalog UID

  private async initializeConfig() {
    // Load platform credentials (ADMIN ONLY - for catalog browsing)
    this.platformApiKey = this.configService.get('GELATO_API_KEY');
    this.baseUrl = this.configService.get('GELATO_API_URL', 'https://order.gelatoapis.com/v4'); // ✅ Correct Orders API endpoint
    this.catalogBaseUrl = 'https://product.gelatoapis.com/v3'; // Product Catalog API
    this.ecommerceBaseUrl = 'https://ecommerce.gelatoapis.com/v1'; // E-commerce API (store products)
    this.platformStoreId = this.configService.get('GELATO_STORE_ID');
    this.platformWebhookSecret = this.configService.get('GELATO_WEBHOOK_SECRET');

    // DEBUG: Log loaded configuration
    this.logger.log(`🔧 Gelato Config Loaded:`);
    this.logger.log(`  - Base URL (Orders): ${this.baseUrl}`);
    this.logger.log(`  - Catalog URL: ${this.catalogBaseUrl}`);
    this.logger.log(`  - E-commerce URL: ${this.ecommerceBaseUrl}`);
    this.logger.log(
      `  - Store ID: ${this.platformStoreId ? this.platformStoreId.substring(0, 8) + '...' : 'NOT SET'}`
    );
    this.logger.log(
      `  - API Key: ${this.platformApiKey ? this.platformApiKey.substring(0, 8) + '...' : 'NOT SET'}`
    );

    if (this.platformApiKey && this.platformStoreId) {
      this.isPlatformConfigured = true;
      this.logger.log('Gelato platform account configured (admins can browse catalog)');
    } else {
      this.logger.warn(
        'Gelato platform account not configured. ' +
          'Sellers MUST configure their own Gelato accounts to use POD features.'
      );
    }
  }

  /**
   * Get credentials for a seller's store
   * Sellers MUST have their own credentials configured - NO fallback
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

          this.logger.log(`✅ Using seller's Gelato account for store ${storeId}`);
          return credentials;
        }
      } catch (error) {
        this.logger.error(
          `Failed to load seller Gelato credentials for store ${storeId}: ${error.message}`
        );
      }
    }

    // NO FALLBACK - Seller must configure their own Gelato account
    throw new HttpException(
      'Gelato not configured. Please set up your Gelato account in Seller Settings to use Print-on-Demand features.',
      HttpStatus.FORBIDDEN
    );
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
        // Test connection using catalog endpoint (doesn't require store ID)
        await this.request('/catalogs/products?limit=1', {}, credentials);
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
    credentials: GelatoCredentials,
    baseUrl?: string
  ): Promise<T> {
    const url = `${baseUrl || this.baseUrl}${endpoint}`;
    this.logger.debug(
      `Gelato API: ${options.method || 'GET'} ${url} ` +
        `(using ${credentials.isPlatformFallback ? 'platform' : 'seller'} account)`
    );

    // Debug: Log API key info (masked)
    const apiKeyInfo = credentials.apiKey
      ? `${credentials.apiKey.substring(0, 8)}-••••-${credentials.apiKey.slice(-12)} (length: ${credentials.apiKey.length})`
      : 'EMPTY/NULL';
    this.logger.log(`API Key: ${apiKeyInfo}`);

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

  /**
   * Get the catalog UID from Gelato
   * Uses a well-known default catalog UID
   */
  private async getCatalogUid(credentials: GelatoCredentials): Promise<string> {
    if (this.catalogUid) {
      return this.catalogUid;
    }

    // Try to get available catalogs
    try {
      const response = await this.request<{
        catalogs: Array<{ catalogUid: string; title: string }>;
      }>('/catalogs', {}, credentials, this.catalogBaseUrl);

      if (response.catalogs && response.catalogs.length > 0) {
        this.catalogUid = response.catalogs[0].catalogUid;
        this.logger.log(`Using Gelato catalog: ${response.catalogs[0].title} (${this.catalogUid})`);
        return this.catalogUid;
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch catalogs: ${error.message}`);
    }

    // Fallback to well-known catalog UID
    // Gelato has a main product catalog that should work for most accounts
    this.catalogUid = 'posters'; // Common Gelato catalog
    this.logger.log(`Using default Gelato catalog: ${this.catalogUid}`);
    return this.catalogUid;
  }

  async getProductCategories(userId?: string): Promise<string[]> {
    let credentials: GelatoCredentials;

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { store: true },
      });

      const userRole = user?.role;

      // For SELLERS: MUST have their own credentials
      if (userRole === 'SELLER') {
        if (!user?.store) {
          return [...GELATO_CONSTANTS.PRODUCT_CATEGORIES];
        }

        const sellerCreds = await this.getSellerCredentials(user.store.id);

        if (sellerCreds.isPlatformFallback) {
          return [...GELATO_CONSTANTS.PRODUCT_CATEGORIES];
        }

        credentials = sellerCreds;
      }
      // For ADMINS: Use platform credentials
      else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        if (!this.isPlatformConfigured) {
          return [...GELATO_CONSTANTS.PRODUCT_CATEGORIES];
        }

        credentials = {
          apiKey: this.platformApiKey,
          storeId: this.platformStoreId,
          isPlatformFallback: true,
        };
      }
    }

    // Note: E-commerce API products don't have category fields
    // Categories are only applicable for the product catalog, not custom store products
    // Return empty array to disable category filtering for custom products
    this.logger.debug('Category filtering not supported for E-commerce API store products');
    return [];
  }

  async getProducts(
    params?: {
      category?: string;
      limit?: number;
      offset?: number;
      search?: string;
    },
    userId?: string
  ): Promise<{ products: GelatoProduct[]; total: number }> {
    let credentials: GelatoCredentials;
    let userRole: string;

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { store: true },
      });

      userRole = user?.role;

      // For SELLERS: MUST have their own credentials configured (no fallback)
      if (userRole === 'SELLER') {
        if (!user?.store) {
          throw new HttpException('Store not found. Please contact support.', HttpStatus.NOT_FOUND);
        }

        const sellerCreds = await this.getSellerCredentials(user.store.id);

        if (sellerCreds.isPlatformFallback) {
          throw new HttpException(
            'Gelato not configured. Please configure your Gelato credentials in Settings to browse the product catalog.',
            HttpStatus.FORBIDDEN
          );
        }

        credentials = sellerCreds;
        this.logger.debug(`Using seller credentials for catalog (user: ${userId})`);
      }
      // For ADMINS: Use platform credentials (admins browse catalog for all sellers)
      else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        if (!this.isPlatformConfigured) {
          throw new HttpException(
            'Platform Gelato account not configured. Please configure GELATO_API_KEY in .env file.',
            HttpStatus.SERVICE_UNAVAILABLE
          );
        }

        credentials = {
          apiKey: this.platformApiKey,
          storeId: this.platformStoreId,
          isPlatformFallback: true,
        };
        this.logger.debug('Using platform credentials for catalog (admin user)');
      }
    }

    // No user provided - use platform if available
    if (!credentials) {
      if (!this.isPlatformConfigured) {
        throw new HttpException(
          'Gelato not configured. Please configure your credentials.',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      credentials = {
        apiKey: this.platformApiKey,
        storeId: this.platformStoreId,
        isPlatformFallback: true,
      };
    }

    // Try to fetch seller's product templates (saved products in their store)
    // Gelato stores custom products as "product templates"
    const queryParams = new URLSearchParams();
    queryParams.set('limit', String(params?.limit || 50));
    queryParams.set('offset', String(params?.offset || 0));

    if (params?.search) {
      queryParams.set('search', params.search);
    }

    this.logger.debug(`Fetching store products for store: ${credentials.storeId}`);

    // Try the E-commerce API endpoint first (correct endpoint for store products)
    try {
      const ecommerceQueryParams = new URLSearchParams();
      ecommerceQueryParams.set('limit', String(params?.limit || 50));
      ecommerceQueryParams.set('offset', String(params?.offset || 0));
      ecommerceQueryParams.set('order', 'desc');
      ecommerceQueryParams.set('orderBy', 'createdAt');

      // Note: E-commerce API doesn't support search parameter, we'll filter client-side if needed
      const ecommercePath = `/stores/${credentials.storeId}/products?${ecommerceQueryParams}`;

      this.logger.debug(`Fetching from E-commerce API: ${this.ecommerceBaseUrl}${ecommercePath}`);

      const response = await this.request<{ products?: GelatoProduct[]; total?: number }>(
        ecommercePath,
        { method: 'GET' },
        credentials,
        this.ecommerceBaseUrl
      );

      let products = response.products || [];

      // Debug: Log product structure to understand available fields
      if (products.length > 0) {
        this.logger.debug(`Sample product fields: ${JSON.stringify(Object.keys(products[0]))}`);
      }

      // Note: E-commerce API products don't have category fields
      // Category filtering is not supported for custom store products

      // Client-side search filtering if search parameter provided
      if (params?.search && products.length > 0) {
        const searchLower = params.search.toLowerCase();
        products = products.filter((p: any) => {
          const title = p.title || p.name || '';
          const uid = p.uid || p.id || '';
          return (
            title.toLowerCase().includes(searchLower) || uid.toLowerCase().includes(searchLower)
          );
        });
      }

      this.logger.log(`Successfully fetched ${products.length} products from E-commerce API`);
      return {
        products,
        total: response.total || products.length,
      };
    } catch (error) {
      this.logger.warn(
        `E-commerce API endpoint failed (${error.message}), falling back to catalog search`
      );
      // Fall through to catalog search fallback below
    }

    // If E-commerce API fails, fall back to catalog search
    this.logger.warn(`Store products not accessible, falling back to catalog search`);

    const catalogUid = await this.getCatalogUid(credentials);
    const searchBody: any = {
      limit: params?.limit || 50,
      offset: params?.offset || 0,
    };

    if (params?.search) {
      searchBody.search = params.search;
    }

    const response = await this.request<{ products: GelatoProduct[]; total?: number }>(
      `/catalogs/${catalogUid}/products:search`,
      {
        method: 'POST',
        body: JSON.stringify(searchBody),
      },
      credentials,
      this.catalogBaseUrl
    );

    return {
      products: response.products || [],
      total: response.total || response.products?.length || 0,
    };
  }

  async getProduct(productUid: string, userId?: string): Promise<GelatoProduct> {
    let credentials: GelatoCredentials;
    let userRole: string;

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { store: true },
      });

      userRole = user?.role;

      // For SELLERS: MUST have their own credentials configured
      if (userRole === 'SELLER') {
        if (!user?.store) {
          throw new HttpException('Store not found. Please contact support.', HttpStatus.NOT_FOUND);
        }

        const sellerCreds = await this.getSellerCredentials(user.store.id);

        if (sellerCreds.isPlatformFallback) {
          throw new HttpException(
            'Gelato not configured. Please configure your Gelato credentials in Settings.',
            HttpStatus.FORBIDDEN
          );
        }

        credentials = sellerCreds;
      }
      // For ADMINS: Use platform credentials
      else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        if (!this.isPlatformConfigured) {
          throw new HttpException(
            'Platform Gelato account not configured.',
            HttpStatus.SERVICE_UNAVAILABLE
          );
        }

        credentials = {
          apiKey: this.platformApiKey,
          storeId: this.platformStoreId,
          isPlatformFallback: true,
        };
      }
    }

    // No user provided - use platform if available
    if (!credentials) {
      if (!this.isPlatformConfigured) {
        throw new HttpException('Gelato not configured.', HttpStatus.SERVICE_UNAVAILABLE);
      }

      credentials = {
        apiKey: this.platformApiKey,
        storeId: this.platformStoreId,
        isPlatformFallback: true,
      };
    }

    // Use E-commerce API to get product details from seller's store
    return this.request<GelatoProduct>(
      `/stores/${credentials.storeId}/products/${productUid}`,
      { method: 'GET' },
      credentials,
      this.ecommerceBaseUrl
    );
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
    storeId: string
  ): Promise<GelatoShippingMethod[]> {
    if (!storeId) {
      throw new HttpException(
        'Store ID is required for shipping calculations',
        HttpStatus.BAD_REQUEST
      );
    }

    const credentials = await this.getSellerCredentials(storeId);

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
      items: Array<{ productUid: string; quantity: number; variantUid?: string }>;
      country: string;
      shippingMethodUid?: string;
    },
    storeId: string
  ): Promise<GelatoPriceCalculation> {
    if (!storeId) {
      throw new HttpException(
        'Store ID is required for price calculations',
        HttpStatus.BAD_REQUEST
      );
    }

    const credentials = await this.getSellerCredentials(storeId);

    // DEBUG: Log which credentials are being used
    this.logger.log(`🔍 calculatePrice - Using seller credentials`);
    this.logger.log(`  - Store ID: ${credentials.storeId?.substring(0, 12)}...`);
    this.logger.log(`  - API Key (first 12 chars): ${credentials.apiKey?.substring(0, 12)}...`);
    this.logger.log(`  - Will call: ${this.baseUrl}/orders:quote`);

    // Fetch full product details to get template/variant information
    const productDetails = await Promise.all(
      params.items.map(async (item) => {
        try {
          // Try to fetch the product from E-commerce API to get full details
          const productPath = `/stores/${credentials.storeId}/products/${item.productUid}`;
          this.logger.debug(`Fetching product details: ${productPath}`);

          const product = await this.request<any>(
            productPath,
            { method: 'GET' },
            credentials,
            this.ecommerceBaseUrl
          );

          // Log the product structure to understand what fields are available
          this.logger.debug(`Product structure: ${JSON.stringify(Object.keys(product))}`);
          if (product.variants && product.variants.length > 0) {
            this.logger.debug(
              `First variant structure: ${JSON.stringify(Object.keys(product.variants[0]))}`
            );
            this.logger.log(`📌 Variant productUid: ${product.variants[0].productUid}`);
          }
          this.logger.log(`📌 Product parentTemplateId: ${product.parentTemplateId}`);

          return { ...item, productDetails: product };
        } catch (error) {
          this.logger.warn(
            `Failed to fetch product details for ${item.productUid}: ${error.message}`
          );
          return { ...item, productDetails: null };
        }
      })
    );

    const requestBody = {
      storeId: credentials.storeId,
      orderReferenceId: `quote-${Date.now()}`,
      currency: 'USD',
      products: productDetails.map((item, index) => {
        // Priority order for finding the catalog product UID:
        // 1. Variant's productUid (most likely to be the catalog product)
        // 2. Product's parentTemplateId
        // 3. Product's templateId
        // 4. Fall back to original productUid (will likely fail)
        const catalogProductUid =
          item.productDetails?.variants?.[0]?.productUid ||
          item.productDetails?.parentTemplateId ||
          item.productDetails?.templateId ||
          item.productUid;

        this.logger.log(`Product ${index}:`);
        this.logger.log(`  - Store product ID: ${item.productUid}`);
        this.logger.log(`  - Catalog product UID: ${catalogProductUid}`);
        this.logger.log(
          `  - Has personalizable variants: ${item.productDetails?.hasPersonalizableVariants}`
        );
        this.logger.log(`  - Product type: ${item.productDetails?.productType}`);

        return {
          itemReferenceId: `item-${index}-${Date.now()}`,
          productUid: catalogProductUid,
          quantity: item.quantity,
        };
      }),
      shippingAddress: {
        countryCode: params.country,
        // Add more address details for US to avoid server errors
        ...(params.country === 'US' && {
          stateCode: 'NY',
          city: 'New York',
          postCode: '10001',
        }),
      },
      ...(params.shippingMethodUid && { shipmentMethodUid: params.shippingMethodUid }),
    };

    this.logger.log(`📤 Request body: ${JSON.stringify(requestBody, null, 2)}`);

    return this.request<GelatoPriceCalculation>(
      '/orders:quote',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      },
      credentials
    );
  }

  // ---- ORDER MANAGEMENT ---- (requires seller context)

  async createOrder(
    orderData: GelatoCreateOrderRequest,
    storeId: string
  ): Promise<GelatoOrderResponse> {
    if (!storeId) {
      throw new HttpException(
        'Store ID is required to create Gelato orders',
        HttpStatus.BAD_REQUEST
      );
    }

    const credentials = await this.getSellerCredentials(storeId);

    return this.request<GelatoOrderResponse>(
      '/orders',
      {
        method: 'POST',
        body: JSON.stringify({ storeId: credentials.storeId, ...orderData }),
      },
      credentials
    );
  }

  async getOrder(gelatoOrderId: string, storeId: string): Promise<GelatoOrderResponse> {
    if (!storeId) {
      throw new HttpException(
        'Store ID is required to retrieve Gelato orders',
        HttpStatus.BAD_REQUEST
      );
    }

    const credentials = await this.getSellerCredentials(storeId);

    return this.request<GelatoOrderResponse>(`/orders/${gelatoOrderId}`, {}, credentials);
  }

  async cancelOrder(
    gelatoOrderId: string,
    storeId: string
  ): Promise<{ success: boolean; message?: string }> {
    if (!storeId) {
      return {
        success: false,
        message: 'Store ID is required to cancel Gelato orders',
      };
    }

    try {
      const credentials = await this.getSellerCredentials(storeId);

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
