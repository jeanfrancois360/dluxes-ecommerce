import axios, { AxiosInstance } from 'axios';
import { TestResult, pass, fail, warn, skip } from './auth.agent';

const API_URL = 'http://localhost:4000/api/v1';

interface Tokens {
  buyerToken?: string;
  sellerToken?: string;
  adminToken?: string;
}

export class SellerAgent {
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
    results.push(await this.testSellerDashboard());
    results.push(await this.testSellerProducts());
    results.push(await this.testSellerOrders());
    results.push(await this.testSellerCreditSummary());
    results.push(await this.testSellerPayoutHistory());
    results.push(await this.testSellerDashboardUnauth());
    results.push(await this.testSellerProductsWithBuyerToken());

    return results;
  }

  async testSellerDashboard(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.sellerToken) {
      return skip('Seller Dashboard', 'No seller token available');
    }

    try {
      const response = await this.client.get('/seller/dashboard', {
        headers: {
          Authorization: `Bearer ${this.tokens.sellerToken}`,
        },
      });

      if (response.status === 200) {
        const data = response.data;
        const hasRequiredFields =
          data.hasOwnProperty('totalRevenue') ||
          data.hasOwnProperty('totalOrders') ||
          data.hasOwnProperty('totalProducts') ||
          data.hasOwnProperty('pendingOrders');

        if (hasRequiredFields) {
          return pass(
            'Seller Dashboard',
            `Dashboard data retrieved: ${JSON.stringify(Object.keys(data))}`,
            Date.now() - start
          );
        } else {
          return warn(
            'Seller Dashboard',
            'Dashboard returned 200 but missing expected fields',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn('Seller Dashboard', 'Endpoint not found (404)', Date.now() - start);
      } else {
        return fail(
          'Seller Dashboard',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Seller Dashboard', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testSellerProducts(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.sellerToken) {
      return skip('Seller Products', 'No seller token available');
    }

    try {
      const response = await this.client.get('/seller/products', {
        headers: {
          Authorization: `Bearer ${this.tokens.sellerToken}`,
        },
      });

      if (response.status === 200) {
        if (Array.isArray(response.data) || Array.isArray(response.data.products)) {
          const products = Array.isArray(response.data) ? response.data : response.data.products;
          return pass(
            'Seller Products',
            `Retrieved ${products.length} products`,
            Date.now() - start
          );
        } else if (response.data.hasOwnProperty('data') && Array.isArray(response.data.data)) {
          return pass(
            'Seller Products',
            `Retrieved ${response.data.data.length} products (paginated)`,
            Date.now() - start
          );
        } else {
          return warn(
            'Seller Products',
            'Products endpoint returned 200 but unexpected structure',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn('Seller Products', 'Endpoint not found (404)', Date.now() - start);
      } else {
        return fail(
          'Seller Products',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Seller Products', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testSellerOrders(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.sellerToken) {
      return skip('Seller Orders', 'No seller token available');
    }

    try {
      const response = await this.client.get('/seller/orders', {
        headers: {
          Authorization: `Bearer ${this.tokens.sellerToken}`,
        },
      });

      if (response.status === 200) {
        if (Array.isArray(response.data) || Array.isArray(response.data.orders)) {
          const orders = Array.isArray(response.data) ? response.data : response.data.orders;
          return pass('Seller Orders', `Retrieved ${orders.length} orders`, Date.now() - start);
        } else if (response.data.hasOwnProperty('data') && Array.isArray(response.data.data)) {
          return pass(
            'Seller Orders',
            `Retrieved ${response.data.data.length} orders (paginated)`,
            Date.now() - start
          );
        } else {
          return warn(
            'Seller Orders',
            'Orders endpoint returned 200 but unexpected structure',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn('Seller Orders', 'Endpoint not found (404)', Date.now() - start);
      } else {
        return fail(
          'Seller Orders',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Seller Orders', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testSellerCreditSummary(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.sellerToken) {
      return skip('Seller Credit Summary', 'No seller token available');
    }

    try {
      const response = await this.client.get('/subscription/seller/credit-summary', {
        headers: {
          Authorization: `Bearer ${this.tokens.sellerToken}`,
        },
      });

      if (response.status === 200) {
        const data = response.data;
        const hasRequiredFields =
          data.hasOwnProperty('credits') ||
          data.hasOwnProperty('totalCredits') ||
          data.hasOwnProperty('usedCredits') ||
          data.hasOwnProperty('remainingCredits');

        if (hasRequiredFields) {
          return pass('Seller Credit Summary', `Credit summary retrieved`, Date.now() - start);
        } else {
          return warn(
            'Seller Credit Summary',
            'Credit summary returned 200 but missing expected fields',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn('Seller Credit Summary', 'Endpoint not found (404)', Date.now() - start);
      } else {
        return fail(
          'Seller Credit Summary',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Seller Credit Summary', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testSellerPayoutHistory(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.sellerToken) {
      return skip('Seller Payout History', 'No seller token available');
    }

    try {
      const response = await this.client.get('/payout/seller/history', {
        headers: {
          Authorization: `Bearer ${this.tokens.sellerToken}`,
        },
      });

      if (response.status === 200) {
        if (Array.isArray(response.data) || Array.isArray(response.data.payouts)) {
          const payouts = Array.isArray(response.data) ? response.data : response.data.payouts;
          return pass(
            'Seller Payout History',
            `Retrieved ${payouts.length} payout records`,
            Date.now() - start
          );
        } else if (response.data.hasOwnProperty('data') && Array.isArray(response.data.data)) {
          return pass(
            'Seller Payout History',
            `Retrieved ${response.data.data.length} payout records (paginated)`,
            Date.now() - start
          );
        } else {
          return warn(
            'Seller Payout History',
            'Payout history returned 200 but unexpected structure',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn('Seller Payout History', 'Endpoint not found (404)', Date.now() - start);
      } else {
        return fail(
          'Seller Payout History',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Seller Payout History', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testSellerDashboardUnauth(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/seller/dashboard');

      if (response.status === 401 || response.status === 403) {
        return pass(
          'Seller Dashboard (Unauth)',
          'Correctly rejected unauthorized request',
          Date.now() - start
        );
      } else {
        return fail(
          'Seller Dashboard (Unauth)',
          `Expected 401, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Seller Dashboard (Unauth)', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testSellerProductsWithBuyerToken(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.buyerToken) {
      return skip('Seller Products (Buyer Token)', 'No buyer token available');
    }

    try {
      const response = await this.client.get('/seller/products', {
        headers: {
          Authorization: `Bearer ${this.tokens.buyerToken}`,
        },
      });

      if (response.status === 403) {
        return pass(
          'Seller Products (Buyer Token)',
          'Correctly rejected buyer access to seller endpoint',
          Date.now() - start
        );
      } else if (response.status === 200) {
        return warn(
          'Seller Products (Buyer Token)',
          'Buyer was able to access seller endpoint (potential issue)',
          Date.now() - start
        );
      } else {
        return warn(
          'Seller Products (Buyer Token)',
          `Got ${response.status} (expected 403)`,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail(
        'Seller Products (Buyer Token)',
        'Request failed',
        error.message,
        Date.now() - start
      );
    }
  }
}
