import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateCurrencyRateDto, CreateCurrencyRateDto } from './dto/currency.dto';

@Injectable()
export class CurrencyService {
  constructor(private readonly prisma: PrismaService) {}

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
}
