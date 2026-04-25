import axios, { AxiosInstance } from 'axios';
import { TestResult, pass, fail, warn, skip } from './auth.agent';

const API_URL = 'http://localhost:4000/api/v1';

interface Tokens {
  buyerToken?: string;
  sellerToken?: string;
  adminToken?: string;
}

export class ShippingAgent {
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
    results.push(await this.testEasyPostHealth());
    results.push(await this.testEasyPostTest());
    results.push(await this.testSendCloudHealth());
    results.push(await this.testEasyShipHealth());
    results.push(await this.testDHLHealth());
    results.push(await this.testShippingSettings());
    results.push(await this.testOriginAddressSettings());
    results.push(await this.testEasyPostSettings());

    return results;
  }

  async testEasyPostHealth(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/easypost/health');

      if (response.status === 200) {
        const data = response.data;
        const hasHealthInfo =
          data.hasOwnProperty('status') ||
          data.hasOwnProperty('healthy') ||
          data.hasOwnProperty('enabled') ||
          data.hasOwnProperty('configured');

        if (hasHealthInfo) {
          return pass(
            'EasyPost Health',
            `Health status: ${JSON.stringify(data)}`,
            Date.now() - start
          );
        } else {
          return warn(
            'EasyPost Health',
            'Health endpoint returned 200 but missing expected fields',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn('EasyPost Health', 'Endpoint not found (404)', Date.now() - start);
      } else if (response.status === 503) {
        return warn('EasyPost Health', 'Service unavailable (503)', Date.now() - start);
      } else {
        return fail(
          'EasyPost Health',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('EasyPost Health', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testEasyPostTest(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/easypost/test');

      if (response.status === 200) {
        const data = response.data;
        if (data.hasOwnProperty('success') || data.hasOwnProperty('status')) {
          return pass(
            'EasyPost Test Connection',
            `Test result: ${JSON.stringify(data)}`,
            Date.now() - start
          );
        } else {
          return warn(
            'EasyPost Test Connection',
            'Test endpoint returned 200 but unexpected structure',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn('EasyPost Test Connection', 'Endpoint not found (404)', Date.now() - start);
      } else if (response.status === 500 || response.status === 503) {
        return warn(
          'EasyPost Test Connection',
          `EasyPost API connection failed (${response.status})`,
          Date.now() - start
        );
      } else {
        return fail(
          'EasyPost Test Connection',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('EasyPost Test Connection', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testSendCloudHealth(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/sendcloud/health');

      if (response.status === 200) {
        const data = response.data;
        const hasHealthInfo =
          data.hasOwnProperty('status') ||
          data.hasOwnProperty('healthy') ||
          data.hasOwnProperty('enabled') ||
          data.hasOwnProperty('configured');

        if (hasHealthInfo) {
          return pass(
            'SendCloud Health',
            `Health status: ${JSON.stringify(data)}`,
            Date.now() - start
          );
        } else {
          return warn(
            'SendCloud Health',
            'Health endpoint returned 200 but missing expected fields',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn(
          'SendCloud Health',
          'Endpoint not found (404) - Integration may not be enabled',
          Date.now() - start
        );
      } else if (response.status === 503) {
        return warn('SendCloud Health', 'Service unavailable (503)', Date.now() - start);
      } else {
        return fail(
          'SendCloud Health',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('SendCloud Health', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testEasyShipHealth(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/easyship/health');

      if (response.status === 200) {
        const data = response.data;
        const hasHealthInfo =
          data.hasOwnProperty('status') ||
          data.hasOwnProperty('healthy') ||
          data.hasOwnProperty('enabled') ||
          data.hasOwnProperty('configured');

        if (hasHealthInfo) {
          return pass(
            'EasyShip Health',
            `Health status: ${JSON.stringify(data)}`,
            Date.now() - start
          );
        } else {
          return warn(
            'EasyShip Health',
            'Health endpoint returned 200 but missing expected fields',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn(
          'EasyShip Health',
          'Endpoint not found (404) - Integration may not be enabled',
          Date.now() - start
        );
      } else if (response.status === 503) {
        return warn('EasyShip Health', 'Service unavailable (503)', Date.now() - start);
      } else {
        return fail(
          'EasyShip Health',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('EasyShip Health', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testDHLHealth(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/dhl/health');

      if (response.status === 200) {
        const data = response.data;
        const hasHealthInfo =
          data.hasOwnProperty('status') ||
          data.hasOwnProperty('healthy') ||
          data.hasOwnProperty('enabled') ||
          data.hasOwnProperty('configured');

        if (hasHealthInfo) {
          return pass('DHL Health', `Health status: ${JSON.stringify(data)}`, Date.now() - start);
        } else {
          return warn(
            'DHL Health',
            'Health endpoint returned 200 but missing expected fields',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn(
          'DHL Health',
          'Endpoint not found (404) - Integration may not be enabled',
          Date.now() - start
        );
      } else if (response.status === 503) {
        return warn('DHL Health', 'Service unavailable (503)', Date.now() - start);
      } else {
        return fail(
          'DHL Health',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('DHL Health', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testShippingSettings(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/settings/public');

      if (response.status === 200) {
        const settings = response.data;
        const shippingSettings = [
          'shipping_mode',
          'shipping_standard_rate',
          'shipping_express_rate',
          'shipping_overnight_rate',
          'shipping_international_surcharge',
        ];

        const foundSettings = shippingSettings.filter(
          (key) =>
            settings.hasOwnProperty(key) ||
            (settings.settings && settings.settings.hasOwnProperty(key))
        );

        if (foundSettings.length > 0) {
          return pass(
            'Shipping Settings',
            `Found ${foundSettings.length}/${shippingSettings.length} shipping settings: ${foundSettings.join(', ')}`,
            Date.now() - start
          );
        } else {
          return warn(
            'Shipping Settings',
            'Shipping settings not found in public settings',
            Date.now() - start
          );
        }
      } else {
        return fail(
          'Shipping Settings',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Shipping Settings', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testOriginAddressSettings(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/settings/public');

      if (response.status === 200) {
        const settings = response.data;
        const originSettings = [
          'origin_street1',
          'origin_city',
          'origin_state',
          'origin_postal_code',
          'origin_country',
          'origin_company_name',
        ];

        const foundSettings = originSettings.filter(
          (key) =>
            settings.hasOwnProperty(key) ||
            (settings.settings && settings.settings.hasOwnProperty(key))
        );

        if (foundSettings.length >= 4) {
          return pass(
            'Origin Address Settings',
            `Found ${foundSettings.length}/${originSettings.length} origin address settings`,
            Date.now() - start
          );
        } else if (foundSettings.length > 0) {
          return warn(
            'Origin Address Settings',
            `Found ${foundSettings.length}/${originSettings.length} origin address settings (some missing)`,
            Date.now() - start
          );
        } else {
          return warn(
            'Origin Address Settings',
            'Origin address settings not found in public settings',
            Date.now() - start
          );
        }
      } else {
        return fail(
          'Origin Address Settings',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Origin Address Settings', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testEasyPostSettings(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/settings/public');

      if (response.status === 200) {
        const settings = response.data;
        const easypostSettings = [
          'easypost_enabled',
          'easypost_test_mode',
          'easypost_default_label_format',
          'easypost_address_verification',
          'easypost_default_carriers',
        ];

        const foundSettings = easypostSettings.filter(
          (key) =>
            settings.hasOwnProperty(key) ||
            (settings.settings && settings.settings.hasOwnProperty(key))
        );

        if (foundSettings.length > 0) {
          return pass(
            'EasyPost Settings',
            `Found ${foundSettings.length}/${easypostSettings.length} EasyPost settings: ${foundSettings.join(', ')}`,
            Date.now() - start
          );
        } else {
          return warn(
            'EasyPost Settings',
            'EasyPost settings not found in public settings',
            Date.now() - start
          );
        }
      } else {
        return fail(
          'EasyPost Settings',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('EasyPost Settings', 'Request failed', error.message, Date.now() - start);
    }
  }
}
