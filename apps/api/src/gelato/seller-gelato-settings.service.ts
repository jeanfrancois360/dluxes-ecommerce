import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';
import { SellerGelatoSettings } from '@prisma/client';

/**
 * Seller Gelato Settings Service
 *
 * Manages per-seller Gelato Print-on-Demand integration settings.
 * Handles credential encryption, connection testing, and settings CRUD.
 *
 * Pattern: Follows SellerPayoutSettings service structure
 */
@Injectable()
export class SellerGelatoSettingsService {
  private readonly logger = new Logger(SellerGelatoSettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService
  ) {}

  /**
   * Get seller's Gelato settings
   * Returns masked credentials for security
   */
  async getSettings(sellerId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: sellerId },
      include: { store: true },
    });

    if (!user?.store) {
      throw new NotFoundException('Store not found for this seller');
    }

    const settings = await this.prisma.sellerGelatoSettings.findUnique({
      where: { storeId: user.store.id },
    });

    if (!settings) {
      // Return empty settings structure
      return {
        id: null,
        sellerId,
        storeId: user.store.id,
        gelatoApiKey: null,
        gelatoStoreId: null,
        gelatoWebhookSecret: null,
        isEnabled: false,
        isVerified: false,
        verifiedAt: null,
        lastTestAt: null,
        gelatoAccountName: null,
        gelatoAccountEmail: null,
        webhookUrl: null,
        connectionError: null,
        createdAt: null,
        updatedAt: null,
      };
    }

    // Return with masked credentials
    return {
      ...settings,
      gelatoApiKey: settings.gelatoApiKey ? this.maskApiKey(settings.gelatoApiKey) : null,
      gelatoWebhookSecret: settings.gelatoWebhookSecret ? '••••••••' : null,
    };
  }

  /**
   * Create or update seller's Gelato settings
   */
  async upsertSettings(
    sellerId: string,
    data: {
      gelatoApiKey?: string;
      gelatoStoreId?: string;
      gelatoWebhookSecret?: string;
      isEnabled?: boolean;
      notes?: string;
    }
  ): Promise<SellerGelatoSettings> {
    const user = await this.prisma.user.findUnique({
      where: { id: sellerId },
      include: { store: true },
    });

    if (!user?.store) {
      throw new NotFoundException('Store not found for this seller');
    }

    // If new credentials provided, test connection
    let isVerified = false;
    let connectionError: string | null = null;
    let accountInfo: { accountName?: string; accountEmail?: string } | null = null;

    if (data.gelatoApiKey && data.gelatoStoreId) {
      this.logger.log(`Testing Gelato connection for seller ${sellerId}`);

      const testResult = await this.testConnection({
        apiKey: data.gelatoApiKey,
        storeId: data.gelatoStoreId,
      });

      isVerified = testResult.success;
      connectionError = testResult.error || null;

      if (testResult.success) {
        accountInfo = {
          accountName: testResult.accountName,
          accountEmail: testResult.accountEmail,
        };
      } else {
        throw new BadRequestException(`Gelato connection test failed: ${connectionError}`);
      }
    }

    // Encrypt sensitive fields
    const encryptedData: any = {
      ...data,
      isEnabled: data.isEnabled,
      notes: data.notes,
    };

    if (data.gelatoApiKey) {
      encryptedData.gelatoApiKey = this.encryptionService.encrypt(data.gelatoApiKey);
      encryptedData.gelatoStoreId = data.gelatoStoreId; // Store ID is not encrypted
      encryptedData.isVerified = isVerified;
      encryptedData.verifiedAt = isVerified ? new Date() : null;
      encryptedData.lastTestAt = new Date();
      encryptedData.connectionError = connectionError;

      if (accountInfo) {
        encryptedData.gelatoAccountName = accountInfo.accountName;
        encryptedData.gelatoAccountEmail = accountInfo.accountEmail;
      }
    }

    if (data.gelatoWebhookSecret) {
      encryptedData.gelatoWebhookSecret = this.encryptionService.encrypt(data.gelatoWebhookSecret);
    }

    // Generate webhook URL
    if (data.gelatoStoreId) {
      const identifier = Buffer.from(user.store.id).toString('base64');
      const apiUrl =
        process.env.API_URL ||
        process.env.FRONTEND_URL?.replace('3000', '4000') ||
        'http://localhost:4000';
      encryptedData.webhookUrl = `${apiUrl}/api/v1/webhooks/gelato/${identifier}`;
    }

    const settings = await this.prisma.sellerGelatoSettings.upsert({
      where: { storeId: user.store.id },
      create: {
        sellerId,
        storeId: user.store.id,
        ...encryptedData,
      },
      update: encryptedData,
    });

    this.logger.log(
      `Gelato settings ${settings.id ? 'updated' : 'created'} for seller ${sellerId}`
    );

    return settings;
  }

  /**
   * Test Gelato API connection
   * Uses the Catalog List API - the simplest endpoint that requires only a valid API key
   * Note: Store ID will be validated when creating actual orders
   */
  async testConnection(credentials: { apiKey: string; storeId: string }): Promise<{
    success: boolean;
    error?: string;
    accountName?: string;
    accountEmail?: string;
  }> {
    try {
      // Validate input
      if (!credentials.apiKey || !credentials.storeId) {
        return {
          success: false,
          error: 'API Key and Store ID are required.',
        };
      }

      // Trim whitespace from credentials
      const apiKey = credentials.apiKey.trim();
      const storeId = credentials.storeId.trim();

      this.logger.log(`Testing Gelato API connection for store ${storeId.slice(0, 8)}...`);
      this.logger.debug(
        `API Key length: ${apiKey.length}, Store ID: ${storeId.slice(0, 8)}...${storeId.slice(-8)}`
      );

      // Use the List Catalogs endpoint - simplest test that works with any valid API key
      // See: https://dashboard.gelato.com/docs/products/catalog/list/
      const url = 'https://product.gelatoapis.com/v3/catalogs';

      this.logger.debug(`Calling Gelato API: GET ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
      });

      this.logger.debug(`Gelato API response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(`Gelato API test failed: ${response.status} - ${errorText}`);
        this.logger.warn(
          `API Key format check: starts with '${apiKey.slice(0, 8)}', length: ${apiKey.length}`
        );

        let errorMessage: string;

        // Provide helpful error messages
        if (response.status === 401 || response.status === 403) {
          errorMessage =
            'Invalid API Key. Please verify:\n1. The API key is correct (no extra spaces)\n2. The key is active in your Gelato dashboard\n3. The key has the necessary permissions';
        } else if (response.status === 404) {
          errorMessage =
            'Gelato API endpoint not found. Your API key may not have access to the catalog API.';
        } else {
          errorMessage = `Connection failed (${response.status}). Please check your API key and try again.`;
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      const data = (await response.json()) as any;

      this.logger.log(
        `✅ Gelato API key validated successfully for store ${storeId.slice(0, 8)}...`
      );
      this.logger.debug(`Gelato response data: ${JSON.stringify(data).slice(0, 200)}`);

      // API key is valid - connection successful
      return {
        success: true,
        accountName: `Gelato Account (${data.catalogs?.length || 0} catalogs available)`,
        accountEmail: null,
      };
    } catch (error) {
      this.logger.error(`Gelato connection test error: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);

      return {
        success: false,
        error: `Network error: ${error.message}. Please check your internet connection.`,
      };
    }
  }

  /**
   * Enable or disable Gelato integration for seller
   */
  async toggleEnabled(sellerId: string, enabled: boolean): Promise<SellerGelatoSettings> {
    const user = await this.prisma.user.findUnique({
      where: { id: sellerId },
      include: { store: true },
    });

    if (!user?.store) {
      throw new NotFoundException('Store not found for this seller');
    }

    const settings = await this.prisma.sellerGelatoSettings.findUnique({
      where: { storeId: user.store.id },
    });

    if (!settings) {
      throw new NotFoundException('Gelato settings not found. Please configure credentials first.');
    }

    if (enabled && !settings.isVerified) {
      throw new BadRequestException(
        'Cannot enable Gelato integration. Connection is not verified. Please test your credentials first.'
      );
    }

    const updated = await this.prisma.sellerGelatoSettings.update({
      where: { storeId: user.store.id },
      data: { isEnabled: enabled },
    });

    this.logger.log(
      `Gelato integration ${enabled ? 'enabled' : 'disabled'} for seller ${sellerId}`
    );

    return updated;
  }

  /**
   * Delete seller's Gelato settings
   */
  async deleteSettings(sellerId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: sellerId },
      include: { store: true },
    });

    if (!user?.store) {
      throw new NotFoundException('Store not found for this seller');
    }

    await this.prisma.sellerGelatoSettings.delete({
      where: { storeId: user.store.id },
    });

    this.logger.log(`Gelato settings deleted for seller ${sellerId}`);
  }

  /**
   * Mask API key for display
   * Format: "dc0d0b41-••••••••-e7947ae3baf7" (show first 8 and last 12 chars)
   */
  private maskApiKey(encryptedApiKey: string): string {
    try {
      const decrypted = this.encryptionService.decrypt(encryptedApiKey);

      if (decrypted.length < 20) {
        return '••••••••';
      }

      const first8 = decrypted.slice(0, 8);
      const last12 = decrypted.slice(-12);

      return `${first8}-••••••••-${last12}`;
    } catch (error) {
      this.logger.error(`Failed to mask API key: ${error.message}`);
      return '••••••••';
    }
  }

  /**
   * Get decrypted credentials for a store (internal use only)
   * Used by GelatoService to make API calls
   */
  async getDecryptedCredentials(storeId: string): Promise<{
    apiKey: string;
    storeId: string;
    webhookSecret?: string;
  } | null> {
    const settings = await this.prisma.sellerGelatoSettings.findUnique({
      where: { storeId },
    });

    if (!settings || !settings.isEnabled || !settings.isVerified) {
      return null;
    }

    try {
      const decryptedApiKey = this.encryptionService.decrypt(settings.gelatoApiKey);
      const decryptedWebhookSecret = settings.gelatoWebhookSecret
        ? this.encryptionService.decrypt(settings.gelatoWebhookSecret)
        : undefined;

      // Log decryption success with masked key info
      this.logger.log(
        `Decrypted Gelato credentials for store ${storeId}: ` +
          `API Key: ${decryptedApiKey.substring(0, 8)}-••••-${decryptedApiKey.slice(-12)} (length: ${decryptedApiKey.length})`
      );

      return {
        apiKey: decryptedApiKey.trim(), // Trim whitespace
        storeId: settings.gelatoStoreId.trim(), // Trim whitespace
        webhookSecret: decryptedWebhookSecret?.trim(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to decrypt Gelato credentials for store ${storeId}: ${error.message}`
      );
      return null;
    }
  }

  /**
   * Get decrypted webhook secret for a store (internal use only)
   * Used by webhook controller to verify incoming webhooks
   */
  async getDecryptedWebhookSecret(storeId: string): Promise<string | null> {
    const settings = await this.prisma.sellerGelatoSettings.findUnique({
      where: { storeId },
    });

    if (!settings || !settings.gelatoWebhookSecret) {
      return null;
    }

    try {
      return this.encryptionService.decrypt(settings.gelatoWebhookSecret);
    } catch (error) {
      this.logger.error(`Failed to decrypt webhook secret for store ${storeId}: ${error.message}`);
      return null;
    }
  }
}
