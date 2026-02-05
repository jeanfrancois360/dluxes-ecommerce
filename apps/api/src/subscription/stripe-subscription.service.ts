import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import Stripe from 'stripe';
import { SubscriptionStatus, BillingCycle } from '@prisma/client';

@Injectable()
export class StripeSubscriptionService {
  private readonly logger = new Logger(StripeSubscriptionService.name);
  private stripe: Stripe | null = null;
  private stripeConfig: any = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService,
  ) {
    // Initialize Stripe on first use (lazy loading)
    this.logger.log('StripeSubscriptionService initialized - Stripe will be configured on first use');
  }

  /**
   * Initialize or reload Stripe client with latest configuration
   * Non-breaking: Falls back to environment variables if settings not configured
   */
  async initializeStripe(): Promise<void> {
    try {
      // Try to get Stripe config from database settings first
      const config = await this.settingsService.getStripeConfig();

      let secretKey = config.secretKey;
      let enabled = config.enabled;

      // Fallback to environment variables if settings not configured
      if (!secretKey) {
        secretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || '';
        this.logger.log('Using Stripe secret key from environment variables');
      } else {
        this.logger.log('Using Stripe secret key from database settings');
      }

      if (!secretKey || secretKey === 'your-stripe-key') {
        this.logger.warn('Stripe not configured. Subscription features will be disabled.');
        this.stripe = null;
        this.stripeConfig = null;
        return;
      }

      // Initialize Stripe client
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-10-29.clover',
      });

      this.stripeConfig = config;

      this.logger.log(`Stripe subscription service initialized successfully [Test Mode: ${config.testMode}, Enabled: ${enabled}]`);
    } catch (error) {
      this.logger.error('Failed to initialize Stripe:', error);
      // Try fallback to env vars
      const envKey = this.configService.get<string>('STRIPE_SECRET_KEY');
      if (envKey && envKey !== 'your-stripe-key') {
        this.stripe = new Stripe(envKey, {
          apiVersion: '2025-10-29.clover',
        });
        this.stripeConfig = { testMode: true, enabled: true };
        this.logger.log('Stripe initialized from environment variables (fallback)');
      } else {
        this.stripe = null;
        this.stripeConfig = null;
      }
    }
  }

  /**
   * Get Stripe client instance (initializes if needed)
   */
  private async getStripeClient(): Promise<Stripe> {
    if (!this.stripe) {
      await this.initializeStripe();
    }

    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured. Please configure Stripe in Admin Settings.');
    }

    return this.stripe;
  }

  /**
   * Get or create Stripe customer for user
   */
  async getOrCreateStripeCustomer(userId: string): Promise<string> {
    const stripe = await this.getStripeClient();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has a Stripe customer ID
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Check if subscription has customer ID
    const existingSubscription = await this.prisma.sellerSubscription.findFirst({
      where: { userId, stripeCustomerId: { not: null } },
    });

    if (existingSubscription?.stripeCustomerId) {
      // Update user record with customer ID
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: existingSubscription.stripeCustomerId },
      });
      return existingSubscription.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      metadata: {
        userId: user.id,
      },
    });

    // Save customer ID to user record
    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    this.logger.log(`Created Stripe customer ${customer.id} for user ${userId}`);

    return customer.id;
  }

  /**
   * Create Stripe Checkout Session for subscription
   */
  async createCheckoutSession(
    userId: string,
    planId: string,
    billingCycle: BillingCycle,
  ): Promise<{ sessionId: string; url: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (!plan.isActive) {
      throw new BadRequestException('Plan is not available');
    }

    // Free plan doesn't need Stripe checkout
    if (Number(plan.monthlyPrice) === 0) {
      throw new BadRequestException('Free plan does not require payment');
    }

    // Get Stripe price ID
    const priceId =
      billingCycle === BillingCycle.YEARLY
        ? plan.stripePriceIdYearly
        : plan.stripePriceIdMonthly;

    if (!priceId) {
      throw new BadRequestException(
        'Plan does not have Stripe pricing configured. Please contact support.',
      );
    }

    const customerId = await this.getOrCreateStripeCustomer(userId);

    const stripe = await this.getStripeClient();
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        planId,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          userId,
          planId,
        },
      },
      success_url: `${frontendUrl}/seller/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/seller/subscription/cancel`,
      allow_promotion_codes: true,
    });

    this.logger.log(
      `Created checkout session ${session.id} for user ${userId}, plan ${plan.name}`,
    );

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  /**
   * Create Stripe billing portal session for managing subscription
   */
  async createPortalSession(userId: string): Promise<{ url: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        sellerSubscription: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let customerId = user.stripeCustomerId;

    // Fallback: check subscription for customer ID
    if (!customerId && user.sellerSubscription?.stripeCustomerId) {
      customerId = user.sellerSubscription.stripeCustomerId;
      // Update user record
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    if (!customerId) {
      throw new BadRequestException(
        'No subscription found. Please subscribe to a plan first.',
      );
    }

    const stripe = await this.getStripeClient();
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${frontendUrl}/seller/subscription`,
    });

    this.logger.log(`Created portal session for user ${userId}`);

    return { url: session.url };
  }

  /**
   * Verify checkout session and activate subscription (fallback for delayed webhooks)
   * This is called from the success page to ensure the subscription is activated
   * even if the webhook hasn't been received yet
   */
  async verifyAndActivateCheckout(
    userId: string,
    sessionId: string,
  ): Promise<{ activated: boolean; subscription: any }> {
    const stripe = await this.getStripeClient();

    // Retrieve the checkout session from Stripe (no expansion to keep subscription as string ID)
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    this.logger.log(`Verifying checkout session ${sessionId} for user ${userId}`);

    // Get subscription ID (it's a string ID, not expanded object)
    const stripeSubscriptionId = session.subscription as string;
    const stripeCustomerId = session.customer as string;

    this.logger.debug(`Session data: subscription=${stripeSubscriptionId}, customer=${stripeCustomerId}, status=${session.status}`);

    // Verify the session belongs to this user
    const sessionUserId = session.metadata?.userId;
    if (sessionUserId && sessionUserId !== userId) {
      throw new BadRequestException('Session does not belong to this user');
    }

    // Check if session was completed successfully
    if (session.status !== 'complete') {
      this.logger.warn(`Checkout session ${sessionId} not complete: ${session.status}`);
      return {
        activated: false,
        subscription: null,
      };
    }

    // Check if subscription already exists and is active
    const existingSubscription = await this.prisma.sellerSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (
      existingSubscription &&
      existingSubscription.stripeSubscriptionId === stripeSubscriptionId &&
      existingSubscription.status === 'ACTIVE' &&
      existingSubscription.plan.tier !== 'FREE'
    ) {
      this.logger.log(`Subscription already active for user ${userId}`);
      return {
        activated: true,
        subscription: existingSubscription,
      };
    }

    // Get plan from metadata
    const planId = session.metadata?.planId;
    const billingCycle = session.metadata?.billingCycle;

    if (!planId) {
      this.logger.error(`No planId in session metadata for session ${sessionId}`);
      throw new BadRequestException('Invalid checkout session');
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Calculate period end
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'YEARLY') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    this.logger.log(`Creating/updating subscription: userId=${userId}, planId=${planId}, billingCycle=${billingCycle}`);

    // Create or update subscription
    const subscription = await this.prisma.sellerSubscription.upsert({
      where: { userId },
      create: {
        userId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: (billingCycle as BillingCycle) || BillingCycle.MONTHLY,
        stripeCustomerId: stripeCustomerId || null,
        stripeSubscriptionId: stripeSubscriptionId || null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        creditsAllocated: plan.monthlyCredits,
        creditsUsed: 0,
      },
      update: {
        planId,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: (billingCycle as BillingCycle) || BillingCycle.MONTHLY,
        stripeCustomerId: stripeCustomerId || undefined,
        stripeSubscriptionId: stripeSubscriptionId || undefined,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        creditsAllocated: plan.monthlyCredits,
      },
      include: { plan: true },
    });

    this.logger.log(
      `Subscription activated via verify-checkout for user ${userId} with plan ${plan.name}`,
    );

    return {
      activated: true,
      subscription,
    };
  }

  /**
   * Handle Stripe webhook events for subscriptions
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Processing subscription webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(
            event.data.object as Stripe.Invoice,
          );
          break;

        default:
          this.logger.log(`Unhandled subscription event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(
        `Error handling webhook event ${event.type}:`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  /**
   * Handle successful checkout completion
   */
  private async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const { userId, planId, billingCycle } = session.metadata || {};

    if (!userId || !planId) {
      this.logger.error('Missing metadata in checkout session');
      return;
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      this.logger.error(`Plan not found: ${planId}`);
      return;
    }

    // Calculate period end
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === BillingCycle.YEARLY) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Create or update subscription
    await this.prisma.sellerSubscription.upsert({
      where: { userId },
      create: {
        userId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: (billingCycle as BillingCycle) || BillingCycle.MONTHLY,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        creditsAllocated: plan.monthlyCredits,
        creditsUsed: 0,
      },
      update: {
        planId,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: (billingCycle as BillingCycle) || BillingCycle.MONTHLY,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        creditsAllocated: plan.monthlyCredits,
      },
    });

    this.logger.log(
      `Subscription created/updated for user ${userId} with plan ${plan.name}`,
    );
  }

  /**
   * Handle subscription updates from Stripe
   */
  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const { userId } = subscription.metadata || {};

    if (!userId) {
      this.logger.warn(
        `Missing userId in subscription metadata: ${subscription.id}`,
      );
      return;
    }

    const status = this.mapStripeStatus(subscription.status);

    await this.prisma.sellerSubscription.update({
      where: { userId },
      data: {
        status,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      },
    });

    this.logger.log(
      `Subscription updated for user ${userId}: status=${status}`,
    );
  }

  /**
   * Handle subscription deletion
   */
  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const { userId } = subscription.metadata || {};

    if (!userId) {
      this.logger.warn(
        `Missing userId in subscription metadata: ${subscription.id}`,
      );
      return;
    }

    // Find FREE plan
    const freePlan = await this.prisma.subscriptionPlan.findUnique({
      where: { tier: 'FREE' },
    });

    if (!freePlan) {
      this.logger.error('FREE plan not found in database');
      return;
    }

    await this.prisma.sellerSubscription.update({
      where: { userId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        canceledAt: new Date(),
        planId: freePlan.id, // Downgrade to FREE plan
      },
    });

    this.logger.log(`Subscription cancelled for user ${userId}`);
  }

  /**
   * Handle successful invoice payment
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    if (!(invoice as any).subscription) return;

    const stripe = await this.getStripeClient();

    const subscription = await stripe.subscriptions.retrieve(
      (invoice as any).subscription as string,
    );

    const { userId } = subscription.metadata || {};

    if (!userId) return;

    // Find subscription and plan
    const sellerSubscription = await this.prisma.sellerSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!sellerSubscription) return;

    // Reset credits for the new billing period
    await this.prisma.sellerSubscription.update({
      where: { userId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        creditsAllocated: sellerSubscription.plan.monthlyCredits,
        creditsUsed: 0,
      },
    });

    this.logger.log(`Invoice paid for user ${userId}, credits reset`);
  }

  /**
   * Handle failed invoice payment
   */
  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    if (!(invoice as any).subscription) return;

    const stripe = await this.getStripeClient();

    const subscription = await stripe.subscriptions.retrieve(
      (invoice as any).subscription as string,
    );

    const { userId } = subscription.metadata || {};

    if (!userId) return;

    await this.prisma.sellerSubscription.update({
      where: { userId },
      data: {
        status: SubscriptionStatus.PAST_DUE,
      },
    });

    this.logger.warn(`Payment failed for user ${userId}`);
  }

  /**
   * Map Stripe status to our status enum
   */
  private mapStripeStatus(
    stripeStatus: Stripe.Subscription.Status,
  ): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'trialing':
        return SubscriptionStatus.TRIAL;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'canceled':
      case 'unpaid':
        return SubscriptionStatus.CANCELLED;
      case 'incomplete':
      case 'incomplete_expired':
        return SubscriptionStatus.EXPIRED;
      default:
        return SubscriptionStatus.ACTIVE;
    }
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(userId: string): Promise<void> {
    const subscription = await this.prisma.sellerSubscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription found');
    }

    const stripe = await this.getStripeClient();

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await this.prisma.sellerSubscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    });

    this.logger.log(`Subscription scheduled for cancellation: user ${userId}`);
  }

  /**
   * Resume cancelled subscription
   */
  async resumeSubscription(userId: string): Promise<void> {
    const subscription = await this.prisma.sellerSubscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new BadRequestException('No subscription found');
    }

    if (!subscription.cancelAtPeriodEnd) {
      throw new BadRequestException('Subscription is not scheduled for cancellation');
    }

    const stripe = await this.getStripeClient();

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await this.prisma.sellerSubscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: false },
    });

    this.logger.log(`Subscription resumed: user ${userId}`);
  }

  /**
   * Sync Stripe prices with subscription plans (Admin function)
   */
  async syncStripePrices(): Promise<{ synced: number; errors: string[] }> {
    const stripe = await this.getStripeClient();

    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
    });

    let synced = 0;
    const errors: string[] = [];

    for (const plan of plans) {
      try {
        // Skip free plans
        if (Number(plan.monthlyPrice) === 0) {
          this.logger.log(`Skipping free plan: ${plan.name}`);
          continue;
        }

        // Create or get Stripe product
        let productId = plan.stripeProductId;

        if (!productId) {
          const product = await stripe.products.create({
            name: plan.name,
            description: plan.description || undefined,
            metadata: { planId: plan.id, tier: plan.tier },
          });
          productId = product.id;
          this.logger.log(`Created Stripe product ${productId} for plan ${plan.name}`);
        }

        // Create monthly price if not exists
        let monthlyPriceId = plan.stripePriceIdMonthly;
        if (!monthlyPriceId && Number(plan.monthlyPrice) > 0) {
          const monthlyPrice = await stripe.prices.create({
            product: productId,
            unit_amount: Math.round(Number(plan.monthlyPrice) * 100),
            currency: (plan.currency || 'usd').toLowerCase(),
            recurring: { interval: 'month' },
            metadata: {
              planId: plan.id,
              tier: plan.tier,
              billingCycle: 'MONTHLY',
            },
          });
          monthlyPriceId = monthlyPrice.id;
          this.logger.log(`Created monthly price ${monthlyPriceId} for plan ${plan.name}`);
        }

        // Create yearly price if not exists
        let yearlyPriceId = plan.stripePriceIdYearly;
        if (!yearlyPriceId && Number(plan.yearlyPrice) > 0) {
          const yearlyPrice = await stripe.prices.create({
            product: productId,
            unit_amount: Math.round(Number(plan.yearlyPrice) * 100),
            currency: (plan.currency || 'usd').toLowerCase(),
            recurring: { interval: 'year' },
            metadata: {
              planId: plan.id,
              tier: plan.tier,
              billingCycle: 'YEARLY',
            },
          });
          yearlyPriceId = yearlyPrice.id;
          this.logger.log(`Created yearly price ${yearlyPriceId} for plan ${plan.name}`);
        }

        // Update plan with Stripe IDs
        await this.prisma.subscriptionPlan.update({
          where: { id: plan.id },
          data: {
            stripeProductId: productId,
            stripePriceIdMonthly: monthlyPriceId,
            stripePriceIdYearly: yearlyPriceId,
          },
        });

        synced++;
      } catch (error) {
        const errorMessage = `Failed to sync plan ${plan.name}: ${error instanceof Error ? error.message : String(error)}`;
        this.logger.error(errorMessage);
        errors.push(errorMessage);
      }
    }

    this.logger.log(`Sync completed: ${synced} plans synced, ${errors.length} errors`);

    return { synced, errors };
  }
}
