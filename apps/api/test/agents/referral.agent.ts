import axios, { AxiosInstance } from 'axios';

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

/**
 * Referral Agent
 * Tests referral code generation, validation, leaderboard, and admin analytics
 */
export class ReferralAgent {
  private client: AxiosInstance;
  private adminClient: AxiosInstance;
  private referralCode: string | null = null;
  private secondUserToken: string | null = null;

  constructor(
    private baseUrl: string,
    private accessToken: string,
    private adminToken?: string
  ) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      validateStatus: () => true, // Don't throw on any status
    });

    if (adminToken) {
      this.adminClient = axios.create({
        baseURL: baseUrl,
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      });
    }
  }

  /**
   * Run all referral tests
   */
  async runAll(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Referral Settings
    results.push(await this.testGetReferralSettings());

    // User Referral Operations
    results.push(await this.testGenerateReferralCode());
    results.push(await this.testGetReferralSummary());
    results.push(await this.testValidateReferralCode());
    results.push(await this.testValidateInvalidCode());
    results.push(await this.testGetReferralHistory());
    results.push(await this.testGetLeaderboard());

    // Admin Operations (if admin token available)
    if (this.adminToken && this.adminClient) {
      results.push(await this.testGetAllReferralsAdmin());
      results.push(await this.testGetReferralStatisticsAdmin());
      results.push(await this.testGetTopReferrersAdmin());
      results.push(await this.testGetReferralSettingsAdmin());
    }

    return results;
  }

  /**
   * Test GET /referral/settings - Get public referral settings
   */
  private async testGetReferralSettings(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/referral/settings');

      if (response.status === 200 && response.data.success) {
        return {
          test: 'GET /referral/settings - Public Settings',
          status: 'pass',
          duration: Date.now() - start,
          message: {
            enabled: response.data.data.enabled,
            buyerReward: response.data.data.buyerReward,
            sellerReward: response.data.data.sellerReward,
            currency: response.data.data.currency,
          },
        };
      }

      return {
        test: 'GET /referral/settings - Public Settings',
        status: 'fail',
        duration: Date.now() - start,
        error: `Expected 200, got ${response.status}`,
      };
    } catch (error) {
      return {
        test: 'GET /referral/settings - Public Settings',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test POST /referral/generate - Generate referral code
   */
  private async testGenerateReferralCode(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.post('/referral/generate');

      if (response.status === 200 && response.data.success && response.data.code) {
        this.referralCode = response.data.code;
        return {
          test: 'POST /referral/generate - Generate Code',
          status: 'pass',
          duration: Date.now() - start,
          message: {
            code: this.referralCode,
            shareUrl: response.data.shareUrl,
          },
        };
      }

      return {
        test: 'POST /referral/generate - Generate Code',
        status: 'fail',
        duration: Date.now() - start,
        error: `Expected 200 with code, got ${response.status}`,
      };
    } catch (error) {
      return {
        test: 'POST /referral/generate - Generate Code',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test GET /referral/summary - Get user referral summary
   */
  private async testGetReferralSummary(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/referral/summary');

      if (response.status === 200 && response.data.success) {
        return {
          test: 'GET /referral/summary - User Summary',
          status: 'pass',
          duration: Date.now() - start,
          message: {
            code: response.data.data.code,
            totalReferrals: response.data.data.totalReferrals,
            totalEarned: response.data.data.totalEarned,
            pendingEarnings: response.data.data.pendingEarnings,
          },
        };
      }

      return {
        test: 'GET /referral/summary - User Summary',
        status: 'fail',
        duration: Date.now() - start,
        error: `Expected 200, got ${response.status}`,
      };
    } catch (error) {
      return {
        test: 'GET /referral/summary - User Summary',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test GET /referral/validate/:code - Validate existing code
   */
  private async testValidateReferralCode(): Promise<TestResult> {
    const start = Date.now();

    if (!this.referralCode) {
      return {
        test: 'GET /referral/validate/:code - Valid Code',
        status: 'skip',
        duration: 0,
        error: 'No referral code generated',
      };
    }

    try {
      const response = await this.client.get(`/referral/validate/${this.referralCode}`);

      if (response.status === 200 && response.data.success && response.data.valid === true) {
        return {
          test: 'GET /referral/validate/:code - Valid Code',
          status: 'pass',
          duration: Date.now() - start,
          message: {
            code: response.data.code,
            valid: response.data.valid,
          },
        };
      }

      return {
        test: 'GET /referral/validate/:code - Valid Code',
        status: 'fail',
        duration: Date.now() - start,
        error: `Expected valid=true, got ${response.data.valid}`,
      };
    } catch (error) {
      return {
        test: 'GET /referral/validate/:code - Valid Code',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test GET /referral/validate/:code - Validate invalid code
   */
  private async testValidateInvalidCode(): Promise<TestResult> {
    const start = Date.now();
    const invalidCode = 'INVALID999';

    try {
      const response = await this.client.get(`/referral/validate/${invalidCode}`);

      if (response.status === 200 && response.data.success && response.data.valid === false) {
        return {
          test: 'GET /referral/validate/:code - Invalid Code',
          status: 'pass',
          duration: Date.now() - start,
          message: {
            code: response.data.code,
            valid: response.data.valid,
          },
        };
      }

      return {
        test: 'GET /referral/validate/:code - Invalid Code',
        status: 'fail',
        duration: Date.now() - start,
        error: `Expected valid=false, got ${response.data.valid}`,
      };
    } catch (error) {
      return {
        test: 'GET /referral/validate/:code - Invalid Code',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test GET /referral/history - Get referral history
   */
  private async testGetReferralHistory(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/referral/history', {
        params: {
          page: 1,
          limit: 20,
        },
      });

      if (response.status === 200 && response.data.success) {
        return {
          test: 'GET /referral/history - Referral History',
          status: 'pass',
          duration: Date.now() - start,
          message: {
            referralsCount: response.data.referrals?.length || 0,
            total: response.data.total,
            page: response.data.page,
          },
        };
      }

      return {
        test: 'GET /referral/history - Referral History',
        status: 'fail',
        duration: Date.now() - start,
        error: `Expected 200, got ${response.status}`,
      };
    } catch (error) {
      return {
        test: 'GET /referral/history - Referral History',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test GET /referral/leaderboard - Get top referrers leaderboard
   */
  private async testGetLeaderboard(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/referral/leaderboard', {
        params: { limit: 10 },
      });

      if (response.status === 200 && response.data.success) {
        const leaderboard = response.data.data || [];
        return {
          test: 'GET /referral/leaderboard - Leaderboard',
          status: 'pass',
          duration: Date.now() - start,
          message: {
            topReferrersCount: leaderboard.length,
            topReferrer: leaderboard[0] || null,
          },
        };
      }

      return {
        test: 'GET /referral/leaderboard - Leaderboard',
        status: 'fail',
        duration: Date.now() - start,
        error: `Expected 200, got ${response.status}`,
      };
    } catch (error) {
      return {
        test: 'GET /referral/leaderboard - Leaderboard',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test GET /referral/admin/all - Get all referrals (Admin)
   */
  private async testGetAllReferralsAdmin(): Promise<TestResult> {
    const start = Date.now();

    if (!this.adminClient) {
      return {
        test: 'GET /referral/admin/all - All Referrals (Admin)',
        status: 'skip',
        duration: 0,
        error: 'No admin token provided',
      };
    }

    try {
      const response = await this.adminClient.get('/referral/admin/all', {
        params: {
          page: 1,
          limit: 50,
        },
      });

      if (response.status === 200 && response.data.success) {
        return {
          test: 'GET /referral/admin/all - All Referrals (Admin)',
          status: 'pass',
          duration: Date.now() - start,
          message: {
            referralsCount: response.data.referrals?.length || 0,
            total: response.data.total,
            page: response.data.page,
          },
        };
      }

      return {
        test: 'GET /referral/admin/all - All Referrals (Admin)',
        status: 'fail',
        duration: Date.now() - start,
        error: `Expected 200, got ${response.status}`,
      };
    } catch (error) {
      return {
        test: 'GET /referral/admin/all - All Referrals (Admin)',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test GET /referral/admin/statistics - Get referral statistics (Admin)
   */
  private async testGetReferralStatisticsAdmin(): Promise<TestResult> {
    const start = Date.now();

    if (!this.adminClient) {
      return {
        test: 'GET /referral/admin/statistics - Statistics (Admin)',
        status: 'skip',
        duration: 0,
        error: 'No admin token provided',
      };
    }

    try {
      const response = await this.adminClient.get('/referral/admin/statistics');

      if (response.status === 200 && response.data.success) {
        return {
          test: 'GET /referral/admin/statistics - Statistics (Admin)',
          status: 'pass',
          duration: Date.now() - start,
          message: {
            totalReferrals: response.data.data.totalReferrals,
            totalActive: response.data.data.totalActive,
            totalCompleted: response.data.data.totalCompleted,
            totalRewardsPaid: response.data.data.totalRewardsPaid,
            totalRewardsPending: response.data.data.totalRewardsPending,
          },
        };
      }

      return {
        test: 'GET /referral/admin/statistics - Statistics (Admin)',
        status: 'fail',
        duration: Date.now() - start,
        error: `Expected 200, got ${response.status}`,
      };
    } catch (error) {
      return {
        test: 'GET /referral/admin/statistics - Statistics (Admin)',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test GET /referral/admin/top-referrers - Get top referrers with full details (Admin)
   */
  private async testGetTopReferrersAdmin(): Promise<TestResult> {
    const start = Date.now();

    if (!this.adminClient) {
      return {
        test: 'GET /referral/admin/top-referrers - Top Referrers (Admin)',
        status: 'skip',
        duration: 0,
        error: 'No admin token provided',
      };
    }

    try {
      const response = await this.adminClient.get('/referral/admin/top-referrers', {
        params: { limit: 50 },
      });

      if (response.status === 200 && response.data.success) {
        const topReferrers = response.data.data || [];
        return {
          test: 'GET /referral/admin/top-referrers - Top Referrers (Admin)',
          status: 'pass',
          duration: Date.now() - start,
          message: {
            topReferrersCount: topReferrers.length,
            topReferrer: topReferrers[0] || null,
            hasFullDetails: topReferrers[0]?.email ? true : false,
          },
        };
      }

      return {
        test: 'GET /referral/admin/top-referrers - Top Referrers (Admin)',
        status: 'fail',
        duration: Date.now() - start,
        error: `Expected 200, got ${response.status}`,
      };
    } catch (error) {
      return {
        test: 'GET /referral/admin/top-referrers - Top Referrers (Admin)',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test GET /referral/admin/settings - Get full referral settings (Admin)
   */
  private async testGetReferralSettingsAdmin(): Promise<TestResult> {
    const start = Date.now();

    if (!this.adminClient) {
      return {
        test: 'GET /referral/admin/settings - Settings (Admin)',
        status: 'skip',
        duration: 0,
        error: 'No admin token provided',
      };
    }

    try {
      const response = await this.adminClient.get('/referral/admin/settings');

      if (response.status === 200 && response.data.success) {
        return {
          test: 'GET /referral/admin/settings - Settings (Admin)',
          status: 'pass',
          duration: Date.now() - start,
          message: {
            enabled: response.data.data.enabled,
            buyerReward: response.data.data.buyerReward,
            sellerReward: response.data.data.sellerReward,
            minOrderValue: response.data.data.minOrderValue,
            currency: response.data.data.rewardCurrency,
            hasInternalConfig: !!response.data.data.id,
          },
        };
      }

      return {
        test: 'GET /referral/admin/settings - Settings (Admin)',
        status: 'fail',
        duration: Date.now() - start,
        error: `Expected 200, got ${response.status}`,
      };
    } catch (error) {
      return {
        test: 'GET /referral/admin/settings - Settings (Admin)',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
