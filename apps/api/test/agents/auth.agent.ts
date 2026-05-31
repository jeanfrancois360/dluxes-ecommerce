import axios, { AxiosInstance } from 'axios';

const API_URL = 'http://localhost:4000/api/v1';

export interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  message?: string;
  duration?: number;
  error?: any;
}

export function pass(test: string, message?: string, duration?: number): TestResult {
  return { test, status: 'pass', message, duration };
}

export function fail(test: string, message: string, error?: any, duration?: number): TestResult {
  return { test, status: 'fail', message, error, duration };
}

export function warn(test: string, message: string, duration?: number): TestResult {
  return { test, status: 'warn', message, duration };
}

export function skip(test: string, message: string): TestResult {
  return { test, status: 'skip', message };
}

interface Tokens {
  buyerToken?: string;
  sellerToken?: string;
  adminToken?: string;
}

export class AuthAgent {
  private client: AxiosInstance;
  private tokens: Tokens;
  private testBuyer = {
    email: `buyer_${Date.now()}@test.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Buyer',
  };
  private testSeller = {
    email: `seller_${Date.now()}@test.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Seller',
  };

  constructor(tokens: Tokens = {}) {
    this.client = axios.create({
      baseURL: API_URL,
      validateStatus: () => true, // Don't throw on any status
    });
    this.tokens = tokens;
  }

  async runAll(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Run tests in sequence (order matters for auth flow)
    results.push(await this.testRegisterBuyer());
    results.push(await this.testRegisterSeller());
    results.push(await this.testDuplicateEmail());
    results.push(await this.testLoginBuyer());
    results.push(await this.testLoginSeller());
    results.push(await this.testInvalidLogin());
    results.push(await this.testGetCurrentUser());
    results.push(await this.testGetCurrentUserUnauth());
    results.push(await this.testMagicLinkRequest());
    results.push(await this.testPasswordResetRequest());
    results.push(await this.testInvalidPasswordReset());
    results.push(await this.testValidationErrors());

    return results;
  }

