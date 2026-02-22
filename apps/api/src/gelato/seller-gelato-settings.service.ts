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
   */
  async testConnection(credentials: { apiKey: string; storeId: string }): Promise<{
    success: boolean;
    error?: string;
    accountName?: string;
    accountEmail?: string;
  }> {
    try {
      this.logger.debug(`Testing Gelato API connection for store ${credentials.storeId}`);

      const response = await fetch(`https://api.gelato.com/v4/stores/${credentials.storeId}`, {
        headers: {
          'X-API-KEY': credentials.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(`Gelato API test failed: ${response.status} - ${errorText}`);

        return {
          success: false,
          error: `API returned ${response.status}: ${errorText}`,
        };
      }

      const data = (await response.json()) as any;

      this.logger.debug(`Gelato connection test successful for store ${credentials.storeId}`);

      return {
        success: true,
        accountName: data.name || data.storeName || null,
        accountEmail: data.email || data.contactEmail || null,
      };
    } catch (error) {
      this.logger.error(`Gelato connection test error: ${error.message}`);

      return {
        success: false,
        error: error.message || 'Connection failed',
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
      return {
        apiKey: this.encryptionService.decrypt(settings.gelatoApiKey),
        storeId: settings.gelatoStoreId,
        webhookSecret: settings.gelatoWebhookSecret
          ? this.encryptionService.decrypt(settings.gelatoWebhookSecret)
          : undefined,
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
