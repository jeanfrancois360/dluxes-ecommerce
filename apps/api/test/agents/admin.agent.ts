import axios, { AxiosInstance } from 'axios';
import { TestResult, pass, fail, warn, skip } from './auth.agent';

const API_URL = 'http://localhost:4000/api/v1';

interface Tokens {
  buyerToken?: string;
  sellerToken?: string;
  adminToken?: string;
}

export class AdminAgent {
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
    results.push(await this.testAdminDashboardStats());
    results.push(await this.testAdminDashboardRevenue());
    results.push(await this.testAdminDashboardOrdersByStatus());
    results.push(await this.testAdminDashboardTopProducts());
    results.push(await this.testAdminDashboardCustomerGrowth());
    results.push(await this.testAdminDashboardRecentOrders());
    results.push(await this.testAdminOrders());
    results.push(await this.testAdminUsers());
    results.push(await this.testAdminPayoutStats());
    results.push(await this.testAdminSubscriptionPlans());
    results.push(await this.testAdminReferralStats());
    results.push(await this.testAdminDashboardUnauth());
    results.push(await this.testAdminDashboardWithSellerToken());

    return results;
  }

  async testAdminDashboardStats(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.adminToken) {
      return skip('Admin Dashboard Stats', 'No admin token available');
    }

    try {
      const response = await this.client.get('/admin/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${this.tokens.adminToken}`,
        },
      });

      if (response.status === 200) {
        const data = response.data;
        const hasRequiredFields =
          data.hasOwnProperty('totalRevenue') ||
          data.hasOwnProperty('totalOrders') ||
          data.hasOwnProperty('totalUsers') ||
          data.hasOwnProperty('totalProducts');

        if (hasRequiredFields) {
          return pass('Admin Dashboard Stats', `Stats retrieved successfully`, Date.now() - start);
        } else {
          return warn(
            'Admin Dashboard Stats',
            'Stats endpoint returned 200 but missing expected fields',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn('Admin Dashboard Stats', 'Endpoint not found (404)', Date.now() - start);
      } else {
        return fail(
          'Admin Dashboard Stats',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Admin Dashboard Stats', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testAdminDashboardRevenue(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.adminToken) {
      return skip('Admin Dashboard Revenue', 'No admin token available');
    }

    try {
      const response = await this.client.get('/admin/dashboard/revenue?days=30', {
        headers: {
          Authorization: `Bearer ${this.tokens.adminToken}`,
        },
      });

      if (response.status === 200) {
        if (Array.isArray(response.data) || response.data.hasOwnProperty('revenue')) {
          return pass(
            'Admin Dashboard Revenue',
            'Revenue data retrieved successfully',
            Date.now() - start
          );
        } else {
          return warn(
            'Admin Dashboard Revenue',
            'Revenue endpoint returned 200 but unexpected structure',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn('Admin Dashboard Revenue', 'Endpoint not found (404)', Date.now() - start);
      } else {
        return fail(
          'Admin Dashboard Revenue',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Admin Dashboard Revenue', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testAdminDashboardOrdersByStatus(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.adminToken) {
      return skip('Admin Dashboard Orders By Status', 'No admin token available');
    }

    try {
      const response = await this.client.get('/admin/dashboard/orders-by-status', {
        headers: {
          Authorization: `Bearer ${this.tokens.adminToken}`,
        },
      });

      if (response.status === 200) {
        if (Array.isArray(response.data) || typeof response.data === 'object') {
          return pass(
            'Admin Dashboard Orders By Status',
            'Orders by status retrieved successfully',
            Date.now() - start
          );
        } else {
          return warn(
            'Admin Dashboard Orders By Status',
            'Orders by status endpoint returned 200 but unexpected structure',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn(
          'Admin Dashboard Orders By Status',
          'Endpoint not found (404)',
          Date.now() - start
        );
      } else {
        return fail(
          'Admin Dashboard Orders By Status',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail(
        'Admin Dashboard Orders By Status',
        'Request failed',
        error.message,
        Date.now() - start
      );
    }
  }

  async testAdminDashboardTopProducts(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.adminToken) {
      return skip('Admin Dashboard Top Products', 'No admin token available');
    }

    try {
      const response = await this.client.get('/admin/dashboard/top-products?limit=5', {
        headers: {
          Authorization: `Bearer ${this.tokens.adminToken}`,
        },
      });

      if (response.status === 200) {
        if (Array.isArray(response.data)) {
          return pass(
            'Admin Dashboard Top Products',
            `Retrieved ${response.data.length} top products`,
            Date.now() - start
          );
        } else {
          return warn(
            'Admin Dashboard Top Products',
            'Top products endpoint returned 200 but not an array',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn('Admin Dashboard Top Products', 'Endpoint not found (404)', Date.now() - start);
      } else {
        return fail(
          'Admin Dashboard Top Products',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail(
        'Admin Dashboard Top Products',
        'Request failed',
        error.message,
        Date.now() - start
      );
    }
  }

  async testAdminDashboardCustomerGrowth(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.adminToken) {
      return skip('Admin Dashboard Customer Growth', 'No admin token available');
    }

    try {
      const response = await this.client.get('/admin/dashboard/customer-growth?days=30', {
        headers: {
          Authorization: `Bearer ${this.tokens.adminToken}`,
        },
      });

      if (response.status === 200) {
        if (Array.isArray(response.data) || response.data.hasOwnProperty('growth')) {
          return pass(
            'Admin Dashboard Customer Growth',
            'Customer growth data retrieved successfully',
            Date.now() - start
          );
        } else {
          return warn(
            'Admin Dashboard Customer Growth',
            'Customer growth endpoint returned 200 but unexpected structure',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn(
          'Admin Dashboard Customer Growth',
          'Endpoint not found (404)',
          Date.now() - start
        );
      } else {
        return fail(
          'Admin Dashboard Customer Growth',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail(
        'Admin Dashboard Customer Growth',
        'Request failed',
        error.message,
        Date.now() - start
      );
    }
  }

  async testAdminDashboardRecentOrders(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.adminToken) {
      return skip('Admin Dashboard Recent Orders', 'No admin token available');
    }

    try {
      const response = await this.client.get('/admin/dashboard/recent-orders?limit=10', {
        headers: {
          Authorization: `Bearer ${this.tokens.adminToken}`,
        },
      });

      if (response.status === 200) {
        if (Array.isArray(response.data)) {
          return pass(
            'Admin Dashboard Recent Orders',
            `Retrieved ${response.data.length} recent orders`,
            Date.now() - start
          );
        } else {
          return warn(
            'Admin Dashboard Recent Orders',
            'Recent orders endpoint returned 200 but not an array',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn(
          'Admin Dashboard Recent Orders',
          'Endpoint not found (404)',
          Date.now() - start
        );
      } else {
        return fail(
          'Admin Dashboard Recent Orders',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail(
        'Admin Dashboard Recent Orders',
        'Request failed',
        error.message,
        Date.now() - start
      );
    }
  }

  async testAdminOrders(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.adminToken) {
      return skip('Admin Orders', 'No admin token available');
    }

    try {
      const response = await this.client.get('/admin/orders', {
        headers: {
          Authorization: `Bearer ${this.tokens.adminToken}`,
        },
      });

      if (response.status === 200) {
        if (Array.isArray(response.data) || Array.isArray(response.data.orders)) {
          const orders = Array.isArray(response.data) ? response.data : response.data.orders;
          return pass('Admin Orders', `Retrieved ${orders.length} orders`, Date.now() - start);
        } else if (response.data.hasOwnProperty('data') && Array.isArray(response.data.data)) {
          return pass(
            'Admin Orders',
            `Retrieved ${response.data.data.length} orders (paginated)`,
            Date.now() - start
          );
        } else {
          return warn(
            'Admin Orders',
            'Orders endpoint returned 200 but unexpected structure',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn('Admin Orders', 'Endpoint not found (404)', Date.now() - start);
      } else {
        return fail(
          'Admin Orders',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Admin Orders', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testAdminUsers(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.adminToken) {
      return skip('Admin Users', 'No admin token available');
    }

    try {
      const response = await this.client.get('/admin/users', {
        headers: {
          Authorization: `Bearer ${this.tokens.adminToken}`,
        },
      });

      if (response.status === 200) {
        if (Array.isArray(response.data) || Array.isArray(response.data.users)) {
          const users = Array.isArray(response.data) ? response.data : response.data.users;
          return pass('Admin Users', `Retrieved ${users.length} users`, Date.now() - start);
        } else if (response.data.hasOwnProperty('data') && Array.isArray(response.data.data)) {
          return pass(
            'Admin Users',
            `Retrieved ${response.data.data.length} users (paginated)`,
            Date.now() - start
          );
        } else {
          return warn(
            'Admin Users',
            'Users endpoint returned 200 but unexpected structure',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn('Admin Users', 'Endpoint not found (404)', Date.now() - start);
      } else {
        return fail(
          'Admin Users',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Admin Users', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testAdminPayoutStats(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.adminToken) {
      return skip('Admin Payout Stats', 'No admin token available');
    }

    try {
      const response = await this.client.get('/payout/admin/stats', {
        headers: {
          Authorization: `Bearer ${this.tokens.adminToken}`,
        },
      });

      if (response.status === 200) {
        const data = response.data;
        if (typeof data === 'object') {
          return pass(
            'Admin Payout Stats',
            'Payout stats retrieved successfully',
            Date.now() - start
          );
        } else {
          return warn(
            'Admin Payout Stats',
            'Payout stats endpoint returned 200 but unexpected structure',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn('Admin Payout Stats', 'Endpoint not found (404)', Date.now() - start);
      } else {
        return fail(
          'Admin Payout Stats',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Admin Payout Stats', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testAdminSubscriptionPlans(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.adminToken) {
      return skip('Admin Subscription Plans', 'No admin token available');
    }

    try {
      const response = await this.client.get('/subscription/plans', {
        headers: {
          Authorization: `Bearer ${this.tokens.adminToken}`,
        },
      });

      if (response.status === 200) {
        if (Array.isArray(response.data) || Array.isArray(response.data.plans)) {
          const plans = Array.isArray(response.data) ? response.data : response.data.plans;
          return pass(
            'Admin Subscription Plans',
            `Retrieved ${plans.length} subscription plans`,
            Date.now() - start
          );
        } else {
          return warn(
            'Admin Subscription Plans',
            'Subscription plans endpoint returned 200 but unexpected structure',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn('Admin Subscription Plans', 'Endpoint not found (404)', Date.now() - start);
      } else {
        return fail(
          'Admin Subscription Plans',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Admin Subscription Plans', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testAdminReferralStats(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.adminToken) {
      return skip('Admin Referral Stats', 'No admin token available');
    }

    try {
      const response = await this.client.get('/referral/admin/stats', {
        headers: {
          Authorization: `Bearer ${this.tokens.adminToken}`,
        },
      });

      if (response.status === 200) {
        const data = response.data;
        if (typeof data === 'object') {
          return pass(
            'Admin Referral Stats',
            'Referral stats retrieved successfully',
            Date.now() - start
          );
        } else {
          return warn(
            'Admin Referral Stats',
            'Referral stats endpoint returned 200 but unexpected structure',
            Date.now() - start
          );
        }
      } else if (response.status === 404) {
        return warn('Admin Referral Stats', 'Endpoint not found (404)', Date.now() - start);
      } else {
        return fail(
          'Admin Referral Stats',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Admin Referral Stats', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testAdminDashboardUnauth(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/admin/dashboard/stats');

      if (response.status === 401 || response.status === 403) {
        return pass(
          'Admin Dashboard (Unauth)',
          'Correctly rejected unauthorized request',
          Date.now() - start
        );
      } else {
        return fail(
          'Admin Dashboard (Unauth)',
          `Expected 401, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Admin Dashboard (Unauth)', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testAdminDashboardWithSellerToken(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.sellerToken) {
      return skip('Admin Dashboard (Seller Token)', 'No seller token available');
    }

    try {
      const response = await this.client.get('/admin/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${this.tokens.sellerToken}`,
        },
      });

      if (response.status === 403) {
        return pass(
          'Admin Dashboard (Seller Token)',
          'Correctly rejected seller access to admin endpoint',
          Date.now() - start
        );
      } else if (response.status === 200) {
        return warn(
          'Admin Dashboard (Seller Token)',
          'Seller was able to access admin endpoint (potential issue)',
          Date.now() - start
        );
      } else {
        return warn(
          'Admin Dashboard (Seller Token)',
          `Got ${response.status} (expected 403)`,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail(
        'Admin Dashboard (Seller Token)',
        'Request failed',
        error.message,
        Date.now() - start
      );
    }
  }
}
