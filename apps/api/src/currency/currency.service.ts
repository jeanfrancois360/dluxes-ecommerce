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
   */
  async toggleActive(currencyCode: string) {
    const existing = await this.getRateByCode(currencyCode);

    return this.prisma.currencyRate.update({
      where: { id: existing.id },
      data: {
        isActive: !existing.isActive,
        lastUpdated: new Date(),
      },
    });
  }

  /**
   * Delete a currency rate (Admin only)
   * Note: USD cannot be deleted as it's the base currency
   */
  async deleteRate(currencyCode: string) {
    if (currencyCode.toUpperCase() === 'USD') {
      throw new Error('Cannot delete base currency (USD)');
    }

    const existing = await this.getRateByCode(currencyCode);

    return this.prisma.currencyRate.delete({
      where: { id: existing.id },
    });
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
   */
  async syncExchangeRates() {
    const autoSyncEnabled = await this.isAutoSyncEnabled();
    if (!autoSyncEnabled) {
      this.logger.log('Currency auto-sync is disabled, skipping rate sync');
      return { synced: 0, message: 'Auto-sync disabled' };
    }

    this.logger.log('Syncing exchange rates from external API...');
    // TODO: Implement external API sync (e.g., exchangerate-api.com)
    // This is where you'd fetch latest rates and update the database

    return { synced: 0, message: 'Auto-sync not yet implemented' };
  }

  /**
   * Validate currency is supported
   */
  async validateCurrency(currencyCode: string): Promise<boolean> {
    const supported = await this.getSupportedCurrencies();
    return supported.includes(currencyCode.toUpperCase());
  }
}
