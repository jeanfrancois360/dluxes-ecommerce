import { api } from './client';

export interface CurrencyRate {
  id: string;
  currencyCode: string;
  currencyName: string;
  symbol: string;
  rate: number;
  isActive: boolean;
  lastUpdated: string;
  updatedBy: string | null;
  decimalDigits: number;
  position: 'before' | 'after';
  createdAt: string;
  updatedAt: string;
}

export interface ConvertCurrencyResponse {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  convertedAmount: number;
}

export const currencyApi = {
  /**
   * Get all active currency rates
   */
  async getRates(): Promise<CurrencyRate[]> {
    const response = await api.get('/currency/rates');
    return response;
  },

  /**
   * Get a specific currency rate by code
   */
  async getRate(currencyCode: string): Promise<CurrencyRate> {
    const response = await api.get(`/currency/rates/${currencyCode}`);
    return response;
  },

  /**
   * Convert amount between currencies
   */
  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<ConvertCurrencyResponse> {
    const response = await api.get(
      `/currency/convert?amount=${amount}&fromCurrency=${fromCurrency}&toCurrency=${toCurrency}`
    );
    return response;
  },

  /**
   * Format price with currency symbol
   */
  formatPrice(amount: number, currency: CurrencyRate): string {
    const formattedAmount = amount.toFixed(currency.decimalDigits);

    if (currency.position === 'before') {
      return `${currency.symbol}${formattedAmount}`;
    } else {
      return `${formattedAmount} ${currency.symbol}`;
    }
  },

  /**
   * Format price with symbol and code (e.g., "$100 / USD")
   */
  formatPriceWithCode(amount: number, currency: CurrencyRate): string {
    const price = this.formatPrice(amount, currency);
    return `${price} / ${currency.currencyCode}`;
  },
};

// Admin API endpoints
export const currencyAdminApi = {
  /**
   * Get all currencies including inactive (Admin only)
   */
  async getAllCurrencies(): Promise<CurrencyRate[]> {
    const response = await api.get('/currency/admin/all');
    return response;
  },

  /**
   * Create a new currency rate (Admin only)
   */
  async createRate(data: Partial<CurrencyRate>): Promise<CurrencyRate> {
    const response = await api.post('/currency/admin/rates', data);
    return response;
  },

  /**
   * Update a currency rate (Admin only)
   */
  async updateRate(currencyCode: string, data: Partial<CurrencyRate>): Promise<CurrencyRate> {
    const response = await api.patch(`/currency/admin/rates/${currencyCode}`, data);
    return response;
  },

  /**
   * Toggle currency active status (Admin only)
   */
  async toggleActive(currencyCode: string): Promise<CurrencyRate> {
    const response = await api.patch(`/currency/admin/rates/${currencyCode}/toggle`);
    return response;
  },

  /**
   * Delete a currency rate (Admin only)
   */
  async deleteRate(currencyCode: string): Promise<void> {
    await api.delete(`/currency/admin/rates/${currencyCode}`);
  },
};
