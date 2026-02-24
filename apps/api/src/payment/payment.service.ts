import { Injectable, BadRequestException, Logger, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { CurrencyService } from '../currency/currency.service';
import { StripeSubscriptionService } from '../subscription/stripe-subscription.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import {
  PaymentStatus,
  PaymentTransactionStatus,
  PaymentMethod,
  WebhookStatus,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentService {
  private stripe: Stripe | null = null;
  private stripeConfig: any = null;
  private readonly logger = new Logger(PaymentService.name);
  private readonly MAX_WEBHOOK_RETRIES = 5;
  private readonly RETRY_DELAYS = [60, 300, 900, 3600, 7200]; // seconds: 1min, 5min, 15min, 1hr, 2hr

  // Stripe-supported currencies (most common ones)
  private readonly STRIPE_SUPPORTED_CURRENCIES = [
    'USD',
    'EUR',
    'GBP',
    'CAD',
    'AUD',
    'JPY',
    'CNY',
    'INR',
    'BRL',
    'MXN',
    'RWF',
    'KES',
    'UGX',
    'TZS',
    'NGN',
    'GHS',
    'ZAR',
    'CHF',
    'SEK',
    'NOK',
    'DKK',
    'PLN',
    'CZK',
    'HUF',
    'RON',
    'BGN',
    'HRK',
    'RUB',
    'TRY',
    'ILS',
    'AED',
    'SAR',
    'QAR',
    'KWD',
    'BHD',
    'OMR',
    'JOD',
    'SGD',
    'HKD',
    'NZD',
    'THB',
    'PHP',
    'MYR',
    'IDR',
    'VND',
    'KRW',
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly currencyService: CurrencyService,
    @Optional() private readonly stripeSubscriptionService?: StripeSubscriptionService
  ) {
    // Initialize Stripe on first use (lazy loading)
    this.logger.log('PaymentService initialized - Stripe will be configured on first use');
  }

  /**
   * Initialize or reload Stripe client with latest configuration
   * Non-breaking: Falls back to environment variables if settings not configured
   */
  async initializeStripe(): Promise<void> {
    try {
      // Get Stripe config (API keys from env, business config from database)
      const config = await this.settingsService.getStripeConfig();

      const secretKey = config.secretKey; // From environment variables
      const enabled = config.enabled; // From database settings

      if (!secretKey) {
        this.logger.warn('Stripe secret key not found in environment variables');
      } else {
        this.logger.log(
          'Stripe configured: API keys from environment, business settings from database'
        );
      }

      if (!secretKey || secretKey === 'your-stripe-key') {
        this.logger.warn('Stripe not configured. Payment functionality will be disabled.');
        this.stripe = null;
        this.stripeConfig = null;
        return;
      }

      // Initialize Stripe client
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-10-29.clover',
      });

      this.stripeConfig = config;

      this.logger.log(
        `Stripe initialized successfully [Test Mode: ${config.testMode}, Enabled: ${enabled}]`
      );
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
      throw new BadRequestException(
        'Payment service not configured. Please configure Stripe in Admin Settings.'
      );
    }

    return this.stripe;
  }

  /**
   * Public method to get Stripe client for other services (e.g., seller credits)
   */
  async getStripe(): Promise<Stripe> {
    return this.getStripeClient();
  }

  /**
   * Reload Stripe configuration without restarting the application
   * Useful when settings are updated via admin panel
   */
  async reloadStripeConfig(): Promise<void> {
    this.logger.log('Reloading Stripe configuration...');
    await this.initializeStripe();
  }

  /**
   * Get current Stripe configuration status
   */
  async getStripeStatus() {
    try {
      const config = await this.settingsService.getStripeConfig();
      const isConfigured = await this.settingsService.isStripeConfigured();

      return {
        configured: isConfigured,
        enabled: config.enabled,
        testMode: config.testMode,
        hasPublishableKey: !!config.publishableKey,
        hasSecretKey: !!config.secretKey,
        hasWebhookSecret: !!config.webhookSecret,
        currency: config.currency,
        captureMethod: config.captureMethod,
      };
    } catch (error) {
      this.logger.error('Failed to get Stripe status:', error);
      return {
        configured: false,
        enabled: false,
        testMode: true,
        hasPublishableKey: false,
        hasSecretKey: false,
        hasWebhookSecret: false,
        currency: 'USD',
        captureMethod: 'manual',
      };
    }
  }

  /**
   * Validate if currency is supported by both the system and Stripe
   */
  private async validateCurrency(currencyCode: string): Promise<void> {
    const upperCurrency = currencyCode.toUpperCase();

    // Check if currency is supported by our system
    const isSystemSupported = await this.currencyService.validateCurrency(upperCurrency);
    if (!isSystemSupported) {
      throw new BadRequestException(
        `Currency ${upperCurrency} is not supported. Please use one of the supported currencies.`
      );
    }

    // Check if currency is supported by Stripe
    if (!this.STRIPE_SUPPORTED_CURRENCIES.includes(upperCurrency)) {
      throw new BadRequestException(
        `Currency ${upperCurrency} is not supported by Stripe payment processor.`
      );
    }
  }

  /**
   * Get default currency for payment
   * TODO: Add user preferred currency to User model in future
   */
  private async getDefaultPaymentCurrency(): Promise<string> {
    // Get system default currency
    return await this.currencyService.getDefaultCurrency();
  }

  /**
   * Convert amount to smallest currency unit (cents) for Stripe
   * Handles zero-decimal currencies (JPY, KRW, etc.) correctly
   */
  private convertToSmallestUnit(amount: number, currency: string): number {
    const upperCurrency = currency.toUpperCase();

    // Zero-decimal currencies (no cents)
    const zeroDecimalCurrencies = [
      'BIF',
      'CLP',
      'DJF',
      'GNF',
      'JPY',
      'KMF',
      'KRW',
      'MGA',
      'PYG',
      'RWF',
      'UGX',
      'VND',
      'VUV',
      'XAF',
      'XOF',
      'XPF',
    ];

    if (zeroDecimalCurrencies.includes(upperCurrency)) {
      // For zero-decimal currencies, amount is already in smallest unit
      return Math.round(amount);
    }

    // For standard currencies, multiply by 100 to get cents
    return Math.round(amount * 100);
  }

  /**
   * Check if escrow is enabled (system setting)
   */
  private async isEscrowEnabled(): Promise<boolean> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'escrow_enabled' },
      });
      return setting?.value === true;
    } catch (error) {
      this.logger.warn('Failed to check escrow setting, defaulting to true', error);
      return true; // Default to escrow enabled for safety
    }
  }

  /**
   * Check if immediate payouts are enabled (for testing/trusted sellers)
   */
  private async isImmediatePayoutEnabled(): Promise<boolean> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'escrow.immediate_payout_enabled' },
      });
      return setting?.value === true;
    } catch (error) {
      this.logger.warn('Failed to check immediate payout setting, defaulting to false', error);
      return false; // Default to disabled for safety
    }
  }

  /**
   * Get escrow hold period days from system settings
   */
  private async getEscrowHoldPeriodDays(): Promise<number> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'escrow_hold_period_days' },
      });
      return typeof setting?.value === 'number' ? setting.value : 7;
    } catch (error) {
      this.logger.warn('Failed to get hold period setting, defaulting to 7 days', error);
      return 7; // Default to 7 days
    }
  }

  /**
   * Capture payment with strategy-based triggers
   *
   * Handles payment capture for different scenarios:
   * - DELIVERY_CONFIRMED: Capture when order is delivered
   * - AUTO_FALLBACK: Automatic capture before authorization expires (Day 6)
   * - MANUAL: Admin manually triggers capture
   */
  async capturePaymentWithStrategy(
    orderId: string,
    trigger: 'DELIVERY_CONFIRMED' | 'AUTO_FALLBACK' | 'MANUAL',
    userId?: string
  ): Promise<{ success: boolean; capturedAmount: number }> {
    try {
      // Find payment transaction for order
      const transaction = await this.prisma.paymentTransaction.findFirst({
        where: {
          orderId,
          status: {
            in: [PaymentTransactionStatus.SUCCEEDED, PaymentTransactionStatus.REQUIRES_ACTION],
          },
        },
      });

      if (!transaction?.stripePaymentIntentId) {
        throw new BadRequestException('No capturable payment found for order');
      }

      // Get Stripe payment intent with charges expanded
      const stripe = await this.getStripeClient();
      const paymentIntent: any = await stripe.paymentIntents.retrieve(
        transaction.stripePaymentIntentId,
        { expand: ['charges'] }
      );

      // Check if already captured
      if (paymentIntent.status === 'succeeded') {
        const charges = paymentIntent.charges?.data;
        if (charges && charges.length > 0 && charges[0].captured) {
          this.logger.log(`Payment already captured: ${paymentIntent.id}`);
          return {
            success: true,
            capturedAmount: (paymentIntent.amount_received || paymentIntent.amount) / 100,
          };
        }
      }

      // Verify can be captured
      if (paymentIntent.status !== 'requires_capture') {
        throw new BadRequestException(
          `Payment cannot be captured. Status: ${paymentIntent.status}`
        );
      }

      // Capture the payment
      this.logger.log(`Capturing payment ${paymentIntent.id} via ${trigger} for order ${orderId}`);

      const capturedIntent = await stripe.paymentIntents.capture(paymentIntent.id);

      // Update transaction status
      const metadata = (transaction.metadata as any) || {};
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentTransactionStatus.CAPTURED,
          metadata: {
            ...metadata,
            capturedAt: new Date().toISOString(),
            captureTrigger: trigger,
            capturedBy: userId || 'SYSTEM',
          },
        },
      });

      // Create order timeline entry
      await this.prisma.orderTimeline.create({
        data: {
          orderId,
          status: 'CONFIRMED',
          title: 'Payment Captured',
          description: `Payment successfully captured via ${trigger}`,
          icon: 'credit-card',
        },
      });

      this.logger.log(
        `Successfully captured ${capturedIntent.amount_received / 100} for order ${orderId}`
      );

      return {
        success: true,
        capturedAmount: capturedIntent.amount_received / 100,
      };
    } catch (error) {
      this.logger.error(`Failed to capture payment for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Basic capture method (backwards compatible)
   * Captures a Stripe payment intent by ID
   */
  async capturePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const stripe = await this.getStripeClient();
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    return paymentIntent;
  }

  /**
   * Create a Stripe Payment Intent with multi-currency support
   */
  async createPaymentIntent(dto: CreatePaymentIntentDto, userId: string) {
    if (!dto.orderId) {
      throw new BadRequestException('Order ID is required');
    }

    try {
      // Get Stripe client (initializes if needed)
      const stripe = await this.getStripeClient();

      // Verify order exists
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
      });

      if (!order) {
        throw new BadRequestException('Order not found');
      }

      // Check if a payment intent already exists for this order
      const existingTransaction = await this.prisma.paymentTransaction.findFirst({
        where: {
          orderId: dto.orderId,
          status: {
            in: [
              PaymentTransactionStatus.PENDING,
              PaymentTransactionStatus.PROCESSING,
              PaymentTransactionStatus.SUCCEEDED,
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingTransaction?.stripePaymentIntentId) {
        try {
          // Retrieve existing payment intent from Stripe
          const existingIntent = await stripe.paymentIntents.retrieve(
            existingTransaction.stripePaymentIntentId
          );

          // Reuse existing intent if still valid (not canceled or succeeded without capture)
          if (existingIntent.status !== 'canceled' && existingIntent.status !== 'succeeded') {
            this.logger.log(
              `Reusing existing payment intent ${existingIntent.id} for order ${dto.orderId} (status: ${existingIntent.status})`
            );

            // Get currency details for response
            const currency = existingIntent.currency.toUpperCase();
            const currencyDetails = await this.currencyService.getRateByCode(currency);

            return {
              clientSecret: existingIntent.client_secret,
              paymentIntentId: existingIntent.id,
              transactionId: existingTransaction.id,
              currency,
              amount: existingIntent.amount / 100, // Convert from smallest unit
              currencyDetails: {
                code: currency,
                symbol: currencyDetails.symbol,
                name: currencyDetails.currencyName,
              },
            };
          }
        } catch (retrieveError) {
          this.logger.warn(
            `Failed to retrieve existing payment intent ${existingTransaction.stripePaymentIntentId}, creating new one:`,
            retrieveError
          );
          // Continue to create new intent if retrieval fails
        }
      }

      // Get Stripe config for capture method and default currency
      const config = this.stripeConfig || (await this.settingsService.getStripeConfig());

      // Determine currency to use (priority: dto currency > default currency)
      let paymentCurrency: string;
      if (dto.currency) {
        paymentCurrency = dto.currency.toUpperCase();
      } else {
        paymentCurrency = await this.getDefaultPaymentCurrency();
      }

      // Validate currency is supported
      await this.validateCurrency(paymentCurrency);

      // Get currency details for formatting
      const currencyDetails = await this.currencyService.getRateByCode(paymentCurrency);

      // Convert amount to smallest currency unit (handles zero-decimal currencies)
      const amountInSmallestUnit = this.convertToSmallestUnit(dto.amount, paymentCurrency);

      this.logger.log(
        `Creating payment intent: ${dto.amount} ${paymentCurrency} (${amountInSmallestUnit} smallest unit) for order ${dto.orderId}`
      );

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInSmallestUnit,
        currency: paymentCurrency.toLowerCase(), // Stripe requires lowercase currency codes
        capture_method: config.captureMethod,
        statement_descriptor_suffix: config.statementDescriptor?.substring(0, 22), // Max 22 chars for suffix
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          orderId: dto.orderId,
          userId,
          customerEmail: dto.customerEmail || '',
          testMode: config.testMode.toString(),
          originalCurrency: paymentCurrency,
        },
      });

      // Create payment transaction record
      const transaction = await this.prisma.paymentTransaction.create({
        data: {
          orderId: dto.orderId,
          userId,
          stripePaymentIntentId: paymentIntent.id,
          amount: new Decimal(dto.amount),
          currency: paymentCurrency,
          status: PaymentTransactionStatus.PENDING,
          paymentMethod: PaymentMethod.STRIPE,
          receiptEmail: dto.customerEmail,
          metadata: {
            currencySymbol: currencyDetails.symbol,
            currencyName: currencyDetails.currencyName,
            exchangeRate: currencyDetails.rate.toString(),
          } as any,
        },
      });

      this.logger.log(
        `Payment intent created: ${paymentIntent.id} for order ${dto.orderId} in ${paymentCurrency}`
      );

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        transactionId: transaction.id,
        currency: paymentCurrency,
        amount: dto.amount,
        currencyDetails: {
          code: paymentCurrency,
          symbol: currencyDetails.symbol,
          name: currencyDetails.currencyName,
        },
      };
    } catch (error) {
      this.logger.error('Error creating payment intent:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  /**
   * Handle Stripe webhook events with retry logic and signature verification
   */
  async handleWebhook(signature: string, rawBody: Buffer) {
    // Get Stripe client (initializes if needed)
    const stripe = await this.getStripeClient();

    // Get webhook secret from settings (with fallback to env var)
    let webhookSecret = await this.settingsService.getStripeWebhookSecret();

    if (!webhookSecret) {
      webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
      if (webhookSecret) {
        this.logger.log('Using webhook secret from environment variables');
      }
    } else {
      this.logger.log('Using webhook secret from database settings');
    }

    if (!webhookSecret) {
      throw new BadRequestException(
        'Webhook secret not configured. Please configure in Admin Settings.'
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
      this.logger.error(
        'Webhook signature verification failed:',
        error instanceof Error ? error.message : String(error)
      );
      throw new BadRequestException('Invalid signature');
    }

    this.logger.log(`Webhook received: ${event.type} (${event.id})`);

    // Check if we've already processed this event
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { eventId: event.id },
    });

    if (existing && existing.status === WebhookStatus.PROCESSED) {
      this.logger.log(`Webhook ${event.id} already processed, skipping`);
      return { received: true, alreadyProcessed: true };
    }

    // Create or update webhook event record
    const webhookEvent = await this.prisma.webhookEvent.upsert({
      where: { eventId: event.id },
      create: {
        eventId: event.id,
        provider: 'stripe',
        eventType: event.type,
        payload: event as any,
        status: WebhookStatus.PROCESSING,
        processingAttempts: 1,
      },
      update: {
        status: WebhookStatus.PROCESSING,
        processingAttempts: { increment: 1 },
        lastProcessedAt: new Date(),
      },
    });

    try {
      // Handle the event
      switch (event.type) {
        // Payment Intent Events
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(
            event.data.object as Stripe.PaymentIntent,
            webhookEvent.id
          );
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(
            event.data.object as Stripe.PaymentIntent,
            webhookEvent.id
          );
          break;

        case 'payment_intent.processing':
          await this.handlePaymentProcessing(
            event.data.object as Stripe.PaymentIntent,
            webhookEvent.id
          );
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(
            event.data.object as Stripe.PaymentIntent,
            webhookEvent.id
          );
          break;

        case 'payment_intent.requires_action':
          await this.handlePaymentRequiresAction(
            event.data.object as Stripe.PaymentIntent,
            webhookEvent.id
          );
          break;

        case 'payment_intent.amount_capturable_updated':
          await this.handleAmountCapturableUpdated(
            event.data.object as Stripe.PaymentIntent,
            webhookEvent.id
          );
          break;

        // Charge Events
        case 'charge.succeeded':
          await this.handleChargeSucceeded(event.data.object as Stripe.Charge, webhookEvent.id);
          break;

        case 'charge.failed':
          await this.handleChargeFailed(event.data.object as Stripe.Charge, webhookEvent.id);
          break;

        case 'charge.captured':
          await this.handleChargeCaptured(event.data.object as Stripe.Charge, webhookEvent.id);
          break;

        case 'charge.refunded':
          await this.handleRefund(event.data.object as Stripe.Charge, webhookEvent.id);
          break;

        // Refund Events
        case 'refund.created':
          await this.handleRefundCreated(event.data.object as Stripe.Refund, webhookEvent.id);
          break;

        case 'refund.updated':
          await this.handleRefundUpdated(event.data.object as Stripe.Refund, webhookEvent.id);
          break;

        case 'refund.failed':
          await this.handleRefundFailed(event.data.object as Stripe.Refund, webhookEvent.id);
          break;

        // Dispute Events
        case 'charge.dispute.created':
          await this.handleDisputeCreated(event.data.object as Stripe.Dispute, webhookEvent.id);
          break;

        case 'charge.dispute.updated':
          await this.handleDisputeUpdated(event.data.object as Stripe.Dispute, webhookEvent.id);
          break;

        case 'charge.dispute.closed':
          await this.handleDisputeClosed(event.data.object as Stripe.Dispute, webhookEvent.id);
          break;

        // Checkout Session Completed - Check if it's seller credits, credit package, or subscription
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;

          // Check if this is a seller credit purchase (monthly subscription)
          if (session.metadata?.type === 'seller_credits') {
            this.logger.log('Processing seller credit purchase from checkout session');

            // Dynamically import SellerCreditsService to avoid circular dependency
            try {
              const { SellerCreditsService } = await import('../seller/seller-credits.service');
              const sellerCreditsService = new SellerCreditsService(
                this.prisma,
                this.configService,
                this // Pass PaymentService itself
              );

              await sellerCreditsService.processSuccessfulPurchase(session.id);
              this.logger.log(`✅ Seller credit purchase processed: ${session.id}`);
            } catch (error) {
              this.logger.error(`Failed to process seller credit purchase:`, error);
              throw error;
            }
          }
          // Check if this is a credit package purchase (pay-per-listing credits)
          else if (session.metadata?.type === 'credit_package') {
            this.logger.log('Processing credit package purchase from checkout session');

            // Dynamically import CreditsService to avoid circular dependency
            try {
              const { CreditsService } = await import('../credits/credits.service');
              const { SettingsService } = await import('../settings/settings.service');

              const settingsService = new SettingsService(this.prisma);
              const creditsService = new CreditsService(
                this.prisma,
                settingsService,
                this, // Pass PaymentService itself
                this.configService
              );

              await creditsService.processSuccessfulPurchase(session.id);
              this.logger.log(`✅ Credit package purchase processed: ${session.id}`);
            } catch (error) {
              this.logger.error(`Failed to process credit package purchase:`, error);
              throw error;
            }
          } else {
            // Route to StripeSubscriptionService for regular subscriptions
            if (this.stripeSubscriptionService) {
              this.logger.log(`Routing ${event.type} to StripeSubscriptionService`);
              await this.stripeSubscriptionService.handleWebhookEvent(event);
            } else {
              this.logger.warn(`StripeSubscriptionService not available to handle ${event.type}`);
            }
          }
          break;

        // Other Subscription Events - Route to StripeSubscriptionService
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
        case 'invoice.paid':
        case 'invoice.payment_failed':
          if (this.stripeSubscriptionService) {
            this.logger.log(`Routing ${event.type} to StripeSubscriptionService`);
            await this.stripeSubscriptionService.handleWebhookEvent(event);
          } else {
            this.logger.warn(`StripeSubscriptionService not available to handle ${event.type}`);
          }
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
          await this.prisma.webhookEvent.update({
            where: { id: webhookEvent.id },
            data: { status: WebhookStatus.IGNORED },
          });
          return { received: true };
      }

      // Mark webhook as processed
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookStatus.PROCESSED,
          lastProcessedAt: new Date(),
        },
      });

      return { received: true };
    } catch (error) {
      this.logger.error(`Error processing webhook ${event.id}:`, error);

      // Calculate next retry time
      const retryAttempt = webhookEvent.processingAttempts;
      const shouldRetry = retryAttempt < this.MAX_WEBHOOK_RETRIES;
      const nextRetryDelay = shouldRetry
        ? this.RETRY_DELAYS[Math.min(retryAttempt, this.RETRY_DELAYS.length - 1)]
        : null;

      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: shouldRetry ? WebhookStatus.PENDING : WebhookStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : String(error),
          nextRetryAt: nextRetryDelay ? new Date(Date.now() + nextRetryDelay * 1000) : null,
        },
      });

      if (!shouldRetry) {
        this.logger.error(`Webhook ${event.id} failed after ${retryAttempt} attempts`);
      }

      throw error;
    }
  }

  /**
   * Retry failed webhooks (called by cron job)
   */
  async retryFailedWebhooks() {
    const failedWebhooks = await this.prisma.webhookEvent.findMany({
      where: {
        status: WebhookStatus.PENDING,
        nextRetryAt: { lte: new Date() },
        processingAttempts: { lt: this.MAX_WEBHOOK_RETRIES },
      },
      take: 10, // Process 10 at a time
    });

    for (const webhook of failedWebhooks) {
      try {
        this.logger.log(
          `Retrying webhook ${webhook.eventId} (attempt ${webhook.processingAttempts + 1})`
        );

        // Reconstruct the event from payload and reprocess
        const event = webhook.payload as any;

        await this.handleWebhook(
          '', // No signature check for retries
          Buffer.from(JSON.stringify(event))
        );
      } catch (error) {
        this.logger.error(`Retry failed for webhook ${webhook.eventId}:`, error);
      }
    }
  }

  /**
   * Retrieve Stripe processing fees from balance transaction
   */
  private async getStripeProcessingFees(
    chargeId: string
  ): Promise<{ feeAmount: Decimal; feePercent: Decimal; feeFixed: Decimal } | null> {
    try {
      const stripe = await this.getStripeClient();

      // Get charge details with expanded balance_transaction
      const charge = await stripe.charges.retrieve(chargeId, {
        expand: ['balance_transaction'],
      });

      if (!charge.balance_transaction || typeof charge.balance_transaction === 'string') {
        this.logger.warn(`No balance transaction found for charge ${chargeId}`);
        return null;
      }

      const balanceTransaction = charge.balance_transaction as Stripe.BalanceTransaction;
      const feeAmount = new Decimal(balanceTransaction.fee).div(100); // Convert cents to currency

      // Calculate percentage and fixed fee (reverse engineer from total)
      const chargeAmount = new Decimal(balanceTransaction.amount).div(100);
      const currency = charge.currency.toUpperCase();

      // Get expected rates from system settings for comparison
      let estimatedPercent: Decimal;
      let estimatedFixed: Decimal;

      try {
        const feePercentageSetting = await this.settingsService.getSetting('stripe_fee_percentage');
        const feeFixedSetting = await this.settingsService.getSetting(
          `stripe_fee_fixed_${currency.toLowerCase()}`
        );

        const percentValue = feePercentageSetting?.value ? Number(feePercentageSetting.value) : 2.9;
        const fixedValue = feeFixedSetting?.value
          ? Number(feeFixedSetting.value)
          : this.getDefaultFixedFee(currency, 'STRIPE');

        estimatedPercent = new Decimal(percentValue).div(100);
        estimatedFixed = new Decimal(fixedValue);
      } catch (error) {
        // Fallback to defaults if settings fail
        estimatedPercent = new Decimal(0.029); // 2.9%
        estimatedFixed = new Decimal(this.getDefaultFixedFee(currency, 'STRIPE'));
      }

      // Verify it matches (approximately)
      const calculatedFee = chargeAmount.mul(estimatedPercent).add(estimatedFixed);

      if (feeAmount.sub(calculatedFee).abs().lessThan(0.05)) {
        // Match! Use standard rates
        return {
          feeAmount,
          feePercent: estimatedPercent,
          feeFixed: estimatedFixed,
        };
      }

      // Different rate structure - calculate from actual
      // fee = amount × percent + fixed, solve for percent
      const feePercent = feeAmount.sub(estimatedFixed).div(chargeAmount);

      return {
        feeAmount,
        feePercent: feePercent.isNegative() ? new Decimal(0) : feePercent,
        feeFixed: estimatedFixed,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve Stripe fees for charge ${chargeId}:`, error.message);
      return null;
    }
  }

  /**
   * Get estimated processing fees when actual data unavailable
   * Fetches fee rates from system settings (configurable by admin)
   */
  private async getEstimatedFees(
    amountInCents: number,
    currency: string,
    paymentMethod: 'STRIPE' | 'PAYPAL' = 'STRIPE'
  ): Promise<{ feeAmount: Decimal; feePercent: Decimal; feeFixed: Decimal }> {
    const amount = new Decimal(amountInCents).div(100);
    const currencyUpper = currency.toUpperCase();

    try {
      // Get fee percentage from settings
      const feePercentageSetting = await this.settingsService.getSetting(
        paymentMethod === 'STRIPE' ? 'stripe_fee_percentage' : 'paypal_fee_percentage'
      );

      const feePercentValue = feePercentageSetting?.value
        ? Number(feePercentageSetting.value)
        : paymentMethod === 'STRIPE'
          ? 2.9
          : 3.49;

      // Get fixed fee with smart fallback
      let feeFixedValue: number;
      let usedFallback = false;

      // Try to get currency-specific fee setting
      const currencyFeeKey =
        paymentMethod === 'STRIPE'
          ? `stripe_fee_fixed_${currencyUpper.toLowerCase()}`
          : `paypal_fee_fixed_${currencyUpper.toLowerCase()}`;

      const feeFixedSetting = await this.settingsService.getSetting(currencyFeeKey);

      if (feeFixedSetting?.value) {
        // Currency-specific fee found
        feeFixedValue = Number(feeFixedSetting.value);
      } else {
        // Smart fallback: Use USD fee and convert to target currency
        const usdFeeKey =
          paymentMethod === 'STRIPE' ? 'stripe_fee_fixed_usd' : 'paypal_fee_fixed_usd';

        const usdFeeSetting = await this.settingsService.getSetting(usdFeeKey);
        const usdFeeValue = usdFeeSetting?.value ? Number(usdFeeSetting.value) : 0.3;

        try {
          // Convert USD fee to target currency
          feeFixedValue = await this.currencyService.convertAmount(
            usdFeeValue,
            'USD',
            currencyUpper
          );
          usedFallback = true;
          this.logger.log(
            `Smart fallback: Converted ${paymentMethod} fee from $${usdFeeValue} USD to ${feeFixedValue} ${currencyUpper}`
          );
        } catch (conversionError) {
          // If conversion fails, use hardcoded default
          this.logger.warn(
            `Currency conversion failed for ${currencyUpper}, using hardcoded default: ${conversionError.message}`
          );
          feeFixedValue = this.getDefaultFixedFee(currencyUpper, paymentMethod);
        }
      }

      const feePercent = new Decimal(feePercentValue).div(100); // Convert 2.9 to 0.029
      const feeFixed = new Decimal(feeFixedValue);
      const feeAmount = amount.mul(feePercent).add(feeFixed);

      this.logger.log(
        `Using ${paymentMethod} fee rates: ${feePercentValue}% + ${feeFixedValue} ${currencyUpper}${usedFallback ? ' (converted from USD)' : ''}`
      );

      return { feeAmount, feePercent, feeFixed };
    } catch (error) {
      this.logger.warn(`Failed to get fee settings, using defaults: ${error.message}`);

      // Fallback to hardcoded defaults if settings fail
      const defaultRates = this.getDefaultFeeRates(currencyUpper, paymentMethod);
      const feePercent = new Decimal(defaultRates.percent);
      const feeFixed = new Decimal(defaultRates.fixed);
      const feeAmount = amount.mul(feePercent).add(feeFixed);

      return { feeAmount, feePercent, feeFixed };
    }
  }

  /**
   * Get default fixed fee for currency and payment method
   */
  private getDefaultFixedFee(currency: string, paymentMethod: 'STRIPE' | 'PAYPAL'): number {
    if (paymentMethod === 'STRIPE') {
      return currency === 'GBP' ? 0.2 : 0.3;
    } else {
      return currency === 'EUR' ? 0.35 : 0.3;
    }
  }

  /**
   * Get default fee rates (fallback when settings unavailable)
   */
  private getDefaultFeeRates(
    currency: string,
    paymentMethod: 'STRIPE' | 'PAYPAL'
  ): { percent: number; fixed: number } {
    const percent = paymentMethod === 'STRIPE' ? 0.029 : 0.0349; // 2.9% or 3.49%
    const fixed = this.getDefaultFixedFee(currency, paymentMethod);
    return { percent, fixed };
  }

  /**
   * Handle successful payment with commission calculation
   */
  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent, webhookEventId?: string) {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      this.logger.warn('Payment succeeded but no order ID in metadata');
      return;
    }

    try {
      // Get processing fees from Stripe
      let processingFees: { feeAmount: Decimal; feePercent: Decimal; feeFixed: Decimal } | null =
        null;

      if (paymentIntent.latest_charge) {
        try {
          const chargeId =
            typeof paymentIntent.latest_charge === 'string'
              ? paymentIntent.latest_charge
              : paymentIntent.latest_charge.id;

          processingFees = await this.getStripeProcessingFees(chargeId);

          if (processingFees) {
            this.logger.log(
              `Retrieved Stripe fees for charge ${chargeId}: ` +
                `${processingFees.feeAmount.toFixed(2)} ${paymentIntent.currency.toUpperCase()} ` +
                `(${processingFees.feePercent.mul(100).toFixed(2)}% + ${processingFees.feeFixed.toFixed(2)})`
            );
          }
        } catch (error) {
          this.logger.warn('Could not retrieve exact Stripe fees, using estimates');
        }
      }

      // Fall back to estimates if actual fees not available
      if (!processingFees) {
        processingFees = await this.getEstimatedFees(
          paymentIntent.amount,
          paymentIntent.currency,
          'STRIPE'
        );
        this.logger.log(
          `Using estimated Stripe fees: ${processingFees.feeAmount.toFixed(2)} ${paymentIntent.currency.toUpperCase()} ` +
            `(will update with actual after charge completes)`
        );
      }

      // Calculate net amount after processing fees
      const grossAmount = new Decimal(paymentIntent.amount).div(100);
      const netAmount = grossAmount.sub(processingFees.feeAmount);

      // Find or create payment transaction
      let transaction = await this.prisma.paymentTransaction.findUnique({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (!transaction) {
        // Create transaction if it doesn't exist (fallback)
        // Both 'succeeded' and 'requires_capture' mean payment was authorized successfully
        // For manual capture (escrow), status moves to CAPTURED later when funds are captured
        transaction = await this.prisma.paymentTransaction.create({
          data: {
            orderId,
            userId: paymentIntent.metadata.userId || '',
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: paymentIntent.latest_charge
              ? (paymentIntent.latest_charge as string)
              : null,
            amount: grossAmount,
            currency: paymentIntent.currency.toUpperCase(),
            status: PaymentTransactionStatus.SUCCEEDED,
            paymentMethod: PaymentMethod.STRIPE,
            // Processing fees
            processingFeeAmount: processingFees.feeAmount,
            processingFeePercent: processingFees.feePercent,
            processingFeeFixed: processingFees.feeFixed,
            netAmount: netAmount,
            metadata: {
              captureMethod: paymentIntent.capture_method,
              paymentIntentStatus: paymentIntent.status,
            } as any,
          },
        });
      } else {
        // Update existing transaction
        transaction = await this.prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: PaymentTransactionStatus.SUCCEEDED,
            stripeChargeId: paymentIntent.latest_charge
              ? (paymentIntent.latest_charge as string)
              : null,
            // Update processing fees
            processingFeeAmount: processingFees.feeAmount,
            processingFeePercent: processingFees.feePercent,
            processingFeeFixed: processingFees.feeFixed,
            netAmount: netAmount,
            metadata: {
              ...(transaction.metadata as any),
              captureMethod: paymentIntent.capture_method,
              paymentIntentStatus: paymentIntent.status,
            } as any,
          },
        });
      }

      // Link webhook to transaction if provided
      if (webhookEventId) {
        await this.prisma.webhookEvent.update({
          where: { id: webhookEventId },
          data: { transactionId: transaction.id },
        });
      }

      // Update order payment status
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paidAt: new Date(),
          status: 'CONFIRMED' as any,
        },
      });

      // Create timeline entry
      await this.prisma.orderTimeline.create({
        data: {
          orderId,
          status: 'CONFIRMED' as any,
          title: 'Payment Confirmed',
          description: 'Your payment has been successfully processed.',
          icon: 'credit-card',
        },
      });

      this.logger.log(`Order ${orderId} payment confirmed (transaction: ${transaction.id})`);

      // Calculate and create commissions
      // Note: This would typically be done in a queue/background job
      // For now, we'll trigger it directly but wrapped in try-catch
      try {
        const { CommissionService } = await import('../commission/commission.service');
        const { EnhancedCommissionService } =
          await import('../commission/enhanced-commission.service');
        const commissionService = new CommissionService(this.prisma, this.settingsService);
        await commissionService.calculateCommissionForTransaction(transaction.id);
        this.logger.log(`Commissions calculated for transaction ${transaction.id}`);
      } catch (commissionError) {
        this.logger.error(
          `Error calculating commissions for transaction ${transaction.id}:`,
          commissionError
        );
        // Don't fail the payment if commission calculation fails
      }

      // Auto-submit Gelato POD items (per-seller basis)
      // Each seller controls their own Gelato integration via SellerGelatoSettings
      // NOTE: This only triggers for CAPTURED payments (payment_intent.succeeded)
      // For UNCAPTURED payments (escrow), Gelato submission happens when order status → PROCESSING
      try {
        const { GelatoService } = await import('../gelato/gelato.service');
        const { GelatoOrdersService } = await import('../gelato/gelato-orders.service');
        const gelatoService = new GelatoService(
          this.prisma,
          this.configService,
          this.settingsService
        );
        await gelatoService.onModuleInit();
        const gelatoOrdersService = new GelatoOrdersService(
          this.prisma,
          gelatoService,
          this.settingsService
        );

        // Submit POD items - only for sellers with Gelato enabled
        const result = await gelatoOrdersService.submitAllPodItems(orderId);
        if (result.submitted > 0) {
          this.logger.log(
            `Gelato POD items submitted for order ${orderId}: ${result.submitted}/${result.results.length} items`
          );
        } else if (result.results.length > 0) {
          this.logger.warn(
            `No Gelato POD items submitted for order ${orderId} - sellers may not have Gelato enabled`
          );
        }
      } catch (gelatoError) {
        this.logger.error(`Gelato POD submission failed for order ${orderId}:`, gelatoError);
        // Don't fail the payment if Gelato submission fails
      }

      // Create Escrow Transaction (DEFAULT PAYMENT MODEL)
      // Funds are held until delivery confirmation
      // Check system settings for escrow configuration
      const escrowEnabled = await this.isEscrowEnabled();
      const immediatePayoutEnabled = await this.isImmediatePayoutEnabled();
      const holdPeriodDays = await this.getEscrowHoldPeriodDays();

      if (!escrowEnabled) {
        this.logger.warn(
          `Escrow is disabled in system settings. Payment processed without escrow for order ${orderId}`
        );
      }

      if (escrowEnabled && !immediatePayoutEnabled) {
        try {
          const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
              items: {
                include: {
                  product: {
                    include: {
                      store: true,
                    },
                  },
                },
              },
            },
          });

          if (order && order.items.length > 0) {
            // For multi-vendor orders, create escrow per seller
            const sellerOrders = new Map<string, any>();

            for (const item of order.items) {
              if (item.product.store) {
                const sellerId = item.product.store.userId;
                if (!sellerOrders.has(sellerId)) {
                  sellerOrders.set(sellerId, {
                    sellerId,
                    storeId: item.product.storeId!,
                    totalAmount: 0,
                    platformFee: 0,
                  });
                }
                const sellerOrder = sellerOrders.get(sellerId)!;
                sellerOrder.totalAmount += Number(item.total);
              }
            }

            // Calculate platform fee from commissions
            const commissions = await this.prisma.commission.findMany({
              where: { transactionId: transaction.id },
            });

            const totalPlatformFee = commissions.reduce(
              (sum, c) => sum + Number(c.commissionAmount),
              0
            );

            // Create escrow transaction with hold period from settings
            if (sellerOrders.size === 1) {
              // Single seller order
              const sellerOrder = Array.from(sellerOrders.values())[0];
              const { EscrowService } = await import('../escrow/escrow.service');
              const escrowService = new EscrowService(this.prisma, this.settingsService);

              await escrowService.createEscrowTransaction({
                orderId,
                paymentTransactionId: transaction.id,
                sellerId: sellerOrder.sellerId,
                storeId: sellerOrder.storeId,
                totalAmount: Number(transaction.amount),
                platformFee: totalPlatformFee,
                currency: transaction.currency,
                holdPeriodDays, // Use hold period from system settings
              });

              this.logger.log(
                `Escrow created for order ${orderId}: ${transaction.amount} ${transaction.currency} (platform fee: ${totalPlatformFee}, hold period: ${holdPeriodDays} days)`
              );
            } else {
              // Multi-vendor order - create escrow with split allocations
              const { EscrowService } = await import('../escrow/escrow.service');
              const escrowService = new EscrowService(this.prisma, this.settingsService);

              // Build split items with commission data
              const splitItems = [];

              for (const item of order.items) {
                if (item.product.store) {
                  // Find commission for this specific item
                  const itemCommission = commissions.find((c) => c.orderItemId === item.id);

                  splitItems.push({
                    orderItemId: item.id,
                    sellerId: item.product.store.userId,
                    storeId: item.product.storeId!,
                    amount: Number(item.total),
                    platformFee: itemCommission ? Number(itemCommission.commissionAmount) : 0,
                  });
                }
              }

              if (splitItems.length > 0) {
                await escrowService.createEscrowWithSplits({
                  orderId,
                  paymentTransactionId: transaction.id,
                  currency: transaction.currency,
                  holdPeriodDays,
                  items: splitItems,
                });

                this.logger.log(
                  `Multi-vendor escrow created for order ${orderId}: ${splitItems.length} sellers, ${sellerOrders.size} stores (hold period: ${holdPeriodDays} days)`
                );
              } else {
                this.logger.warn(`No split items found for multi-vendor order ${orderId}`);
              }
            }
          }
        } catch (escrowError) {
          this.logger.error(
            `Error creating escrow for transaction ${transaction.id}:`,
            escrowError
          );
          // Don't fail the payment if escrow creation fails
        }
      } else if (immediatePayoutEnabled) {
        this.logger.warn(
          `IMMEDIATE PAYOUT MODE ENABLED: Funds will be paid to seller immediately for order ${orderId}. This should only be used for testing or trusted sellers!`
        );
        // In immediate payout mode, funds would be transferred immediately
        // This requires additional payout service integration
      }

      // Generate and send invoice email with PDF attachment
      try {
        const order = await this.prisma.order.findUnique({
          where: { id: orderId },
          include: {
            user: true,
            items: {
              include: {
                product: { include: { store: true } },
                variant: true,
              },
            },
            shippingAddress: true,
            billingAddress: true,
          },
        });

        if (order && order.user) {
          // Import services needed for email
          const { EmailService } = await import('../email/email.service');
          const emailService = new EmailService();

          // Import OrdersService to generate invoice PDF
          const { OrdersService } = await import('../orders/orders.service');
          // Create a minimal instance just for PDF generation
          // We'll pass null for services not needed for PDF generation
          const ordersServiceModule = await import('../orders/orders.service');
          const ordersService = new ordersServiceModule.OrdersService(
            this.prisma,
            this.currencyService,
            null as any, // emailService not needed for PDF generation
            null as any, // shippingTaxService not needed for PDF generation
            null as any, // cartService not needed for PDF generation
            this,
            null as any // gelatoOrdersService not needed for PDF generation
          );

          const invoicePdf = await ordersService.generateInvoicePdf(orderId, order.userId);

          await emailService.sendPaymentConfirmationWithInvoice(order.user.email, {
            orderNumber: order.orderNumber,
            customerName:
              `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Customer',
            total: Number(order.total),
            currency: order.currency,
            paidAt: new Date(),
            invoicePdf,
          });

          this.logger.log(
            `Invoice email sent for order ${order.orderNumber} to ${order.user.email}`
          );
        }
      } catch (emailError) {
        this.logger.error(`Failed to send invoice email for order ${orderId}:`, emailError);
        // Don't fail the payment if invoice email fails
      }

      // TODO: Trigger inventory reservation
    } catch (error) {
      this.logger.error(`Error processing payment success for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Handle payment processing state
   */
  private async handlePaymentProcessing(
    paymentIntent: Stripe.PaymentIntent,
    webhookEventId?: string
  ) {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      return;
    }

    try {
      // Update transaction status
      await this.prisma.paymentTransaction.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: {
          status: PaymentTransactionStatus.PROCESSING,
        },
      });

      this.logger.log(`Payment processing for order ${orderId}`);
    } catch (error) {
      this.logger.error(`Error updating payment processing status for order ${orderId}:`, error);
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent, webhookEventId?: string) {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      return;
    }

    try {
      // Update transaction status
      await this.prisma.paymentTransaction.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: {
          status: PaymentTransactionStatus.FAILED,
          failureCode: paymentIntent.last_payment_error?.code,
          failureReason: paymentIntent.last_payment_error?.message,
        },
      });

      // Update order payment status
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.FAILED,
        },
      });

      this.logger.log(`Order ${orderId} payment failed`);

      // TODO: Send payment failed notification email
    } catch (error) {
      this.logger.error(`Error updating failed payment for order ${orderId}:`, error);
    }
  }

  /**
   * Handle refund with commission cancellation
   */
  private async handleRefund(charge: Stripe.Charge, webhookEventId?: string) {
    try {
      // Find transaction by charge ID
      const transaction = await this.prisma.paymentTransaction.findFirst({
        where: { stripeChargeId: charge.id },
        include: { order: true },
      });

      if (!transaction) {
        this.logger.warn(`No transaction found for charge ${charge.id}`);
        return;
      }

      const refundAmount = new Decimal((charge.amount_refunded || 0) / 100);
      const isFullRefund = charge.refunded;

      // Update transaction
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: isFullRefund
            ? PaymentTransactionStatus.REFUNDED
            : PaymentTransactionStatus.PARTIALLY_REFUNDED,
          refundedAmount: refundAmount,
          refundedAt: new Date(),
        },
      });

      // Update order status
      await this.prisma.order.update({
        where: { id: transaction.orderId },
        data: {
          paymentStatus: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
          status: isFullRefund ? 'REFUNDED' : transaction.order.status,
        },
      });

      // Cancel associated commissions
      try {
        const { CommissionService } = await import('../commission/commission.service');
        const commissionService = new CommissionService(this.prisma, this.settingsService);
        await commissionService.cancelCommissionsForOrder(transaction.orderId);
        this.logger.log(`Cancelled commissions for refunded order ${transaction.orderId}`);
      } catch (commissionError) {
        this.logger.error(
          `Error cancelling commissions for order ${transaction.orderId}:`,
          commissionError
        );
      }

      this.logger.log(`Refund processed for charge ${charge.id}: ${refundAmount}`);

      // TODO: Send refund confirmation email
      // TODO: Restore inventory
    } catch (error) {
      this.logger.error(`Error processing refund for charge ${charge.id}:`, error);
      throw error;
    }
  }

  /**
   * Handle payment intent canceled
   */
  private async handlePaymentCanceled(
    paymentIntent: Stripe.PaymentIntent,
    webhookEventId?: string
  ) {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      this.logger.warn('Payment canceled but no order ID in metadata');
      return;
    }

    try {
      // Update transaction status
      await this.prisma.paymentTransaction.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: {
          status: PaymentTransactionStatus.CANCELLED,
        },
      });

      // Update order payment status
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.CANCELLED,
        },
      });

      // Create timeline entry
      await this.prisma.orderTimeline.create({
        data: {
          orderId,
          status: 'CANCELLED' as any,
          title: 'Payment Canceled',
          description: 'Payment was canceled before completion.',
          icon: 'x-circle',
        },
      });

      this.logger.log(`Order ${orderId} payment canceled`);

      // TODO: Send payment canceled notification email
    } catch (error) {
      this.logger.error(`Error handling payment cancellation for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Handle payment requires action (e.g., 3D Secure authentication)
   */
  private async handlePaymentRequiresAction(
    paymentIntent: Stripe.PaymentIntent,
    webhookEventId?: string
  ) {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      return;
    }

    try {
      // Update transaction status
      await this.prisma.paymentTransaction.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: {
          status: PaymentTransactionStatus.REQUIRES_ACTION,
        },
      });

      this.logger.log(`Order ${orderId} payment requires action (e.g., 3D Secure)`);

      // TODO: Send customer action required email with payment link
    } catch (error) {
      this.logger.error(`Error handling payment requires action for order ${orderId}:`, error);
    }
  }

  /**
   * Handle amount capturable updated
   * Important for manual capture (escrow) scenarios
   * This event fires when payment is authorized but not yet captured
   */
  private async handleAmountCapturableUpdated(
    paymentIntent: Stripe.PaymentIntent,
    webhookEventId?: string
  ) {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      return;
    }

    try {
      const amountCapturable = new Decimal(paymentIntent.amount_capturable / 100);

      this.logger.log(
        `Order ${orderId} amount capturable updated: ${amountCapturable} ${paymentIntent.currency.toUpperCase()}`
      );

      // For manual capture, this means payment was authorized successfully
      // Treat it the same as payment success for order confirmation
      if (paymentIntent.status === 'requires_capture' && amountCapturable.toNumber() > 0) {
        this.logger.log(
          `Payment authorized (requires_capture) for order ${orderId}. Processing as successful authorization.`
        );

        // Call the payment success handler to update order and create escrow
        await this.handlePaymentSuccess(paymentIntent, webhookEventId);
        return;
      }

      // Update transaction metadata if needed
      await this.prisma.paymentTransaction.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: {
          metadata: {
            amountCapturable: amountCapturable.toString(),
            captureMethod: paymentIntent.capture_method,
          } as any,
        },
      });
    } catch (error) {
      this.logger.error(`Error handling amount capturable update for order ${orderId}:`, error);
    }
  }

  /**
   * Handle charge succeeded
   * Backup handler for direct charge events (usually payment_intent.succeeded is used)
   */
  private async handleChargeSucceeded(charge: Stripe.Charge, webhookEventId?: string) {
    try {
      // Check if we already handled this via payment_intent.succeeded
      const transaction = await this.prisma.paymentTransaction.findFirst({
        where: { stripeChargeId: charge.id },
      });

      if (transaction && transaction.status === PaymentTransactionStatus.SUCCEEDED) {
        this.logger.log(`Charge ${charge.id} already processed via payment_intent.succeeded`);
        return;
      }

      // If payment intent exists in metadata, let payment_intent.succeeded handle it
      if (charge.payment_intent) {
        this.logger.log(
          `Charge ${charge.id} has payment intent, skipping (will be handled by payment_intent event)`
        );
        return;
      }

      this.logger.log(`Direct charge succeeded: ${charge.id}`);

      // Handle direct charges without payment intents (rare in current implementation)
      // This is a safety net for older payment flows
    } catch (error) {
      this.logger.error(`Error handling charge succeeded ${charge.id}:`, error);
    }
  }

  /**
   * Handle charge failed
   */
  private async handleChargeFailed(charge: Stripe.Charge, webhookEventId?: string) {
    try {
      // Find transaction by charge ID
      const transaction = await this.prisma.paymentTransaction.findFirst({
        where: { stripeChargeId: charge.id },
      });

      if (transaction) {
        await this.prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: PaymentTransactionStatus.FAILED,
            failureCode: charge.failure_code,
            failureReason: charge.failure_message,
          },
        });

        this.logger.log(`Charge ${charge.id} failed: ${charge.failure_message}`);
      }
    } catch (error) {
      this.logger.error(`Error handling charge failed ${charge.id}:`, error);
    }
  }

  /**
   * Handle charge captured
   * Critical for escrow system with manual capture
   */
  private async handleChargeCaptured(charge: Stripe.Charge, webhookEventId?: string) {
    try {
      // Find transaction by charge ID or payment intent
      const transaction = await this.prisma.paymentTransaction.findFirst({
        where: {
          OR: [
            { stripeChargeId: charge.id },
            { stripePaymentIntentId: charge.payment_intent as string },
          ],
        },
      });

      if (!transaction) {
        this.logger.warn(`No transaction found for captured charge ${charge.id}`);
        return;
      }

      // Update transaction to captured status
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentTransactionStatus.CAPTURED,
          stripeChargeId: charge.id,
          metadata: {
            ...(transaction.metadata as any),
            capturedAt: new Date().toISOString(),
            amountCaptured: (charge.amount_captured / 100).toString(),
          } as any,
        },
      });

      this.logger.log(
        `Charge ${charge.id} captured for order ${transaction.orderId}: ${charge.amount_captured / 100} ${charge.currency.toUpperCase()}`
      );

      // Create timeline entry
      await this.prisma.orderTimeline.create({
        data: {
          orderId: transaction.orderId,
          status: 'CONFIRMED' as any,
          title: 'Payment Captured',
          description: 'Funds have been captured and will be transferred to seller after delivery.',
          icon: 'dollar-sign',
        },
      });

      // If escrow exists, update escrow status
      const escrowTransaction = await this.prisma.escrowTransaction.findFirst({
        where: { paymentTransactionId: transaction.id },
      });

      if (escrowTransaction) {
        await this.prisma.escrowTransaction.update({
          where: { id: escrowTransaction.id },
          data: {
            metadata: {
              ...(escrowTransaction.metadata as any),
              chargeCaptured: true,
              capturedAt: new Date().toISOString(),
            } as any,
          },
        });

        this.logger.log(`Escrow transaction ${escrowTransaction.id} updated with capture info`);
      }

      // TODO: Notify seller that payment has been captured
    } catch (error) {
      this.logger.error(`Error handling charge captured ${charge.id}:`, error);
      throw error;
    }
  }

  /**
   * Handle refund created
   */
  private async handleRefundCreated(refund: Stripe.Refund, webhookEventId?: string) {
    try {
      this.logger.log(
        `Refund created: ${refund.id} for charge ${refund.charge} - Amount: ${refund.amount / 100} ${refund.currency.toUpperCase()}`
      );

      // Find transaction by charge ID
      const transaction = await this.prisma.paymentTransaction.findFirst({
        where: { stripeChargeId: refund.charge as string },
      });

      if (transaction) {
        // Update transaction metadata with refund info
        await this.prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            metadata: {
              ...(transaction.metadata as any),
              refunds: [
                ...((transaction.metadata as any)?.refunds || []),
                {
                  id: refund.id,
                  amount: refund.amount / 100,
                  status: refund.status,
                  reason: refund.reason,
                  createdAt: new Date(refund.created * 1000).toISOString(),
                },
              ],
            } as any,
          },
        });

        this.logger.log(`Transaction ${transaction.id} updated with refund ${refund.id} info`);
      }
    } catch (error) {
      this.logger.error(`Error handling refund created ${refund.id}:`, error);
    }
  }

  /**
   * Handle refund updated
   */
  private async handleRefundUpdated(refund: Stripe.Refund, webhookEventId?: string) {
    try {
      this.logger.log(`Refund updated: ${refund.id} - Status: ${refund.status}`);

      // Find transaction and update refund status in metadata
      const transaction = await this.prisma.paymentTransaction.findFirst({
        where: { stripeChargeId: refund.charge as string },
      });

      if (transaction && transaction.metadata) {
        const metadata = transaction.metadata as any;
        const refunds = metadata.refunds || [];
        const refundIndex = refunds.findIndex((r: any) => r.id === refund.id);

        if (refundIndex !== -1) {
          refunds[refundIndex].status = refund.status;
          refunds[refundIndex].updatedAt = new Date().toISOString();

          await this.prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: {
              metadata: {
                ...metadata,
                refunds,
              } as any,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error handling refund updated ${refund.id}:`, error);
    }
  }

  /**
   * Handle refund failed
   */
  private async handleRefundFailed(refund: Stripe.Refund, webhookEventId?: string) {
    try {
      this.logger.error(
        `Refund failed: ${refund.id} for charge ${refund.charge} - Reason: ${refund.failure_reason}`
      );

      // Find transaction
      const transaction = await this.prisma.paymentTransaction.findFirst({
        where: { stripeChargeId: refund.charge as string },
      });

      if (transaction) {
        // Update transaction metadata with refund failure
        await this.prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            metadata: {
              ...(transaction.metadata as any),
              failedRefunds: [
                ...((transaction.metadata as any)?.failedRefunds || []),
                {
                  id: refund.id,
                  amount: refund.amount / 100,
                  failureReason: refund.failure_reason,
                  failedAt: new Date().toISOString(),
                },
              ],
            } as any,
          },
        });

        this.logger.log(`Transaction ${transaction.id} updated with refund failure info`);

        // TODO: Alert admin about failed refund
        // TODO: Send notification to customer service
      }
    } catch (error) {
      this.logger.error(`Error handling refund failed ${refund.id}:`, error);
    }
  }

  /**
   * Handle dispute created (chargeback)
   */
  private async handleDisputeCreated(dispute: Stripe.Dispute, webhookEventId?: string) {
    try {
      this.logger.warn(
        `Dispute created: ${dispute.id} for charge ${dispute.charge} - Amount: ${dispute.amount / 100} ${dispute.currency.toUpperCase()} - Reason: ${dispute.reason}`
      );

      // Find transaction by charge ID
      const transaction = await this.prisma.paymentTransaction.findFirst({
        where: { stripeChargeId: dispute.charge as string },
        include: { order: true },
      });

      if (!transaction) {
        this.logger.warn(`No transaction found for dispute ${dispute.id}`);
        return;
      }

      // Update transaction status
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentTransactionStatus.DISPUTED,
          metadata: {
            ...(transaction.metadata as any),
            dispute: {
              id: dispute.id,
              amount: dispute.amount / 100,
              reason: dispute.reason,
              status: dispute.status,
              evidenceDueBy: dispute.evidence_details?.due_by
                ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
                : null,
              createdAt: new Date(dispute.created * 1000).toISOString(),
            },
          } as any,
        },
      });

      // Update order status
      await this.prisma.order.update({
        where: { id: transaction.orderId },
        data: {
          paymentStatus: PaymentStatus.DISPUTED,
        },
      });

      // Create timeline entry
      await this.prisma.orderTimeline.create({
        data: {
          orderId: transaction.orderId,
          status: transaction.order.status,
          title: 'Payment Disputed',
          description: `Customer has disputed this payment. Reason: ${dispute.reason}`,
          icon: 'alert-triangle',
        },
      });

      this.logger.log(`Order ${transaction.orderId} marked as disputed`);

      // TODO: Alert admin immediately about dispute
      // TODO: Gather evidence for dispute response
      // TODO: Notify seller about dispute
    } catch (error) {
      this.logger.error(`Error handling dispute created ${dispute.id}:`, error);
      throw error;
    }
  }

  /**
   * Handle dispute updated
   */
  private async handleDisputeUpdated(dispute: Stripe.Dispute, webhookEventId?: string) {
    try {
      this.logger.log(`Dispute updated: ${dispute.id} - Status: ${dispute.status}`);

      // Find transaction and update dispute info
      const transaction = await this.prisma.paymentTransaction.findFirst({
        where: { stripeChargeId: dispute.charge as string },
      });

      if (transaction && transaction.metadata) {
        await this.prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            metadata: {
              ...(transaction.metadata as any),
              dispute: {
                ...((transaction.metadata as any).dispute || {}),
                status: dispute.status,
                updatedAt: new Date().toISOString(),
              },
            } as any,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error handling dispute updated ${dispute.id}:`, error);
    }
  }

  /**
   * Handle dispute closed
   */
  private async handleDisputeClosed(dispute: Stripe.Dispute, webhookEventId?: string) {
    try {
      this.logger.log(`Dispute closed: ${dispute.id} - Status: ${dispute.status}`);

      // Find transaction
      const transaction = await this.prisma.paymentTransaction.findFirst({
        where: { stripeChargeId: dispute.charge as string },
      });

      if (!transaction) {
        return;
      }

      const isWon = dispute.status === 'won';

      // Update transaction status
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: isWon
            ? PaymentTransactionStatus.SUCCEEDED
            : PaymentTransactionStatus.LOST_DISPUTE,
          metadata: {
            ...(transaction.metadata as any),
            dispute: {
              ...((transaction.metadata as any).dispute || {}),
              status: dispute.status,
              closedAt: new Date().toISOString(),
            },
          } as any,
        },
      });

      // Update order status
      await this.prisma.order.update({
        where: { id: transaction.orderId },
        data: {
          paymentStatus: isWon ? PaymentStatus.PAID : PaymentStatus.REFUNDED,
        },
      });

      // Create timeline entry
      await this.prisma.orderTimeline.create({
        data: {
          orderId: transaction.orderId,
          status: isWon ? 'CONFIRMED' : 'REFUNDED',
          title: isWon ? 'Dispute Won' : 'Dispute Lost',
          description: isWon
            ? 'Payment dispute resolved in your favor.'
            : 'Payment dispute was lost. Funds have been returned to customer.',
          icon: isWon ? 'check-circle' : 'x-circle',
        },
      });

      this.logger.log(`Order ${transaction.orderId} dispute closed: ${isWon ? 'WON' : 'LOST'}`);

      // TODO: Send dispute resolution notification
    } catch (error) {
      this.logger.error(`Error handling dispute closed ${dispute.id}:`, error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        paymentMethod: true,
        paidAt: true,
        total: true,
      },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    return order;
  }

  /**
   * Create a refund with Stripe and restore inventory
   */
  async createRefund(orderId: string, amount?: number, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (
      order.paymentStatus !== PaymentStatus.PAID &&
      order.paymentStatus !== PaymentStatus.PARTIALLY_REFUNDED
    ) {
      throw new BadRequestException('Order has not been paid or is already fully refunded');
    }

    // Find the payment transaction
    const transaction = await this.prisma.paymentTransaction.findFirst({
      where: {
        orderId,
        status: {
          in: [PaymentTransactionStatus.SUCCEEDED, PaymentTransactionStatus.PARTIALLY_REFUNDED],
        },
      },
    });

    if (!transaction) {
      throw new BadRequestException('No payment transaction found for this order');
    }

    if (!transaction.stripePaymentIntentId) {
      throw new BadRequestException('No Stripe payment intent found');
    }

    try {
      // Calculate refund amount (in cents for Stripe)
      const maxRefundable = Number(transaction.amount) - Number(transaction.refundedAmount || 0);
      const refundAmount = amount ? Math.min(amount, maxRefundable) : maxRefundable;
      const amountInCents = Math.round(refundAmount * 100);

      if (amountInCents <= 0) {
        throw new BadRequestException('Invalid refund amount');
      }

      // Create Stripe refund
      const refund = await this.stripe.refunds.create({
        payment_intent: transaction.stripePaymentIntentId,
        amount: amountInCents,
        reason:
          reason === 'duplicate'
            ? 'duplicate'
            : reason === 'fraudulent'
              ? 'fraudulent'
              : 'requested_by_customer',
        metadata: {
          orderId,
          refundedBy: 'admin',
        },
      });

      const isFullRefund = refundAmount >= maxRefundable;

      // Update payment transaction
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: isFullRefund
            ? PaymentTransactionStatus.REFUNDED
            : PaymentTransactionStatus.PARTIALLY_REFUNDED,
          refundedAmount: new Decimal(Number(transaction.refundedAmount || 0) + refundAmount),
          refundedAt: new Date(),
        },
      });

      // Update order status
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
          status: isFullRefund ? 'REFUNDED' : order.status,
        },
      });

      // Create timeline entry
      await this.prisma.orderTimeline.create({
        data: {
          orderId,
          status: isFullRefund ? 'REFUNDED' : order.status,
          title: isFullRefund ? 'Order Refunded' : 'Partial Refund Processed',
          description: `Refund of $${refundAmount.toFixed(2)} has been processed.`,
          icon: 'undo',
        },
      });

      // Restore inventory for full refunds
      if (isFullRefund) {
        const { InventoryService } = await import('../inventory/inventory.service');
        const inventoryService = new InventoryService(this.prisma);

        for (const item of order.items) {
          try {
            await inventoryService.recordTransaction({
              productId: item.productId,
              variantId: item.variantId || undefined,
              type: 'RETURN' as any,
              quantity: item.quantity, // Positive to add back
              orderId,
              reason: 'refund',
              notes: `Inventory restored due to order refund`,
            });
          } catch (invError) {
            this.logger.error(`Error restoring inventory for product ${item.productId}:`, invError);
          }
        }
      }

      // Cancel commissions for full refunds
      if (isFullRefund) {
        try {
          const { CommissionService } = await import('../commission/commission.service');
          const commissionService = new CommissionService(this.prisma, this.settingsService);
          await commissionService.cancelCommissionsForOrder(orderId);
        } catch (commissionError) {
          this.logger.error(`Error cancelling commissions for order ${orderId}:`, commissionError);
        }
      }

      this.logger.log(
        `Refund created for order ${orderId}: $${refundAmount.toFixed(2)} (Stripe: ${refund.id})`
      );

      return {
        success: true,
        refundId: refund.id,
        amount: refundAmount,
        isFullRefund,
        message: isFullRefund
          ? 'Full refund processed successfully'
          : 'Partial refund processed successfully',
      };
    } catch (error) {
      this.logger.error(`Error creating refund for order ${orderId}:`, error);

      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Stripe error: ${error.message}`);
      }

      throw error;
    }
  }

  /**
   * Get transaction history for an order
   */
  async getTransactionHistory(orderId: string) {
    return this.prisma.paymentTransaction.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get webhook event statistics for monitoring
   */
  async getWebhookStatistics(days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [totalEvents, statusCounts, eventTypeCounts, recentFailures, pendingRetries] =
      await Promise.all([
        // Total webhook events
        this.prisma.webhookEvent.count({
          where: { createdAt: { gte: since } },
        }),

        // Count by status
        this.prisma.webhookEvent.groupBy({
          by: ['status'],
          where: { createdAt: { gte: since } },
          _count: true,
        }),

        // Count by event type (top 10)
        this.prisma.webhookEvent.groupBy({
          by: ['eventType'],
          where: { createdAt: { gte: since } },
          _count: true,
          orderBy: { _count: { eventType: 'desc' } },
          take: 10,
        }),

        // Recent failures
        this.prisma.webhookEvent.findMany({
          where: {
            status: WebhookStatus.FAILED,
            createdAt: { gte: since },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            eventId: true,
            eventType: true,
            errorMessage: true,
            processingAttempts: true,
            createdAt: true,
          },
        }),

        // Pending retries
        this.prisma.webhookEvent.count({
          where: {
            status: WebhookStatus.PENDING,
            nextRetryAt: { lte: new Date() },
          },
        }),
      ]);

    return {
      period: { days, since },
      totalEvents,
      statusBreakdown: statusCounts.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      topEventTypes: eventTypeCounts.map((item) => ({
        eventType: item.eventType,
        count: item._count,
      })),
      recentFailures,
      pendingRetries,
      successRate:
        totalEvents > 0
          ? (
              ((statusCounts.find((s) => s.status === WebhookStatus.PROCESSED)?._count || 0) /
                totalEvents) *
              100
            ).toFixed(2)
          : '0.00',
    };
  }

  /**
   * Get webhook event details by ID (Admin)
   */
  async getWebhookEvent(id: string) {
    return this.prisma.webhookEvent.findUnique({
      where: { id },
      include: {
        transaction: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                status: true,
                paymentStatus: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get recent webhook events with pagination (Admin)
   */
  async getWebhookEvents(
    options: {
      page?: number;
      limit?: number;
      status?: WebhookStatus;
      eventType?: string;
    } = {}
  ) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.status) where.status = options.status;
    if (options.eventType) where.eventType = options.eventType;

    const [events, total] = await Promise.all([
      this.prisma.webhookEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          eventId: true,
          provider: true,
          eventType: true,
          status: true,
          processingAttempts: true,
          errorMessage: true,
          nextRetryAt: true,
          createdAt: true,
          lastProcessedAt: true,
        },
      }),
      this.prisma.webhookEvent.count({ where }),
    ]);

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Manually retry a failed webhook event (Admin)
   */
  async retryWebhookEvent(eventId: string) {
    const webhook = await this.prisma.webhookEvent.findUnique({
      where: { id: eventId },
    });

    if (!webhook) {
      throw new BadRequestException('Webhook event not found');
    }

    if (webhook.status === WebhookStatus.PROCESSED) {
      throw new BadRequestException('Webhook event already processed successfully');
    }

    // Update status to pending and clear next retry time
    await this.prisma.webhookEvent.update({
      where: { id: eventId },
      data: {
        status: WebhookStatus.PENDING,
        nextRetryAt: new Date(),
        errorMessage: null,
      },
    });

    // Trigger retry
    await this.retryFailedWebhooks();

    return { success: true, message: 'Webhook event queued for retry' };
  }

  /**
   * Get supported payment currencies with details
   */
  async getSupportedPaymentCurrencies() {
    // Get system supported currencies
    const systemCurrencies = await this.currencyService.getSupportedCurrencies();

    // Filter to only include Stripe-supported currencies
    const supportedCurrencies = systemCurrencies.filter((code) =>
      this.STRIPE_SUPPORTED_CURRENCIES.includes(code.toUpperCase())
    );

    // Get full details for each currency
    const currencyDetails = await Promise.all(
      supportedCurrencies.map(async (code) => {
        try {
          const details = await this.currencyService.getRateByCode(code);
          return {
            code: details.currencyCode,
            name: details.currencyName,
            symbol: details.symbol,
            rate: Number(details.rate),
            decimalDigits: details.decimalDigits,
            position: details.position,
            isActive: details.isActive,
          };
        } catch (error) {
          this.logger.warn(`Failed to get details for currency ${code}: ${error.message}`);
          return null;
        }
      })
    );

    // Filter out nulls and return
    return currencyDetails.filter((c): c is NonNullable<typeof c> => c !== null);
  }

  // ==========================================
  // PAYMENT METHODS MANAGEMENT
  // ==========================================

  /**
   * Get or create a Stripe customer for a user
   */
  async getOrCreateStripeCustomer(userId: string): Promise<string> {
    const stripe = await this.getStripeClient();

    // Get user from database
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // If user already has a Stripe customer ID, verify it exists
    if (user.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        if (!customer.deleted) {
          return user.stripeCustomerId;
        }
      } catch (error) {
        this.logger.warn(`Stripe customer ${user.stripeCustomerId} not found, creating new one`);
      }
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
      metadata: {
        userId: user.id,
      },
    });

    // Save customer ID to user
    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    this.logger.log(`Created Stripe customer ${customer.id} for user ${userId}`);

    return customer.id;
  }

  /**
   * Create a SetupIntent for adding a new payment method
   */
  async createSetupIntent(userId: string) {
    const stripe = await this.getStripeClient();
    const customerId = await this.getOrCreateStripeCustomer(userId);

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: {
        userId,
      },
    });

    // Get publishable key for frontend
    const config = await this.settingsService.getStripeConfig();
    const publishableKey =
      config.publishableKey || this.configService.get<string>('STRIPE_PUBLISHABLE_KEY') || '';

    this.logger.log(`Created SetupIntent ${setupIntent.id} for user ${userId}`);

    return {
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      publishableKey,
    };
  }

  /**
   * List saved payment methods for a user with enhanced data
   */
  async listPaymentMethods(userId: string) {
    const stripe = await this.getStripeClient();

    // Get user with stripe customer ID
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return { paymentMethods: [], defaultPaymentMethodId: null };
    }

    // Get customer to find default payment method
    let defaultPaymentMethodId: string | null = null;
    try {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      // Type guard: check if customer is not deleted
      if (!('deleted' in customer && customer.deleted)) {
        const activeCustomer = customer as Stripe.Customer;
        if (activeCustomer.invoice_settings?.default_payment_method) {
          defaultPaymentMethodId = activeCustomer.invoice_settings.default_payment_method as string;
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to get customer ${user.stripeCustomerId}:`, error);
    }

    // List payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });

    // Get saved payment method details from our database for enhanced info
    const savedMethods = await this.prisma.savedPaymentMethod.findMany({
      where: { userId },
    });

    return {
      paymentMethods: paymentMethods.data.map((pm) => {
        const savedMethod = savedMethods.find((sm) => sm.stripePaymentMethodId === pm.id);
        return {
          id: pm.id,
          brand: pm.card?.brand || 'unknown',
          last4: pm.card?.last4 || '****',
          expMonth: pm.card?.exp_month,
          expYear: pm.card?.exp_year,
          isDefault: pm.id === defaultPaymentMethodId,
          funding: pm.card?.funding,
          country: pm.card?.country,
          // Enhanced data from our database
          nickname: savedMethod?.nickname,
          lastUsedAt: savedMethod?.lastUsedAt,
          usageCount: savedMethod?.usageCount || 0,
        };
      }),
      defaultPaymentMethodId,
    };
  }

  /**
   * Save payment method after successful payment
   * Called when user checks "Save card for future purchases"
   */
  async savePaymentMethodAfterPayment(paymentIntentId: string, userId: string, nickname?: string) {
    try {
      const stripe = await this.getStripeClient();

      // Get the payment intent to extract the payment method
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (!paymentIntent.payment_method) {
        throw new BadRequestException('No payment method found on payment intent');
      }

      const paymentMethodId =
        typeof paymentIntent.payment_method === 'string'
          ? paymentIntent.payment_method
          : paymentIntent.payment_method.id;

      // Get or create customer
      const customerId = await this.getOrCreateStripeCustomer(userId);

      // Attach payment method to customer (if not already attached)
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

      if (paymentMethod.customer !== customerId) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });
        this.logger.log(`Attached payment method ${paymentMethodId} to customer ${customerId}`);
      }

      // Check if we already have this payment method saved in our database
      const existing = await this.prisma.savedPaymentMethod.findUnique({
        where: { stripePaymentMethodId: paymentMethodId },
      });

      if (existing) {
        // Update usage stats
        await this.prisma.savedPaymentMethod.update({
          where: { id: existing.id },
          data: {
            lastUsedAt: new Date(),
            usageCount: { increment: 1 },
            nickname: nickname || existing.nickname,
          },
        });
        this.logger.log(`Updated existing saved payment method ${paymentMethodId}`);
        return { success: true, message: 'Card already saved', paymentMethodId };
      }

      // Create new saved payment method record
      await this.prisma.savedPaymentMethod.create({
        data: {
          userId,
          stripePaymentMethodId: paymentMethodId,
          brand: paymentMethod.card?.brand || 'unknown',
          last4: paymentMethod.card?.last4 || '****',
          expMonth: paymentMethod.card?.exp_month || 12,
          expYear: paymentMethod.card?.exp_year || new Date().getFullYear(),
          funding: paymentMethod.card?.funding,
          country: paymentMethod.card?.country,
          nickname,
          lastUsedAt: new Date(),
          usageCount: 1,
          isDefault: false, // User can set as default later
        },
      });

      this.logger.log(`Saved new payment method ${paymentMethodId} for user ${userId}`);

      return {
        success: true,
        message: 'Card saved successfully',
        paymentMethodId,
      };
    } catch (error) {
      this.logger.error('Error saving payment method after payment:', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to save payment method'
      );
    }
  }

  /**
   * Update card nickname
   */
  async updateCardNickname(userId: string, paymentMethodId: string, nickname: string) {
    try {
      // Verify the payment method belongs to this user
      const savedMethod = await this.prisma.savedPaymentMethod.findFirst({
        where: {
          userId,
          stripePaymentMethodId: paymentMethodId,
        },
      });

      if (!savedMethod) {
        throw new BadRequestException('Payment method not found');
      }

      // Update nickname
      await this.prisma.savedPaymentMethod.update({
        where: { id: savedMethod.id },
        data: { nickname },
      });

      this.logger.log(`Updated nickname for payment method ${paymentMethodId} to "${nickname}"`);

      return {
        success: true,
        message: 'Card nickname updated successfully',
      };
    } catch (error) {
      this.logger.error('Error updating card nickname:', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to update card nickname'
      );
    }
  }

  /**
   * Update card usage statistics (internal method)
   * Called automatically when a saved card is used for payment
   */
  async updateCardUsageStats(paymentMethodId: string) {
    try {
      const savedMethod = await this.prisma.savedPaymentMethod.findUnique({
        where: { stripePaymentMethodId: paymentMethodId },
      });

      if (savedMethod) {
        await this.prisma.savedPaymentMethod.update({
          where: { id: savedMethod.id },
          data: {
            lastUsedAt: new Date(),
            usageCount: { increment: 1 },
          },
        });
        this.logger.log(`Updated usage stats for payment method ${paymentMethodId}`);
      }
    } catch (error) {
      // Don't fail the payment if usage tracking fails
      this.logger.warn('Failed to update card usage stats:', error);
    }
  }

  /**
   * Get detailed saved payment method information
   */
  async getSavedPaymentMethodDetails(userId: string, paymentMethodId: string) {
    try {
      const stripe = await this.getStripeClient();

      // Get from our database
      const savedMethod = await this.prisma.savedPaymentMethod.findFirst({
        where: {
          userId,
          stripePaymentMethodId: paymentMethodId,
        },
      });

      if (!savedMethod) {
        throw new BadRequestException('Payment method not found');
      }

      // Get fresh data from Stripe
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

      // Get user's customer info for default status
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true },
      });

      let isDefault = false;
      if (user?.stripeCustomerId) {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        if (!('deleted' in customer && customer.deleted)) {
          const activeCustomer = customer as Stripe.Customer;
          isDefault = activeCustomer.invoice_settings?.default_payment_method === paymentMethodId;
        }
      }

      return {
        id: savedMethod.id,
        stripePaymentMethodId: savedMethod.stripePaymentMethodId,
        brand: paymentMethod.card?.brand || savedMethod.brand,
        last4: paymentMethod.card?.last4 || savedMethod.last4,
        expMonth: paymentMethod.card?.exp_month || savedMethod.expMonth,
        expYear: paymentMethod.card?.exp_year || savedMethod.expYear,
        funding: paymentMethod.card?.funding || savedMethod.funding,
        country: paymentMethod.card?.country || savedMethod.country,
        nickname: savedMethod.nickname,
        isDefault,
        lastUsedAt: savedMethod.lastUsedAt,
        usageCount: savedMethod.usageCount,
        createdAt: savedMethod.createdAt,
      };
    } catch (error) {
      this.logger.error('Error getting saved payment method details:', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to get payment method details'
      );
    }
  }

  /**
   * Set a payment method as default
   */
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string) {
    const stripe = await this.getStripeClient();

    // Get user with stripe customer ID
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer found for this user');
    }

    // Verify payment method belongs to customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod.customer !== user.stripeCustomerId) {
      throw new BadRequestException('Payment method does not belong to this user');
    }

    // Update customer's default payment method
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    this.logger.log(`Set default payment method ${paymentMethodId} for user ${userId}`);

    return { success: true, message: 'Default payment method updated' };
  }

  /**
   * Remove a saved payment method
   */
  async removePaymentMethod(userId: string, paymentMethodId: string) {
    const stripe = await this.getStripeClient();

    // Get user with stripe customer ID
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer found for this user');
    }

    // Verify payment method belongs to customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod.customer !== user.stripeCustomerId) {
      throw new BadRequestException('Payment method does not belong to this user');
    }

    // Detach payment method
    await stripe.paymentMethods.detach(paymentMethodId);

    this.logger.log(`Removed payment method ${paymentMethodId} for user ${userId}`);

    return { success: true, message: 'Payment method removed' };
  }

  /**
   * Create payment intent with saved payment method
   */
  async createPaymentIntentWithSavedMethod(
    dto: CreatePaymentIntentDto,
    userId: string,
    paymentMethodId: string
  ) {
    const stripe = await this.getStripeClient();

    // Get user with stripe customer ID
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true },
    });

    if (!user?.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer found for this user');
    }

    // Verify payment method belongs to customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod.customer !== user.stripeCustomerId) {
      throw new BadRequestException('Payment method does not belong to this user');
    }

    // Get config and currency
    const config = this.stripeConfig || (await this.settingsService.getStripeConfig());
    const paymentCurrency = dto.currency?.toUpperCase() || (await this.getDefaultPaymentCurrency());
    await this.validateCurrency(paymentCurrency);

    const currencyDetails = await this.currencyService.getRateByCode(paymentCurrency);
    const amountInSmallestUnit = this.convertToSmallestUnit(dto.amount, paymentCurrency);

    // Create payment intent with saved payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: paymentCurrency.toLowerCase(),
      customer: user.stripeCustomerId,
      payment_method: paymentMethodId,
      off_session: false,
      confirm: false, // Don't confirm yet - let frontend handle 3DS if needed
      capture_method: config.captureMethod,
      statement_descriptor_suffix: config.statementDescriptor?.substring(0, 22),
      metadata: {
        orderId: dto.orderId,
        userId,
        customerEmail: dto.customerEmail || user.email,
        testMode: config.testMode.toString(),
        originalCurrency: paymentCurrency,
        usedSavedCard: 'true',
      },
    });

    // Create payment transaction record
    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        orderId: dto.orderId,
        userId,
        stripePaymentIntentId: paymentIntent.id,
        amount: new Decimal(dto.amount),
        currency: paymentCurrency,
        status: PaymentTransactionStatus.PENDING,
        paymentMethod: PaymentMethod.STRIPE,
        receiptEmail: dto.customerEmail || user.email,
        metadata: {
          currencySymbol: currencyDetails.symbol,
          currencyName: currencyDetails.currencyName,
          savedPaymentMethodId: paymentMethodId,
        } as any,
      },
    });

    this.logger.log(
      `Payment intent created with saved method: ${paymentIntent.id} for order ${dto.orderId}`
    );

    // Update usage stats for this card (async, don't wait)
    this.updateCardUsageStats(paymentMethodId).catch((err) =>
      this.logger.warn('Failed to update card usage stats:', err)
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      transactionId: transaction.id,
      currency: paymentCurrency,
      amount: dto.amount,
      paymentMethodId,
    };
  }

  /**
   * Get payment health metrics (Admin dashboard)
   */
  async getPaymentHealthMetrics(days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      totalRevenue,
      averageTransactionValue,
      recentTransactions,
    ] = await Promise.all([
      // Total transactions
      this.prisma.paymentTransaction.count({
        where: { createdAt: { gte: since } },
      }),

      // Successful transactions
      this.prisma.paymentTransaction.count({
        where: {
          createdAt: { gte: since },
          status: PaymentTransactionStatus.SUCCEEDED,
        },
      }),

      // Failed transactions
      this.prisma.paymentTransaction.count({
        where: {
          createdAt: { gte: since },
          status: PaymentTransactionStatus.FAILED,
        },
      }),

      // Total revenue (successful transactions)
      this.prisma.paymentTransaction.aggregate({
        where: {
          createdAt: { gte: since },
          status: PaymentTransactionStatus.SUCCEEDED,
        },
        _sum: { amount: true },
      }),

      // Average transaction value
      this.prisma.paymentTransaction.aggregate({
        where: {
          createdAt: { gte: since },
          status: PaymentTransactionStatus.SUCCEEDED,
        },
        _avg: { amount: true },
      }),

      // Recent transactions
      this.prisma.paymentTransaction.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderId: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          order: {
            select: {
              orderNumber: true,
            },
          },
        },
      }),
    ]);

    const successRate =
      totalTransactions > 0
        ? ((successfulTransactions / totalTransactions) * 100).toFixed(2)
        : '0.00';

    return {
      period: { days, since },
      transactions: {
        total: totalTransactions,
        successful: successfulTransactions,
        failed: failedTransactions,
        disputed: 0, // TODO: Add DISPUTED status to database enum
        successRate: `${successRate}%`,
      },
      revenue: {
        total: Number(totalRevenue._sum.amount || 0),
        average: Number(averageTransactionValue._avg.amount || 0),
      },
      recentTransactions,
    };
  }
}
