import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SettingValueType, AuditAction } from '@prisma/client';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get setting by key
   */
  async getSetting(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting '${key}' not found`);
    }

    return {
      key: setting.key,
      value: setting.value,
      label: setting.label,
      description: setting.description,
      valueType: setting.valueType,
      isPublic: setting.isPublic,
      isEditable: setting.isEditable,
      requiresRestart: setting.requiresRestart,
    };
  }

  /**
   * Get all public settings (for frontend)
   */
  async getPublicSettings() {
    const settings = await this.prisma.systemSetting.findMany({
      where: { isPublic: true },
      select: {
        key: true,
        value: true,
        label: true,
        description: true,
        valueType: true,
      },
    });

    return settings;
  }

  /**
   * Get settings by category
   */
  async getSettingsByCategory(category: string) {
    return this.prisma.systemSetting.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });
  }

  /**
   * Get all settings (Admin only)
   */
  async getAllSettings() {
    return this.prisma.systemSetting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  }

  /**
   * Create new setting (Admin only)
   */
  async createSetting(data: {
    key: string;
    category: string;
    value: any;
    valueType: SettingValueType;
    label: string;
    description?: string;
    isPublic?: boolean;
    isEditable?: boolean;
    requiresRestart?: boolean;
    defaultValue?: any;
    createdBy: string;
  }) {
    const setting = await this.prisma.systemSetting.create({
      data: {
        key: data.key,
        category: data.category,
        value: data.value,
        valueType: data.valueType,
        label: data.label,
        description: data.description,
        isPublic: data.isPublic ?? false,
        isEditable: data.isEditable ?? true,
        requiresRestart: data.requiresRestart ?? false,
        defaultValue: data.defaultValue,
        lastUpdatedBy: data.createdBy,
      },
    });

    this.logger.log(`Setting created: ${data.key} by ${data.createdBy}`);

    return setting;
  }

  /**
   * Update setting with audit log
   */
  async updateSetting(
    key: string,
    newValue: any,
    changedBy: string,
    changedByEmail: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ) {
    this.logger.log(`Attempting to update setting: ${key}`);
    this.logger.log(`New value: ${JSON.stringify(newValue)}`);
    this.logger.log(`Changed by: ${changedByEmail} (${changedBy})`);

    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      this.logger.error(`Setting '${key}' not found`);
      throw new NotFoundException(`Setting '${key}' not found`);
    }

    if (!setting.isEditable) {
      this.logger.error(`Setting '${key}' is not editable`);
      throw new BadRequestException('This setting cannot be edited');
    }

    const oldValue = setting.value;
    this.logger.log(`Old value: ${JSON.stringify(oldValue)}`);

    try {
      await this.prisma.$transaction(async (prisma) => {
        this.logger.log(`Starting transaction for ${key}`);

        // Update setting
        await prisma.systemSetting.update({
          where: { key },
          data: {
            value: newValue,
            lastUpdatedBy: changedBy,
            updatedAt: new Date(),
          },
        });
        this.logger.log(`Setting ${key} updated in transaction`);

        // Create audit log
        await prisma.settingsAuditLog.create({
          data: {
            settingId: setting.id,
            settingKey: key,
            oldValue,
            newValue,
            changedBy,
            changedByEmail,
            ipAddress,
            userAgent,
            action: AuditAction.UPDATE,
            reason,
            canRollback: true,
          },
        });
        this.logger.log(`Audit log created for ${key}`);
      });

      this.logger.log(`Transaction committed successfully for ${key}`);
    } catch (error) {
      this.logger.error(`Transaction failed for ${key}: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }

    this.logger.log(`Setting updated: ${key} by ${changedByEmail}`);

    // Auto-sync: If supported_currencies is updated, sync currency active statuses
    if (key === 'supported_currencies') {
      try {
        this.logger.log(`Starting currency sync for: ${JSON.stringify(newValue)}`);
        await this.syncCurrencyActiveStatuses(newValue as string[]);
        this.logger.log('Currency sync completed successfully');
      } catch (error) {
        this.logger.warn(`Failed to sync currency active statuses: ${error.message}`);
        this.logger.warn(`Sync error stack: ${error.stack}`);
        // Don't fail the request if sync fails
      }
    }

    return this.getSetting(key);
  }

  /**
   * Sync currency active statuses when supported_currencies setting is updated
   */
  private async syncCurrencyActiveStatuses(supportedCurrencies: string[]) {
    try {
      // Activate all currencies in the supported list
      if (supportedCurrencies.length > 0) {
        await this.prisma.currencyRate.updateMany({
          where: {
            currencyCode: { in: supportedCurrencies },
          },
          data: {
            isActive: true,
            lastUpdated: new Date(),
          },
        });
      }

      // Deactivate all currencies NOT in the supported list
      await this.prisma.currencyRate.updateMany({
        where: {
          currencyCode: { notIn: supportedCurrencies },
        },
        data: {
          isActive: false,
          lastUpdated: new Date(),
        },
      });

      this.logger.log(`Synced currency active statuses for: ${supportedCurrencies.join(', ')}`);
    } catch (error) {
      this.logger.error(`Error syncing currency active statuses: ${error.message}`);
      throw error;
    }
  }

  /**
   * Rollback setting to previous value
   */
  async rollbackSetting(auditLogId: string, rolledBackBy: string, rolledBackByEmail: string) {
    const auditLog = await this.prisma.settingsAuditLog.findUnique({
      where: { id: auditLogId },
      include: { setting: true },
    });

    if (!auditLog) {
      throw new NotFoundException('Audit log not found');
    }

    if (!auditLog.canRollback) {
      throw new BadRequestException('This change cannot be rolled back');
    }

    if (auditLog.rolledBackAt) {
      throw new BadRequestException('This change has already been rolled back');
    }

    if (!auditLog.setting) {
      throw new NotFoundException('Original setting not found');
    }

    await this.prisma.$transaction(async (prisma) => {
      // Rollback to old value
      await prisma.systemSetting.update({
        where: { id: auditLog.settingId! },
        data: {
          value: auditLog.oldValue,
          lastUpdatedBy: rolledBackBy,
        },
      });

      // Mark as rolled back
      await prisma.settingsAuditLog.update({
        where: { id: auditLogId },
        data: {
          rolledBackAt: new Date(),
          rolledBackBy,
        },
      });

      // Create rollback audit entry
      await prisma.settingsAuditLog.create({
        data: {
          settingId: auditLog.settingId,
          settingKey: auditLog.settingKey,
          oldValue: auditLog.newValue,
          newValue: auditLog.oldValue,
          changedBy: rolledBackBy,
          changedByEmail: rolledBackByEmail,
          action: AuditAction.ROLLBACK,
          reason: `Rolled back change from ${auditLog.changedByEmail}`,
          canRollback: false,
        },
      });
    });

    this.logger.log(`Setting rolled back: ${auditLog.settingKey} by ${rolledBackByEmail}`);

    return {
      success: true,
      message: `Setting '${auditLog.settingKey}' rolled back successfully`,
    };
  }

  /**
   * Get audit log for a setting
   */
  async getSettingAuditLog(settingKey: string, limit: number = 50) {
    return this.prisma.settingsAuditLog.findMany({
      where: { settingKey },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get all recent audit logs (Admin)
   */
  async getAllAuditLogs(limit: number = 100) {
    return this.prisma.settingsAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        setting: {
          select: {
            key: true,
            label: true,
            category: true,
          },
        },
      },
    });
  }

  /**
   * Delete setting (Admin only)
   */
  async deleteSetting(key: string, deletedBy: string, deletedByEmail: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting '${key}' not found`);
    }

    await this.prisma.$transaction(async (prisma) => {
      // Create audit log before deletion
      await prisma.settingsAuditLog.create({
        data: {
          settingKey: key,
          oldValue: setting.value,
          newValue: null,
          changedBy: deletedBy,
          changedByEmail: deletedByEmail,
          action: AuditAction.DELETE,
          reason: 'Setting deleted',
          canRollback: false,
        },
      });

      // Delete setting
      await prisma.systemSetting.delete({
        where: { key },
      });
    });

    this.logger.log(`Setting deleted: ${key} by ${deletedByEmail}`);

    return {
      success: true,
      message: `Setting '${key}' deleted successfully`,
    };
  }

  /**
   * Get site information (name, tagline, contact email, timezone)
   * Public endpoint - safe to expose
   */
  async getSiteInfo() {
    try {
      const [siteName, siteTagline, contactEmail, timezone] = await Promise.all([
        this.getSetting('site_name').catch(() => ({ key: 'site_name', value: 'NextPik E-commerce' })),
        this.getSetting('site_tagline').catch(() => ({ key: 'site_tagline', value: 'Where Elegance Meets Excellence' })),
        this.getSetting('contact_email').catch(() => ({ key: 'contact_email', value: 'support@luxury.com' })),
        this.getSetting('timezone').catch(() => ({ key: 'timezone', value: 'UTC' })),
      ]);

      return {
        siteName: String(siteName.value),
        siteTagline: String(siteTagline.value),
        contactEmail: String(contactEmail.value),
        timezone: String(timezone.value),
      };
    } catch (error) {
      this.logger.error('Failed to get site info:', error);
      return {
        siteName: 'NextPik E-commerce',
        siteTagline: 'Where Elegance Meets Excellence',
        contactEmail: 'support@luxury.com',
        timezone: 'UTC',
      };
    }
  }

  /**
   * Get site name
   */
  async getSiteName(): Promise<string> {
    try {
      const setting = await this.getSetting('site_name');
      return String(setting.value) || 'NextPik E-commerce';
    } catch (error) {
      return 'NextPik E-commerce';
    }
  }

  /**
   * Get site tagline
   */
  async getSiteTagline(): Promise<string> {
    try {
      const setting = await this.getSetting('site_tagline');
      return String(setting.value) || 'Where Elegance Meets Excellence';
    } catch (error) {
      return 'Where Elegance Meets Excellence';
    }
  }

  /**
   * Get contact email
   */
  async getContactEmail(): Promise<string> {
    try {
      const setting = await this.getSetting('contact_email');
      return String(setting.value) || 'support@luxury.com';
    } catch (error) {
      return 'support@luxury.com';
    }
  }

  /**
   * Get timezone
   */
  async getTimezone(): Promise<string> {
    try {
      const setting = await this.getSetting('timezone');
      return String(setting.value) || 'UTC';
    } catch (error) {
      return 'UTC';
    }
  }

  /**
   * Get audit log retention days
   */
  async getAuditLogRetentionDays(): Promise<number> {
    try {
      const setting = await this.getSetting('audit.log_retention_days');
      return Number(setting.value) || 2555; // Default 7 years
    } catch (error) {
      return 2555; // 7 years
    }
  }

  /**
   * Get low stock threshold
   */
  async getLowStockThreshold(): Promise<number> {
    try {
      const setting = await this.getSetting('inventory.low_stock_threshold');
      return Number(setting.value) || 10;
    } catch (error) {
      return 10;
    }
  }

  /**
   * Get auto SKU generation setting
   */
  async getAutoSkuGeneration(): Promise<boolean> {
    try {
      const setting = await this.getSetting('inventory.auto_sku_generation');
      return Boolean(setting.value);
    } catch (error) {
      return true;
    }
  }

  /**
   * Get SKU prefix
   */
  async getSkuPrefix(): Promise<string> {
    try {
      const setting = await this.getSetting('inventory.sku_prefix');
      return String(setting.value) || 'PROD';
    } catch (error) {
      return 'PROD';
    }
  }

  /**
   * Get stock notifications enabled setting
   */
  async getStockNotificationsEnabled(): Promise<boolean> {
    try {
      const setting = await this.getSetting('inventory.enable_stock_notifications');
      return Boolean(setting.value);
    } catch (error) {
      return true;
    }
  }

  /**
   * Get stock notification recipients
   */
  async getStockNotificationRecipients(): Promise<string[]> {
    try {
      const setting = await this.getSetting('inventory.notification_recipients');
      return Array.isArray(setting.value) ? setting.value as string[] : ['inventory@luxury.com'];
    } catch (error) {
      return ['inventory@luxury.com'];
    }
  }

  /**
   * Get allow negative stock setting
   */
  async getAllowNegativeStock(): Promise<boolean> {
    try {
      const setting = await this.getSetting('inventory.allow_negative_stock');
      return Boolean(setting.value);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get transaction history page size
   */
  async getTransactionHistoryPageSize(): Promise<number> {
    try {
      const setting = await this.getSetting('inventory.transaction_history_page_size');
      return Number(setting.value) || 20;
    } catch (error) {
      return 20;
    }
  }

  /**
   * Get all inventory settings at once (optimized)
   */
  async getInventorySettings() {
    try {
      const settings = await this.getSettingsByCategory('inventory');

      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);

      return {
        lowStockThreshold: Number(settingsMap['inventory.low_stock_threshold']) || 10,
        autoSkuGeneration: Boolean(settingsMap['inventory.auto_sku_generation'] ?? true),
        skuPrefix: String(settingsMap['inventory.sku_prefix']) || 'PROD',
        enableStockNotifications: Boolean(settingsMap['inventory.enable_stock_notifications'] ?? true),
        notificationRecipients: Array.isArray(settingsMap['inventory.notification_recipients'])
          ? settingsMap['inventory.notification_recipients']
          : ['inventory@luxury.com'],
        allowNegativeStock: Boolean(settingsMap['inventory.allow_negative_stock'] ?? false),
        transactionHistoryPageSize: Number(settingsMap['inventory.transaction_history_page_size']) || 20,
      };
    } catch (error) {
      // Return defaults if settings don't exist
      return {
        lowStockThreshold: 10,
        autoSkuGeneration: true,
        skuPrefix: 'PROD',
        enableStockNotifications: true,
        notificationRecipients: ['inventory@luxury.com'],
        allowNegativeStock: false,
        transactionHistoryPageSize: 20,
      };
    }
  }

  /**
   * Get Stripe configuration (for dynamic Stripe client initialization)
   * NOTE: API keys are read from environment variables (.env), not database
   * Business configuration (enabled, currency, etc.) comes from database
   */
  async getStripeConfig() {
    try {
      const [
        enabled,
        testMode,
        currency,
        captureMethod,
        statementDescriptor,
        autoPayoutEnabled,
      ] = await Promise.all([
        this.getSetting('stripe_enabled').catch(() => ({ value: false })),
        this.getSetting('stripe_test_mode').catch(() => ({ value: true })),
        this.getSetting('stripe_currency').catch(() => ({ value: 'USD' })),
        this.getSetting('stripe_capture_method').catch(() => ({ value: 'manual' })),
        this.getSetting('stripe_statement_descriptor').catch(() => ({ value: 'LUXURY ECOM' })),
        this.getSetting('stripe_auto_payout_enabled').catch(() => ({ value: false })),
      ]);

      // Read API keys from environment variables
      const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
      const secretKey = process.env.STRIPE_SECRET_KEY || '';
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

      return {
        enabled: Boolean(enabled.value),
        testMode: Boolean(testMode.value),
        publishableKey,
        secretKey,
        webhookSecret,
        currency: String(currency.value || 'USD'),
        captureMethod: String(captureMethod.value || 'manual') as 'automatic' | 'manual',
        statementDescriptor: String(statementDescriptor.value || 'LUXURY ECOM'),
        autoPayoutEnabled: Boolean(autoPayoutEnabled.value),
      };
    } catch (error) {
      this.logger.error('Failed to get Stripe config:', error);
      // Fallback to environment variables even on error
      return {
        enabled: false,
        testMode: true,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
        currency: 'USD',
        captureMethod: 'manual' as 'automatic' | 'manual',
        statementDescriptor: 'LUXURY ECOM',
        autoPayoutEnabled: false,
      };
    }
  }

  /**
   * Check if Stripe is properly configured (has required API keys)
   * NOTE: This checks if keys exist in environment, not if integration is enabled
   */
  async isStripeConfigured(): Promise<boolean> {
    try {
      const config = await this.getStripeConfig();
      // Check if required keys are present (from environment variables)
      return !!config.secretKey && !!config.publishableKey;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get Stripe publishable key (safe for frontend)
   * Reads from environment variables, not database
   */
  async getStripePublishableKey(): Promise<string> {
    return process.env.STRIPE_PUBLISHABLE_KEY || '';
  }

  /**
   * Get Stripe secret key (backend only)
   * Reads from environment variables, not database
   */
  async getStripeSecretKey(): Promise<string> {
    return process.env.STRIPE_SECRET_KEY || '';
  }

  /**
   * Get Stripe webhook secret (backend only)
   * Reads from environment variables, not database
   */
  async getStripeWebhookSecret(): Promise<string> {
    return process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  /**
   * Check if Stripe is in test mode
   */
  async isStripeTestMode(): Promise<boolean> {
    try {
      const setting = await this.getSetting('stripe_test_mode');
      return Boolean(setting.value ?? true);
    } catch (error) {
      return true; // Default to test mode for safety
    }
  }

  // ============================================================================
  // TAX SETTINGS
  // ============================================================================

  /**
   * Get tax calculation mode
   */
  async getTaxCalculationMode(): Promise<'disabled' | 'simple' | 'by_state'> {
    try {
      const setting = await this.getSetting('tax_calculation_mode');
      const mode = String(setting.value);
      if (mode === 'disabled' || mode === 'simple' || mode === 'by_state') {
        return mode as 'disabled' | 'simple' | 'by_state';
      }
      return 'disabled';
    } catch (error) {
      return 'disabled'; // Default to no tax
    }
  }

  /**
   * Get tax default rate (for simple mode)
   */
  async getTaxDefaultRate(): Promise<number> {
    try {
      const setting = await this.getSetting('tax_default_rate');
      const rate = Number(setting.value);
      return isNaN(rate) ? 0.10 : rate;
    } catch (error) {
      return 0.10; // Default 10%
    }
  }

  /**
   * Check if tax calculation is enabled
   * Now uses tax_calculation_mode instead of legacy tax_calculation_enabled
   */
  async isTaxCalculationEnabled(): Promise<boolean> {
    try {
      const setting = await this.getSetting('tax_calculation_mode');
      return setting.value !== 'disabled';
    } catch (error) {
      return false;
    }
  }

  // ============================================================================
  // SHIPPING SETTINGS
  // ============================================================================

  /**
   * Get shipping mode
   */
  async getShippingMode(): Promise<'manual' | 'dhl_api' | 'hybrid'> {
    try {
      const setting = await this.getSetting('shipping_mode');
      const mode = String(setting.value);
      if (mode === 'manual' || mode === 'dhl_api' || mode === 'hybrid') {
        return mode as 'manual' | 'dhl_api' | 'hybrid';
      }
      return 'manual';
    } catch (error) {
      return 'manual'; // Default to manual mode
    }
  }

  /**
   * Get manual shipping rates (all methods)
   */
  async getShippingRates(): Promise<{
    standard: number;
    express: number;
    overnight: number;
    internationalSurcharge: number;
  }> {
    try {
      const [standard, express, overnight, intlSurcharge] = await Promise.all([
        this.getSetting('shipping_standard_rate').catch(() => ({ value: 9.99 })),
        this.getSetting('shipping_express_rate').catch(() => ({ value: 19.99 })),
        this.getSetting('shipping_overnight_rate').catch(() => ({ value: 29.99 })),
        this.getSetting('shipping_international_surcharge').catch(() => ({ value: 15.00 })),
      ]);

      return {
        standard: Number(standard.value) || 9.99,
        express: Number(express.value) || 19.99,
        overnight: Number(overnight.value) || 29.99,
        internationalSurcharge: Number(intlSurcharge.value) || 15.00,
      };
    } catch (error) {
      // Fallback to hardcoded defaults
      return {
        standard: 9.99,
        express: 19.99,
        overnight: 29.99,
        internationalSurcharge: 15.00,
      };
    }
  }
}