  async testRegisterBuyer(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.post('/auth/register', {
        ...this.testBuyer,
        role: 'BUYER',
      });

      if (response.status === 201 || response.status === 200) {
        if (response.data.accessToken) {
          this.tokens.buyerToken = response.data.accessToken;
          return pass(
            'Register Buyer',
            `Buyer registered successfully with email: ${this.testBuyer.email}`,
            Date.now() - start
          );
        } else {
          return warn(
            'Register Buyer',
            'Registration succeeded but no accessToken in response',
            Date.now() - start
          );
        }
      } else {
        return fail(
          'Register Buyer',
          `Expected 201, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Register Buyer', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testRegisterSeller(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.post('/auth/register', {
        ...this.testSeller,
        role: 'SELLER',
      });

      if (response.status === 201 || response.status === 200) {
        if (response.data.accessToken) {
          this.tokens.sellerToken = response.data.accessToken;
          return pass(
            'Register Seller',
            `Seller registered successfully with email: ${this.testSeller.email}`,
            Date.now() - start
          );
        } else {
          return warn(
            'Register Seller',
            'Registration succeeded but no accessToken in response',
            Date.now() - start
          );
        }
      } else {
        return fail(
          'Register Seller',
          `Expected 201, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Register Seller', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testDuplicateEmail(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.post('/auth/register', {
        ...this.testBuyer,
        role: 'BUYER',
      });

      if (response.status === 400 || response.status === 409) {
        return pass(
          'Duplicate Email Validation',
          'Server correctly rejected duplicate email',
          Date.now() - start
        );
      } else {
        return fail(
          'Duplicate Email Validation',
          `Expected 400 or 409, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail(
        'Duplicate Email Validation',
        'Request failed',
        error.message,
        Date.now() - start
      );
    }
  }

  async testLoginBuyer(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.post('/auth/login', {
        email: this.testBuyer.email,
        password: this.testBuyer.password,
      });

      if (response.status === 200 || response.status === 201) {
        if (response.data.accessToken) {
          this.tokens.buyerToken = response.data.accessToken;
          return pass('Login Buyer', 'Buyer logged in successfully', Date.now() - start);
        } else {
          return warn('Login Buyer', 'Login succeeded but no accessToken', Date.now() - start);
        }
      } else {
        return fail(
          'Login Buyer',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Login Buyer', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testLoginSeller(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.post('/auth/login', {
        email: this.testSeller.email,
        password: this.testSeller.password,
      });

      if (response.status === 200 || response.status === 201) {
        if (response.data.accessToken) {
          this.tokens.sellerToken = response.data.accessToken;
          return pass('Login Seller', 'Seller logged in successfully', Date.now() - start);
        } else {
          return warn('Login Seller', 'Login succeeded but no accessToken', Date.now() - start);
        }
      } else {
        return fail(
          'Login Seller',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Login Seller', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testInvalidLogin(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.post('/auth/login', {
        email: this.testBuyer.email,
        password: 'WrongPassword123!',
      });

      if (response.status === 401 || response.status === 400) {
        return pass(
          'Invalid Login',
          'Server correctly rejected invalid credentials',
          Date.now() - start
        );
      } else {
        return fail(
          'Invalid Login',
          `Expected 401, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Invalid Login', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testGetCurrentUser(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.buyerToken) {
      return skip('Get Current User', 'No buyer token available');
    }

    try {
      const response = await this.client.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${this.tokens.buyerToken}`,
        },
      });

      if (response.status === 200) {
        if (response.data.email === this.testBuyer.email) {
          return pass('Get Current User', 'User data retrieved successfully', Date.now() - start);
        } else {
          return warn('Get Current User', 'User data mismatch', Date.now() - start);
        }
      } else {
        return fail(
          'Get Current User',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Get Current User', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testGetCurrentUserUnauth(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/auth/me');

      if (response.status === 401) {
        return pass(
          'Get Current User (Unauth)',
          'Correctly rejected unauthorized request',
          Date.now() - start
        );
      } else {
        return fail(
          'Get Current User (Unauth)',
          `Expected 401, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Get Current User (Unauth)', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testMagicLinkRequest(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.post('/auth/magic-link/request', {
        email: this.testBuyer.email,
      });

      if (response.status === 200 || response.status === 201) {
        return pass('Magic Link Request', 'Magic link requested successfully', Date.now() - start);
      } else if (response.status === 429) {
        return warn('Magic Link Request', 'Rate limited (expected behavior)', Date.now() - start);
      } else {
        return fail(
          'Magic Link Request',
          `Expected 200 or 201, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Magic Link Request', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testPasswordResetRequest(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.post('/auth/password/reset-request', {
        email: this.testBuyer.email,
      });

      if (response.status === 200 || response.status === 201) {
        return pass(
          'Password Reset Request',
          'Password reset requested successfully',
          Date.now() - start
        );
      } else if (response.status === 429) {
        return warn(
          'Password Reset Request',
          'Rate limited (expected behavior)',
          Date.now() - start
        );
      } else {
        return fail(
          'Password Reset Request',
          `Expected 200 or 201, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Password Reset Request', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testInvalidPasswordReset(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.post('/auth/password/reset', {
        token: 'invalid_token_12345',
        newPassword: 'NewPassword123!',
      });

      if (response.status === 400 || response.status === 401) {
        return pass(
          'Invalid Password Reset',
          'Server correctly rejected invalid token',
          Date.now() - start
        );
      } else {
        return fail(
          'Invalid Password Reset',
          `Expected 400 or 401, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Invalid Password Reset', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testValidationErrors(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.post('/auth/register', {
        email: 'invalid-email',
        password: '123', // Too short
        firstName: '',
        lastName: '',
      });

      if (response.status === 400) {
        return pass(
          'Validation Errors',
          'Server correctly rejected invalid data',
          Date.now() - start
        );
      } else {
        return fail(
          'Validation Errors',
          `Expected 400, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Validation Errors', 'Request failed', error.message, Date.now() - start);
    }
  }

  getTokens(): Tokens {
    return this.tokens;
  }
}
