import { api } from './client';

export interface SystemSetting {
  key: string;
  value: any;
  label: string;
  description: string;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY';
}

export const settingsApi = {
  /**
   * Get all public settings (no auth required)
   */
  async getPublicSettings(): Promise<SystemSetting[]> {
    const response = await api.get('/settings/public');
    return response.data || [];
  },

  /**
   * Get a specific public setting by key
   */
  async getPublicSetting(key: string): Promise<SystemSetting | null> {
    try {
      const settings = await this.getPublicSettings();
      return settings.find(s => s.key === key) || null;
    } catch (error) {
      console.error(`Error fetching setting ${key}:`, error);
      return null;
    }
  },

  /**
   * Get default currency from settings
   */
  async getDefaultCurrency(): Promise<string> {
    const setting = await this.getPublicSetting('default_currency');
    return setting?.value || 'USD';
  },

  /**
   * Get supported currencies from settings
   */
  async getSupportedCurrencies(): Promise<string[]> {
    const setting = await this.getPublicSetting('supported_currencies');
    return setting?.value || ['USD', 'EUR', 'GBP', 'JPY', 'RWF'];
  },
};
