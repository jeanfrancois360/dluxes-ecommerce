import axios, { AxiosInstance } from 'axios';
import { TestResult, pass, fail, warn, skip } from './auth.agent';

const API_URL = 'http://localhost:4000/api/v1';

interface Tokens {
  buyerToken?: string;
  sellerToken?: string;
  adminToken?: string;
}

export class SettingsAgent {
  private client: AxiosInstance;
  private tokens: Tokens;

  constructor(tokens: Tokens = {}) {
    this.client = axios.create({
      baseURL: API_URL,
      validateStatus: () => true, // Don't throw on any status
    });
    this.tokens = tokens;
  }

  async runAll(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Run tests in sequence
    results.push(await this.testPublicSettings());
    results.push(await this.testRequiredSettings());
    results.push(await this.testCurrencyRates());
    results.push(await this.testCurrencyConversion());
    results.push(await this.testTaxSettings());
    results.push(await this.testPaymentSettings());
    results.push(await this.testEscrowSettings());
    results.push(await this.testCommissionSettings());

    return results;
  }

  async testPublicSettings(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/settings/public');

      if (response.status === 200) {
        const data = response.data;
        const isObject = typeof data === 'object' && data !== null;
        const hasSettings = data.hasOwnProperty('settings') || Object.keys(data).length > 0;

        if (isObject && hasSettings) {
          const settingsCount = data.settings
            ? Object.keys(data.settings).length
            : Object.keys(data).length;
          return pass(
            'Public Settings',
            `Retrieved ${settingsCount} public settings`,
            Date.now() - start
          );
        } else {
          return warn(
            'Public Settings',
            'Public settings endpoint returned 200 but no settings found',
            Date.now() - start
          );
        }
      } else {
        return fail(
          'Public Settings',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Public Settings', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testRequiredSettings(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/settings/public');

      if (response.status === 200) {
        const settings = response.data.settings || response.data;
        const requiredSettings = [
          'site_name',
          'default_currency',
          'commission_rate',
          'escrow_default_hold_days',
          'tax_calculation_mode',
          'shipping_mode',
        ];

        const foundSettings = requiredSettings.filter((key) => settings.hasOwnProperty(key));
        const missingSettings = requiredSettings.filter((key) => !settings.hasOwnProperty(key));

        if (foundSettings.length === requiredSettings.length) {
          return pass(
            'Required Settings',
            `All ${requiredSettings.length} required settings found`,
            Date.now() - start
          );
        } else if (foundSettings.length > 0) {
          return warn(
            'Required Settings',
            `Found ${foundSettings.length}/${requiredSettings.length} required settings. Missing: ${missingSettings.join(', ')}`,
            Date.now() - start
          );
        } else {
          return fail(
            'Required Settings',
            'None of the required settings found',
            { missingSettings },
            Date.now() - start
          );
        }
      } else {
        return fail(
          'Required Settings',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Required Settings', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testCurrencyRates(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/currency/rates');

      if (response.status === 200) {
        const data = response.data;
        const hasRates =
          data.hasOwnProperty('rates') ||
          data.hasOwnProperty('currencies') ||
          (typeof data === 'object' && Object.keys(data).length > 0);

        if (hasRates) {
          const ratesCount = data.rates
            ? Object.keys(data.rates).length
            : data.currencies
              ? Object.keys(data.currencies).length
              : Object.keys(data).length;
          return pass(
            'Currency Rates',
            `Retrieved ${ratesCount} currency rates`,
            Date.now() - start
          );
        } else {
          return warn(
            'Currency Rates',
            'Currency rates endpoint returned 200 but no rates found',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn('Currency Rates', 'Endpoint not found (404)', Date.now() - start);
      } else {
        return fail(
          'Currency Rates',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Currency Rates', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testCurrencyConversion(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/currency/convert?amount=100&from=USD&to=EUR');

      if (response.status === 200) {
        const data = response.data;
        const hasConversion =
          data.hasOwnProperty('convertedAmount') ||
          data.hasOwnProperty('amount') ||
          data.hasOwnProperty('result');

        if (hasConversion) {
          return pass(
            'Currency Conversion',
            `Conversion successful: ${JSON.stringify(data)}`,
            Date.now() - start
          );
        } else {
          return warn(
            'Currency Conversion',
            'Conversion endpoint returned 200 but unexpected structure',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn('Currency Conversion', 'Endpoint not found (404)', Date.now() - start);
      } else if (response.status === 400) {
        return warn(
          'Currency Conversion',
          'Bad request (400) - May need valid currency codes',
          Date.now() - start
        );
      } else {
        return fail(
          'Currency Conversion',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Currency Conversion', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testTaxSettings(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/settings/public');

      if (response.status === 200) {
        const settings = response.data.settings || response.data;
        const taxSettings = ['tax_calculation_mode', 'tax_default_rate', 'tax_enabled'];

        const foundSettings = taxSettings.filter((key) => settings.hasOwnProperty(key));

        if (foundSettings.length > 0) {
          return pass(
            'Tax Settings',
            `Found ${foundSettings.length}/${taxSettings.length} tax settings: ${foundSettings.join(', ')}`,
            Date.now() - start
          );
        } else {
          return warn(
            'Tax Settings',
            'Tax settings not found in public settings',
            Date.now() - start
          );
        }
      } else {
        return fail(
          'Tax Settings',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Tax Settings', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testPaymentSettings(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/settings/public');

      if (response.status === 200) {
        const settings = response.data.settings || response.data;
        const paymentSettings = [
          'stripe_publishable_key',
          'payment_gateway',
          'paypal_enabled',
          'stripe_enabled',
        ];

        const foundSettings = paymentSettings.filter((key) => settings.hasOwnProperty(key));

        if (foundSettings.length > 0) {
          return pass(
            'Payment Settings',
            `Found ${foundSettings.length}/${paymentSettings.length} payment settings: ${foundSettings.join(', ')}`,
            Date.now() - start
          );
        } else {
          return warn(
            'Payment Settings',
            'Payment settings not found in public settings',
            Date.now() - start
          );
        }
      } else {
        return fail(
          'Payment Settings',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Payment Settings', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testEscrowSettings(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/settings/public');

      if (response.status === 200) {
        const settings = response.data.settings || response.data;
        const escrowSettings = [
          'escrow_default_hold_days',
          'escrow_enabled',
          'escrow_auto_release',
        ];

        const foundSettings = escrowSettings.filter((key) => settings.hasOwnProperty(key));

        if (foundSettings.length > 0) {
          return pass(
            'Escrow Settings',
            `Found ${foundSettings.length}/${escrowSettings.length} escrow settings: ${foundSettings.join(', ')}`,
            Date.now() - start
          );
        } else {
          return warn(
            'Escrow Settings',
            'Escrow settings not found in public settings',
            Date.now() - start
          );
        }
      } else {
        return fail(
          'Escrow Settings',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Escrow Settings', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testCommissionSettings(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/settings/public');

      if (response.status === 200) {
        const settings = response.data.settings || response.data;
        const commissionSettings = ['commission_rate', 'commission_type', 'commission_enabled'];

        const foundSettings = commissionSettings.filter((key) => settings.hasOwnProperty(key));

        if (foundSettings.length > 0) {
          return pass(
            'Commission Settings',
            `Found ${foundSettings.length}/${commissionSettings.length} commission settings: ${foundSettings.join(', ')}`,
            Date.now() - start
          );
        } else {
          return warn(
            'Commission Settings',
            'Commission settings not found in public settings',
            Date.now() - start
          );
        }
      } else {
        return fail(
          'Commission Settings',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Commission Settings', 'Request failed', error.message, Date.now() - start);
    }
  }
}
