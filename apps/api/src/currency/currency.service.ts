import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { UpdateCurrencyRateDto, CreateCurrencyRateDto } from './dto/currency.dto';

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Get all active currency rates
   */
  async getAllRates() {
    return this.prisma.currencyRate.findMany({
      where: { isActive: true },
      orderBy: { currencyCode: 'asc' },
    });
  }

  /**
   * Get all currencies (including inactive) for admin
   */
  async getAllCurrenciesAdmin() {
    return this.prisma.currencyRate.findMany({
      orderBy: { currencyCode: 'asc' },
    });
  }

  /**
   * Get a specific currency rate by code
   */
  async getRateByCode(currencyCode: string) {
    const rate = await this.prisma.currencyRate.findUnique({
      where: { currencyCode: currencyCode.toUpperCase() },
    });

    if (!rate) {
      throw new NotFoundException(`Currency ${currencyCode} not found`);
    }

    return rate;
  }

  /**
   * Convert amount from one currency to another
   */
  async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    // If same currency, return same amount
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Get both currency rates
    const [fromRate, toRate] = await Promise.all([
      this.getRateByCode(fromCurrency),
      this.getRateByCode(toCurrency),
    ]);

    // Convert to base currency (USD) first, then to target currency
    const baseAmount = amount / Number(fromRate.rate);
    const convertedAmount = baseAmount * Number(toRate.rate);

    // Round to appropriate decimal places
    return Number(convertedAmount.toFixed(toRate.decimalDigits));
  }

  /**
   * Create a new currency rate (Admin only)
   */
  async createRate(dto: CreateCurrencyRateDto, adminId?: string) {
    return this.prisma.currencyRate.create({
      data: {
        ...dto,
        updatedBy: adminId,
      },
    });
  }

  /**
   * Update a currency rate (Admin only)
   */
  async updateRate(
    currencyCode: string,
    dto: UpdateCurrencyRateDto,
    adminId?: string
  ) {
    const existing = await this.getRateByCode(currencyCode);

    return this.prisma.currencyRate.update({
      where: { id: existing.id },
      data: {
        ...dto,
        lastUpdated: new Date(),
        updatedBy: adminId,
      },
    });
  }

  /**
   * Toggle currency active status (Admin only)
   * Automatically syncs with supported_currencies setting
   */
  async toggleActive(currencyCode: string) {
    const existing = await this.getRateByCode(currencyCode);
    const newActiveStatus = !existing.isActive;

    // Update currency active status
    const updatedCurrency = await this.prisma.currencyRate.update({
      where: { id: existing.id },
      data: {
        isActive: newActiveStatus,
        lastUpdated: new Date(),
      },
    });

    // Sync with supported_currencies setting
    try {
      await this.syncSupportedCurrencies(currencyCode, newActiveStatus);
    } catch (error) {
      this.logger.warn(`Failed to sync supported_currencies setting: ${error.message}`);
      // Don't fail the request if settings sync fails
    }

    return updatedCurrency;
  }

  /**
   * Sync currency active status with supported_currencies setting
   */
  private async syncSupportedCurrencies(currencyCode: string, isActive: boolean) {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'supported_currencies' },
      });

      if (!setting) {
        this.logger.warn('supported_currencies setting not found');
        return;
      }

      let supportedCurrencies = setting.value as string[];

      if (isActive) {
        // Add to supported currencies if not already there
        if (!supportedCurrencies.includes(currencyCode)) {
          supportedCurrencies.push(currencyCode);
          supportedCurrencies.sort(); // Keep alphabetically sorted
        }
      } else {
        // Remove from supported currencies
        supportedCurrencies = supportedCurrencies.filter(code => code !== currencyCode);
      }

      // Update the setting
      await this.prisma.systemSetting.update({
        where: { key: 'supported_currencies' },
        data: { value: supportedCurrencies },
      });

      this.logger.log(`Synced supported_currencies: ${supportedCurrencies.join(', ')}`);
    } catch (error) {
      this.logger.error(`Error syncing supported_currencies: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a currency rate (Admin only)
   * Note: USD cannot be deleted as it's the base currency
   * Automatically removes from supported_currencies setting
   */
  async deleteRate(currencyCode: string) {
    if (currencyCode.toUpperCase() === 'USD') {
      throw new Error('Cannot delete base currency (USD)');
    }

    const existing = await this.getRateByCode(currencyCode);

    // Delete the currency
    const deleted = await this.prisma.currencyRate.delete({
      where: { id: existing.id },
    });

    // Remove from supported_currencies setting
    try {
      await this.syncSupportedCurrencies(currencyCode, false);
    } catch (error) {
      this.logger.warn(`Failed to sync supported_currencies after deletion: ${error.message}`);
    }

    return deleted;
  }

  /**
   * Format price with currency symbol and code
   */
  formatPrice(
    amount: number,
    currency: { symbol: string; currencyCode: string; position: string; decimalDigits: number }
  ): string {
    const formattedAmount = amount.toFixed(currency.decimalDigits);

    if (currency.position === 'before') {
      return `${currency.symbol}${formattedAmount}`;
    } else {
      return `${formattedAmount} ${currency.symbol}`;
    }
  }

  /**
   * Get default currency from settings
   */
  async getDefaultCurrency(): Promise<string> {
    try {
      const setting = await this.settingsService.getSetting('default_currency');
      return String(setting.value) || 'USD';
    } catch (error) {
      this.logger.warn('Default currency setting not found, using USD');
      return 'USD';
    }
  }

  /**
   * Get supported currencies from settings
   */
  async getSupportedCurrencies(): Promise<string[]> {
    try {
      const setting = await this.settingsService.getSetting('supported_currencies');
      const currencies = String(setting.value);
      return currencies.split(',').map(c => c.trim());
    } catch (error) {
      this.logger.warn('Supported currencies setting not found, using defaults');
      return ['USD', 'EUR', 'GBP', 'RWF'];
    }
  }

  /**
   * Check if auto-sync is enabled
   */
  async isAutoSyncEnabled(): Promise<boolean> {
    try {
      const setting = await this.settingsService.getSetting('currency_auto_sync');
      return setting.value === 'true' || setting.value === true;
    } catch (error) {
      return true; // Default to enabled
    }
  }

  /**
   * Sync exchange rates from external API
   * Only runs if currency_auto_sync is enabled
   * Uses exchangerate-api.com free tier (1,500 requests/month)
   */
  async syncExchangeRates() {
    const autoSyncEnabled = await this.isAutoSyncEnabled();
    if (!autoSyncEnabled) {
      this.logger.log('Currency auto-sync is disabled, skipping rate sync');
      return { synced: 0, message: 'Auto-sync disabled', error: null };
    }

    this.logger.log('Syncing exchange rates from external API...');

    try {
      // Free API - no key required for basic usage
      // Using USD as base currency (all rates are relative to USD)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');

      if (!response.ok) {
        throw new Error(`Exchange rate API returned ${response.status}`);
      }

      const data: { rates?: Record<string, number> } = await response.json();

      if (!data.rates) {
        throw new Error('Invalid response from exchange rate API');
      }

      // Get all active currencies in our database
      const activeCurrencies = await this.prisma.currencyRate.findMany({
        where: { isActive: true },
      });

      let syncedCount = 0;
      const errors: string[] = [];

      // Update rates for all active currencies
      for (const currency of activeCurrencies) {
        const code = currency.currencyCode;
        const newRate = data.rates[code];

        if (newRate) {
          try {
            await this.prisma.currencyRate.update({
              where: { id: currency.id },
              data: {
                rate: newRate,
                lastUpdated: new Date(),
                updatedBy: 'auto-sync',
              },
            });
            syncedCount++;
            this.logger.log(`Updated ${code}: ${currency.rate} → ${newRate}`);
          } catch (error) {
            errors.push(`${code}: ${error.message}`);
            this.logger.error(`Failed to update ${code}:`, error);
          }
        } else {
          this.logger.warn(`No rate found for ${code} in API response`);
          errors.push(`${code}: Not found in API response`);
        }
      }

      const message = `Successfully synced ${syncedCount} of ${activeCurrencies.length} currencies`;
      this.logger.log(message);

      return {
        synced: syncedCount,
        total: activeCurrencies.length,
        message,
        errors: errors.length > 0 ? errors : null,
        lastSync: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = `Failed to sync exchange rates: ${error.message}`;
      this.logger.error(errorMessage);
      return {
        synced: 0,
        message: errorMessage,
        error: error.message,
      };
    }
  }

  /**
   * Validate currency is supported
   */
  async validateCurrency(currencyCode: string): Promise<boolean> {
    const supported = await this.getSupportedCurrencies();
    return supported.includes(currencyCode.toUpperCase());
  }
}
