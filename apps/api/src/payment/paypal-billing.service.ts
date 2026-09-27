import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';

interface PayPalTokenCache {
  token: string;
  expiresAt: number;
}

/**
 * PayPal Billing Service — Subscriptions API (/v1/billing/*)
 *
 * Handles recurring payments via PayPal's native subscription system:
 * - Products (catalogs)
 * - Billing Plans (pricing + intervals)
 * - Subscriptions (buyer ↔ plan link with auto-renewal)
 *
 * Uses direct REST API calls since @paypal/checkout-server-sdk
 * does not support the Subscriptions API.
 */
@Injectable()
export class PayPalBillingService {
  private readonly logger = new Logger(PayPalBillingService.name);
  private tokenCache: PayPalTokenCache | null = null;
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.clientId = this.configService.get<string>('PAYPAL_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET') || '';
    const mode = this.configService.get<string>('PAYPAL_MODE') || 'sandbox';
    this.baseUrl =
      mode === 'production' || mode === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    if (this.clientId && this.clientSecret) {
      this.logger.log(`PayPal Billing Service initialized (${mode} mode)`);
    } else {
      this.logger.warn('PayPal credentials not found. Billing features disabled.');
    }
  }

  /**
   * Get OAuth2 access token (cached until expiry)
   */
  private async getAccessToken(): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache.token;
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const res = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
      const error = await res.text();
      this.logger.error(`PayPal OAuth failed: ${error}`);
      throw new BadRequestException('PayPal authentication failed');
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000, // 60s buffer
    };

    return data.access_token;
  }

  /**
   * Make authenticated PayPal API request
   */
  private async request<T = any>(method: string, path: string, body?: any): Promise<T> {
    if (!this.clientId || !this.clientSecret) {
      throw new BadRequestException('PayPal is not configured');
    }

    const token = await this.getAccessToken();

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Prefer: 'return=representation',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
      const errorText = await res.text();
      this.logger.error(`PayPal API ${method} ${path} failed (${res.status}): ${errorText}`);
      throw new BadRequestException(`PayPal API error: ${res.status}`);
    }

    // Some endpoints return 204 No Content
    if (res.status === 204) return {} as T;

    return (await res.json()) as T;
  }

  // ==========================================================================
  // PRODUCTS (Catalogs)
  // ==========================================================================

  /**
   * Create a PayPal product (catalog item) for a subscription plan.
   * Products are reusable — one per subscription plan tier.
   */
  async createProduct(data: {
    name: string;
    description: string;
    type?: 'SERVICE' | 'DIGITAL';
    category?: string;
  }): Promise<{ id: string; name: string }> {
    const result = await this.request('POST', '/v1/catalogs/products', {
      name: data.name,
      description: data.description,
      type: data.type || 'SERVICE',
      category: data.category || 'SOFTWARE',
    });

    this.logger.log(`PayPal product created: ${result.id} (${data.name})`);
    return { id: result.id, name: result.name };
  }

  // ==========================================================================
  // BILLING PLANS
  // ==========================================================================

  /**
   * Create a PayPal billing plan for a subscription tier.
   */
  async createBillingPlan(data: {
    productId: string;
    name: string;
    description: string;
    price: number;
    currency?: string;
    interval: 'MONTH' | 'YEAR' | 'WEEK';
    intervalCount?: number;
    trialDays?: number;
  }): Promise<{ id: string; status: string }> {
    const billingCycles: any[] = [];

    // Trial period (if applicable)
    if (data.trialDays && data.trialDays > 0) {
      billingCycles.push({
        frequency: { interval_unit: 'DAY', interval_count: data.trialDays },
        tenure_type: 'TRIAL',
        sequence: 1,
        total_cycles: 1,
        pricing_scheme: {
          fixed_price: { value: '0', currency_code: data.currency || 'USD' },
        },
      });
    }

    // Regular billing cycle
    billingCycles.push({
      frequency: {
        interval_unit: data.interval,
        interval_count: data.intervalCount || 1,
      },
      tenure_type: 'REGULAR',
      sequence: billingCycles.length + 1,
      total_cycles: 0, // 0 = infinite
      pricing_scheme: {
        fixed_price: {
          value: data.price.toFixed(2),
          currency_code: data.currency || 'USD',
        },
      },
    });

    const result = await this.request('POST', '/v1/billing/plans', {
      product_id: data.productId,
      name: data.name,
      description: data.description,
      status: 'ACTIVE',
      billing_cycles: billingCycles,
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CANCEL',
        payment_failure_threshold: 3,
      },
    });

    this.logger.log(`PayPal billing plan created: ${result.id} (${data.name})`);
    return { id: result.id, status: result.status };
  }

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================

  /**
   * Create a PayPal subscription for a user.
   * Returns an approval URL — redirect the user there.
   */
  async createSubscription(data: {
    planId: string;
    returnUrl: string;
    cancelUrl: string;
    subscriberEmail?: string;
    subscriberName?: string;
    metadata?: Record<string, string>;
  }): Promise<{ subscriptionId: string; approvalUrl: string }> {
    const body: any = {
      plan_id: data.planId,
      application_context: {
        brand_name: 'NextPik',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: data.returnUrl,
        cancel_url: data.cancelUrl,
      },
    };

    if (data.subscriberEmail) {
      body.subscriber = {
        email_address: data.subscriberEmail,
        ...(data.subscriberName
          ? {
              name: {
                given_name: data.subscriberName.split(' ')[0] || data.subscriberName,
                surname: data.subscriberName.split(' ').slice(1).join(' ') || '',
              },
            }
          : {}),
      };
    }

    if (data.metadata) {
      body.custom_id = JSON.stringify(data.metadata);
    }

    const result = await this.request('POST', '/v1/billing/subscriptions', body);

    const approvalUrl = result.links?.find((link: any) => link.rel === 'approve')?.href;

    if (!approvalUrl) {
      throw new BadRequestException('Failed to get PayPal subscription approval URL');
    }

    this.logger.log(`PayPal subscription created: ${result.id} (plan: ${data.planId})`);

    return {
      subscriptionId: result.id,
      approvalUrl,
    };
  }

  /**
   * Get subscription details from PayPal
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    return this.request('GET', `/v1/billing/subscriptions/${subscriptionId}`);
  }

  /**
   * Cancel a PayPal subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    reason: string = 'User requested cancellation'
  ): Promise<void> {
    await this.request('POST', `/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      reason,
    });
    this.logger.log(`PayPal subscription cancelled: ${subscriptionId}`);
  }

  /**
   * Suspend a PayPal subscription (pause billing)
   */
  async suspendSubscription(
    subscriptionId: string,
    reason: string = 'Suspended by platform'
  ): Promise<void> {
    await this.request('POST', `/v1/billing/subscriptions/${subscriptionId}/suspend`, {
      reason,
    });
    this.logger.log(`PayPal subscription suspended: ${subscriptionId}`);
  }

  /**
   * Reactivate a suspended PayPal subscription
   */
  async reactivateSubscription(
    subscriptionId: string,
    reason: string = 'Reactivated by user'
  ): Promise<void> {
    await this.request('POST', `/v1/billing/subscriptions/${subscriptionId}/activate`, {
      reason,
    });
    this.logger.log(`PayPal subscription reactivated: ${subscriptionId}`);
  }

  // ==========================================================================
  // PLAN SYNC — Create/update PayPal products + plans for NextPik plans
  // ==========================================================================

  /**
   * Sync a NextPik subscription plan to PayPal (create product + billing plan).
   * Stores PayPal IDs on the plan record for future use.
   *
   * Returns the PayPal billing plan IDs (monthly + yearly).
   */
  async syncSubscriptionPlan(plan: {
    id: string;
    name: string;
    description: string | null;
    monthlyPrice: number;
    yearlyPrice: number;
    currency?: string;
    trialDays?: number;
  }): Promise<{
    paypalProductId: string;
    paypalPlanIdMonthly: string | null;
    paypalPlanIdYearly: string | null;
  }> {
    // Check if plan already has PayPal product
    const existingPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: plan.id },
      select: { paypalProductId: true, paypalPlanIdMonthly: true, paypalPlanIdYearly: true },
    });

    let productId = (existingPlan as any)?.paypalProductId;

    // Create product if not exists
    if (!productId) {
      const product = await this.createProduct({
        name: `${plan.name} Subscription`,
        description: plan.description || `${plan.name} subscription plan`,
      });
      productId = product.id;
    }

    let monthlyPlanId = (existingPlan as any)?.paypalPlanIdMonthly;
    let yearlyPlanId = (existingPlan as any)?.paypalPlanIdYearly;

    // Create monthly plan if price > 0 and not exists
    if (plan.monthlyPrice > 0 && !monthlyPlanId) {
      const monthly = await this.createBillingPlan({
        productId,
        name: `${plan.name} (Monthly)`,
        description: `${plan.name} - Monthly billing`,
        price: plan.monthlyPrice,
        currency: plan.currency || 'USD',
        interval: 'MONTH',
        trialDays: plan.trialDays,
      });
      monthlyPlanId = monthly.id;
    }

    // Create yearly plan if price > 0 and not exists
    if (plan.yearlyPrice > 0 && !yearlyPlanId) {
      const yearly = await this.createBillingPlan({
        productId,
        name: `${plan.name} (Yearly)`,
        description: `${plan.name} - Annual billing`,
        price: plan.yearlyPrice,
        currency: plan.currency || 'USD',
        interval: 'YEAR',
        trialDays: plan.trialDays,
      });
      yearlyPlanId = yearly.id;
    }

    this.logger.log(
      `Synced plan "${plan.name}" to PayPal: product=${productId}, monthly=${monthlyPlanId}, yearly=${yearlyPlanId}`
    );

    return {
      paypalProductId: productId,
      paypalPlanIdMonthly: monthlyPlanId,
      paypalPlanIdYearly: yearlyPlanId,
    };
  }
}
