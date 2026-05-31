import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SettingValueType, AuditAction } from '@prisma/client';
import { SETTING_DEFAULTS } from './settings.defaults';

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
        this.getSetting('site_name').catch(() => ({ value: null })),
        this.getSetting('site_tagline').catch(() => ({ value: null })),
        this.getSetting('contact_email').catch(() => ({ value: null })),
        this.getSetting('timezone').catch(() => ({ value: null })),
      ]);

      return {
        siteName: siteName.value != null ? String(siteName.value) : SETTING_DEFAULTS.site.name,
        siteTagline:
          siteTagline.value != null ? String(siteTagline.value) : SETTING_DEFAULTS.site.tagline,
        contactEmail:
          contactEmail.value != null
            ? String(contactEmail.value)
            : SETTING_DEFAULTS.site.contact_email,
        timezone: timezone.value != null ? String(timezone.value) : SETTING_DEFAULTS.site.timezone,
      };
    } catch (error) {
      this.logger.error('Failed to get site info:', error);
      return {
        siteName: SETTING_DEFAULTS.site.name,
        siteTagline: SETTING_DEFAULTS.site.tagline,
        contactEmail: SETTING_DEFAULTS.site.contact_email,
        timezone: SETTING_DEFAULTS.site.timezone,
      };
    }
  }

  /**
   * Get site name
   */
  async getSiteName(): Promise<string> {
    try {
      const setting = await this.getSetting('site_name');
      if (setting?.value != null) return String(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn('Setting "site_name" missing from database, using fallback default');
    return SETTING_DEFAULTS.site.name;
  }

  /**
   * Get site tagline
   */
  async getSiteTagline(): Promise<string> {
    try {
      const setting = await this.getSetting('site_tagline');
      if (setting?.value != null) return String(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn('Setting "site_tagline" missing from database, using fallback default');
    return SETTING_DEFAULTS.site.tagline;
  }

  /**
   * Get contact email
   */
  async getContactEmail(): Promise<string> {
    try {
      const setting = await this.getSetting('contact_email');
      if (setting?.value != null) return String(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn('Setting "contact_email" missing from database, using fallback default');
    return SETTING_DEFAULTS.site.contact_email;
  }

  /**
   * Get timezone
   */
  async getTimezone(): Promise<string> {
    try {
      const setting = await this.getSetting('timezone');
      if (setting?.value != null) return String(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn('Setting "timezone" missing from database, using fallback default');
    return SETTING_DEFAULTS.site.timezone;
  }

  /**
   * Get audit log retention days
   * NOTE: Key corrected from 'audit.log_retention_days' (dot) to 'audit_log_retention_days'
   * (underscore) to match the actual DB column. The old key never matched, so this fallback
   * was silently firing on every call in production.
   */
  async getAuditLogRetentionDays(): Promise<number> {
    try {
      const setting = await this.getSetting('audit_log_retention_days');
      if (setting?.value != null) return Number(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn(
      'Setting "audit_log_retention_days" missing from database, using fallback default'
    );
    return SETTING_DEFAULTS.audit.log_retention_days;
  }

  /**
   * Get low stock threshold
   */
  async getLowStockThreshold(): Promise<number> {
    try {
      const setting = await this.getSetting('inventory.low_stock_threshold');
      if (setting?.value != null) return Number(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn(
      'Setting "inventory.low_stock_threshold" missing from database, using fallback default'
    );
    return SETTING_DEFAULTS.inventory.low_stock_threshold;
  }

  /**
   * Get auto SKU generation setting
   */
  async getAutoSkuGeneration(): Promise<boolean> {
    try {
      const setting = await this.getSetting('inventory.auto_sku_generation');
      if (setting?.value != null) return Boolean(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn(
      'Setting "inventory.auto_sku_generation" missing from database, using fallback default'
    );
    return SETTING_DEFAULTS.inventory.auto_sku_generation;
  }

  /**
   * Get SKU prefix
   */
  async getSkuPrefix(): Promise<string> {
    try {
      const setting = await this.getSetting('inventory.sku_prefix');
      if (setting?.value != null) return String(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn(
      'Setting "inventory.sku_prefix" missing from database, using fallback default'
    );
    return SETTING_DEFAULTS.inventory.sku_prefix;
  }

  /**
   * Get stock notifications enabled setting
   */
  async getStockNotificationsEnabled(): Promise<boolean> {
    try {
      const setting = await this.getSetting('inventory.enable_stock_notifications');
      if (setting?.value != null) return Boolean(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn(
      'Setting "inventory.enable_stock_notifications" missing from database, using fallback default'
    );
    return SETTING_DEFAULTS.inventory.enable_stock_notifications;
  }

  /**
   * Get stock notification recipients
   */
  async getStockNotificationRecipients(): Promise<string[]> {
    try {
      const setting = await this.getSetting('inventory.notification_recipients');
      if (setting?.value != null && Array.isArray(setting.value)) return setting.value as string[];
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn(
      'Setting "inventory.notification_recipients" missing from database, using fallback default'
    );
    return [...SETTING_DEFAULTS.inventory.notification_recipients];
  }

  /**
   * Get allow negative stock setting
   */
  async getAllowNegativeStock(): Promise<boolean> {
    try {
      const setting = await this.getSetting('inventory.allow_negative_stock');
      if (setting?.value != null) return Boolean(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn(
      'Setting "inventory.allow_negative_stock" missing from database, using fallback default'
    );
    return SETTING_DEFAULTS.inventory.allow_negative_stock;
  }

  /**
   * Get transaction history page size
   */
  async getTransactionHistoryPageSize(): Promise<number> {
    try {
      const setting = await this.getSetting('inventory.transaction_history_page_size');
      if (setting?.value != null) return Number(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn(
      'Setting "inventory.transaction_history_page_size" missing from database, using fallback default'
    );
    return SETTING_DEFAULTS.inventory.transaction_history_page_size;
  }

  /**
   * Get all inventory settings at once (optimized)
   */
  async getInventorySettings() {
    try {
      const settings = await this.getSettingsByCategory('inventory');

      const map = settings.reduce(
        (acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        },
        {} as Record<string, any>
      );

      return {
        lowStockThreshold:
          map['inventory.low_stock_threshold'] != null
            ? Number(map['inventory.low_stock_threshold'])
            : SETTING_DEFAULTS.inventory.low_stock_threshold,
        autoSkuGeneration:
          map['inventory.auto_sku_generation'] != null
            ? Boolean(map['inventory.auto_sku_generation'])
            : SETTING_DEFAULTS.inventory.auto_sku_generation,
        skuPrefix:
          map['inventory.sku_prefix'] != null
            ? String(map['inventory.sku_prefix'])
            : SETTING_DEFAULTS.inventory.sku_prefix,
        enableStockNotifications:
          map['inventory.enable_stock_notifications'] != null
            ? Boolean(map['inventory.enable_stock_notifications'])
            : SETTING_DEFAULTS.inventory.enable_stock_notifications,
        notificationRecipients: Array.isArray(map['inventory.notification_recipients'])
          ? map['inventory.notification_recipients']
          : [...SETTING_DEFAULTS.inventory.notification_recipients],
        allowNegativeStock:
          map['inventory.allow_negative_stock'] != null
            ? Boolean(map['inventory.allow_negative_stock'])
            : SETTING_DEFAULTS.inventory.allow_negative_stock,
        transactionHistoryPageSize:
          map['inventory.transaction_history_page_size'] != null
            ? Number(map['inventory.transaction_history_page_size'])
            : SETTING_DEFAULTS.inventory.transaction_history_page_size,
      };
    } catch (error) {
      this.logger.warn('Failed to fetch inventory settings, using fallback defaults');
      return {
        lowStockThreshold: SETTING_DEFAULTS.inventory.low_stock_threshold,
        autoSkuGeneration: SETTING_DEFAULTS.inventory.auto_sku_generation,
        skuPrefix: SETTING_DEFAULTS.inventory.sku_prefix,
        enableStockNotifications: SETTING_DEFAULTS.inventory.enable_stock_notifications,
        notificationRecipients: [...SETTING_DEFAULTS.inventory.notification_recipients],
        allowNegativeStock: SETTING_DEFAULTS.inventory.allow_negative_stock,
        transactionHistoryPageSize: SETTING_DEFAULTS.inventory.transaction_history_page_size,
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
      const [enabled, testMode, currency, captureMethod, statementDescriptor, autoPayoutEnabled] =
        await Promise.all([
          this.getSetting('stripe_enabled').catch(() => ({ value: null })),
          this.getSetting('stripe_test_mode').catch(() => ({ value: null })),
          this.getSetting('stripe_currency').catch(() => ({ value: null })),
          this.getSetting('stripe_capture_method').catch(() => ({ value: null })),
          this.getSetting('stripe_statement_descriptor').catch(() => ({ value: null })),
          this.getSetting('stripe_auto_payout_enabled').catch(() => ({ value: null })),
        ]);

      // Read API keys from environment variables (never stored in DB)
      const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
      const secretKey = process.env.STRIPE_SECRET_KEY || '';
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

      return {
        enabled: enabled.value != null ? Boolean(enabled.value) : SETTING_DEFAULTS.stripe.enabled,
        testMode:
          testMode.value != null ? Boolean(testMode.value) : SETTING_DEFAULTS.stripe.test_mode,
        publishableKey,
        secretKey,
        webhookSecret,
        currency:
          currency.value != null ? String(currency.value) : SETTING_DEFAULTS.stripe.currency,
        captureMethod: (captureMethod.value != null
          ? String(captureMethod.value)
          : SETTING_DEFAULTS.stripe.capture_method) as 'automatic' | 'manual',
        statementDescriptor:
          statementDescriptor.value != null
            ? String(statementDescriptor.value)
            : SETTING_DEFAULTS.stripe.statement_descriptor,
        autoPayoutEnabled:
          autoPayoutEnabled.value != null
            ? Boolean(autoPayoutEnabled.value)
            : SETTING_DEFAULTS.stripe.auto_payout_enabled,
      };
    } catch (error) {
      this.logger.error('Failed to get Stripe config:', error);
      return {
        enabled: SETTING_DEFAULTS.stripe.enabled,
        testMode: SETTING_DEFAULTS.stripe.test_mode,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
        currency: SETTING_DEFAULTS.stripe.currency,
        captureMethod: SETTING_DEFAULTS.stripe.capture_method,
        statementDescriptor: SETTING_DEFAULTS.stripe.statement_descriptor,
        autoPayoutEnabled: SETTING_DEFAULTS.stripe.auto_payout_enabled,
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
      if (setting?.value != null) return Boolean(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn('Setting "stripe_test_mode" missing from database, using fallback default');
    return SETTING_DEFAULTS.stripe.test_mode;
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
      if (setting?.value != null) {
        const mode = String(setting.value);
        if (mode === 'disabled' || mode === 'simple' || mode === 'by_state') {
          return mode;
        }
        this.logger.warn(
          `Setting "tax_calculation_mode" has invalid value "${mode}", using fallback default`
        );
      }
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn(
      'Setting "tax_calculation_mode" missing from database, using fallback default'
    );
    return SETTING_DEFAULTS.tax.calculation_mode;
  }

  /**
   * Get tax default rate (for simple mode)
   */
  async getTaxDefaultRate(): Promise<number> {
    try {
      const setting = await this.getSetting('tax_default_rate');
      if (setting?.value != null) {
        const rate = Number(setting.value);
        if (!isNaN(rate)) return rate;
      }
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn('Setting "tax_default_rate" missing from database, using fallback default');
    return SETTING_DEFAULTS.tax.default_rate;
  }

  /**
   * Check if tax calculation is enabled
   * Now uses tax_calculation_mode instead of legacy tax_calculation_enabled
   */
  async isTaxCalculationEnabled(): Promise<boolean> {
    try {
      const setting = await this.getSetting('tax_calculation_mode');
      if (setting?.value != null) return setting.value !== 'disabled';
    } catch {
      // DB unavailable or setting missing
    }
    return SETTING_DEFAULTS.tax.calculation_mode !== 'disabled';
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
      if (setting?.value != null) {
        const mode = String(setting.value);
        if (mode === 'manual' || mode === 'dhl_api' || mode === 'hybrid') {
          return mode;
        }
        this.logger.warn(
          `Setting "shipping_mode" has invalid value "${mode}", using fallback default`
        );
      }
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn('Setting "shipping_mode" missing from database, using fallback default');
    return SETTING_DEFAULTS.shipping.mode;
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
        this.getSetting('shipping_standard_rate').catch(() => ({ value: null })),
        this.getSetting('shipping_express_rate').catch(() => ({ value: null })),
        this.getSetting('shipping_overnight_rate').catch(() => ({ value: null })),
        this.getSetting('shipping_international_surcharge').catch(() => ({ value: null })),
      ]);

      return {
        standard:
          standard.value != null ? Number(standard.value) : SETTING_DEFAULTS.shipping.standard_rate,
        express:
          express.value != null ? Number(express.value) : SETTING_DEFAULTS.shipping.express_rate,
        overnight:
          overnight.value != null
            ? Number(overnight.value)
            : SETTING_DEFAULTS.shipping.overnight_rate,
        internationalSurcharge:
          intlSurcharge.value != null
            ? Number(intlSurcharge.value)
            : SETTING_DEFAULTS.shipping.international_surcharge,
      };
    } catch (error) {
      this.logger.warn('Failed to fetch shipping rates, using fallback defaults');
      return {
        standard: SETTING_DEFAULTS.shipping.standard_rate,
        express: SETTING_DEFAULTS.shipping.express_rate,
        overnight: SETTING_DEFAULTS.shipping.overnight_rate,
        internationalSurcharge: SETTING_DEFAULTS.shipping.international_surcharge,
      };
    }
  }

  // ============================================================================
  // SELF-PICKUP SETTINGS (v2.10.0)
  // ============================================================================

  /**
   * Check if self-pickup is enabled platform-wide
   */
  async isPickupEnabled(): Promise<boolean> {
    try {
      const setting = await this.getSetting('pickup_enabled');
      if (setting?.value != null) return Boolean(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn('Setting "pickup_enabled" missing from database, using fallback default');
    return SETTING_DEFAULTS.pickup.enabled;
  }

  /**
   * Get default pickup radius in kilometers
   */
  async getPickupDefaultRadius(): Promise<number> {
    try {
      const setting = await this.getSetting('pickup_default_radius_km');
      if (setting?.value != null) return Number(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn(
      'Setting "pickup_default_radius_km" missing from database, using fallback default'
    );
    return SETTING_DEFAULTS.pickup.default_radius_km;
  }

  /**
   * Check if pickup code verification is required
   */
  async isPickupCodeVerificationRequired(): Promise<boolean> {
    try {
      const setting = await this.getSetting('pickup_require_code_verification');
      if (setting?.value != null) return Boolean(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn(
      'Setting "pickup_require_code_verification" missing from database, using fallback default'
    );
    return SETTING_DEFAULTS.pickup.require_code_verification;
  }

  /**
   * Get pickup expiration days
   */
  async getPickupExpirationDays(): Promise<number> {
    try {
      const setting = await this.getSetting('pickup_expiration_days');
      if (setting?.value != null) return Number(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn(
      'Setting "pickup_expiration_days" missing from database, using fallback default'
    );
    return SETTING_DEFAULTS.pickup.expiration_days;
  }

  /**
   * Check if pickup scheduling is allowed
   */
  async isPickupSchedulingAllowed(): Promise<boolean> {
    try {
      const setting = await this.getSetting('pickup_allow_scheduling');
      if (setting?.value != null) return Boolean(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn(
      'Setting "pickup_allow_scheduling" missing from database, using fallback default'
    );
    return SETTING_DEFAULTS.pickup.allow_scheduling;
  }

  /**
   * Get default pickup fee
   */
  async getPickupDefaultFee(): Promise<number> {
    try {
      const setting = await this.getSetting('pickup_default_fee');
      if (setting?.value != null) return Number(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    this.logger.warn('Setting "pickup_default_fee" missing from database, using fallback default');
    return SETTING_DEFAULTS.pickup.default_fee;
  }

  /**
   * Get all pickup settings (convenience method)
   */
  async getPickupSettings(): Promise<{
    enabled: boolean;
    defaultRadius: number;
    requireCodeVerification: boolean;
    expirationDays: number;
    allowScheduling: boolean;
    defaultFee: number;
  }> {
    const [
      enabled,
      defaultRadius,
      requireCodeVerification,
      expirationDays,
      allowScheduling,
      defaultFee,
    ] = await Promise.all([
      this.isPickupEnabled(),
      this.getPickupDefaultRadius(),
      this.isPickupCodeVerificationRequired(),
      this.getPickupExpirationDays(),
      this.isPickupSchedulingAllowed(),
      this.getPickupDefaultFee(),
    ]);

    return {
      enabled,
      defaultRadius,
      requireCodeVerification,
      expirationDays,
      allowScheduling,
      defaultFee,
    };
  }
}
