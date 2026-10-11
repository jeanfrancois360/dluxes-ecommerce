import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { SettingsService } from '../../settings/settings.service';
import Stripe from 'stripe';

/**
 * Stripe Connect Service
 * Handles Stripe Connect integration for seller payouts
 */
@Injectable()
export class StripeConnectService {
  private readonly logger = new Logger(StripeConnectService.name);
  private stripe: Stripe | null = null;
  private stripeConfig: any = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService
  ) {
    this.initializeStripe();
  }

  /**
   * Initialize Stripe client
   */
  private async initializeStripe(): Promise<void> {
    try {
      // Try to get Stripe config from database settings first
      const config = await this.settingsService.getStripeConfig();

      let secretKey = config.secretKey;

      // Fallback to environment variables if settings not configured
      if (!secretKey) {
        secretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || '';
        this.logger.log('Using Stripe secret key from environment variables');
      } else {
        this.logger.log('Using Stripe secret key from database settings');
      }

      if (!secretKey || secretKey === 'your-stripe-key') {
        this.logger.warn('Stripe not configured. Stripe Connect features will be disabled.');
        this.stripe = null;
        return;
      }

      // Initialize Stripe client
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-10-29.clover',
      });

      this.stripeConfig = config;

      this.logger.log(`Stripe Connect initialized [Test Mode: ${config.testMode}]`);
    } catch (error) {
      this.logger.error('Failed to initialize Stripe:', error);
      // Try fallback to env vars
      const envKey = this.configService.get<string>('STRIPE_SECRET_KEY');
      if (envKey && envKey !== 'your-stripe-key') {
        this.stripe = new Stripe(envKey, {
          apiVersion: '2025-10-29.clover',
        });
        this.logger.log('Stripe initialized from environment variables (fallback)');
      } else {
        this.stripe = null;
      }
    }
  }

  /**
   * Get Stripe instance (initialize if needed)
   */
  private async getStripe(): Promise<Stripe> {
    if (!this.stripe) {
      await this.initializeStripe();
    }

    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured. Please contact support.');
    }

    return this.stripe;
  }

  /**
   * Create Stripe Connect Account for seller
   */
  async createConnectAccount(
    sellerId: string,
    data: {
      email: string;
      country: string;
      businessType?: 'individual' | 'company';
    }
  ): Promise<{
    accountId: string;
    accountLinkUrl: string;
  }> {
    const stripe = await this.getStripe();

    try {
      // Check if seller already has an account
      const existingSettings = await this.prisma.sellerPayoutSettings.findUnique({
        where: { sellerId },
      });

      if (existingSettings?.stripeAccountId) {
        // Account exists, generate new onboarding link
        const accountLink = await this.createAccountLink(
          existingSettings.stripeAccountId,
          sellerId
        );
        return {
          accountId: existingSettings.stripeAccountId,
          accountLinkUrl: accountLink.url,
        };
      }

      // Create new Stripe Connect account
      const account = await stripe.accounts.create({
        type: 'express', // Express account for faster onboarding
        country: data.country,
        email: data.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: data.businessType || 'individual',
        metadata: {
          sellerId,
          platform: 'nextpik',
        },
      });

      this.logger.log(`Stripe Connect account created: ${account.id} for seller ${sellerId}`);

      // Create account link for onboarding
      const accountLink = await this.createAccountLink(account.id, sellerId);

      // Save account ID to seller payout settings
      await this.prisma.sellerPayoutSettings.upsert({
        where: { sellerId },
        create: {
          sellerId,
          storeId: (await this.prisma.user.findUnique({
            where: { id: sellerId },
            include: { store: true },
          }))!.store!.id,
          paymentMethod: 'STRIPE_CONNECT',
          stripeAccountId: account.id,
          stripeAccountStatus: 'pending',
          payoutCurrency: 'USD',
        },
        update: {
          stripeAccountId: account.id,
          stripeAccountStatus: 'pending',
          paymentMethod: 'STRIPE_CONNECT',
        },
      });

      return {
        accountId: account.id,
        accountLinkUrl: accountLink.url,
      };
    } catch (error) {
      this.logger.error('Failed to create Stripe Connect account:', error);
      throw new BadRequestException(
        `Failed to create Stripe Connect account: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create account link for seller onboarding
   */
  async createAccountLink(accountId: string, sellerId: string): Promise<Stripe.AccountLink> {
    const stripe = await this.getStripe();

    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${baseUrl}/seller/payout-settings?refresh=true`,
        return_url: `${baseUrl}/seller/payout-settings?success=true`,
        type: 'account_onboarding',
      });

      return accountLink;
    } catch (error) {
      this.logger.error('Failed to create account link:', error);
      throw new BadRequestException('Failed to create Stripe onboarding link');
    }
  }

  /**
   * Get Stripe Connect account status
   */
  async getAccountStatus(accountId: string): Promise<{
    id: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    requirements: {
      currentlyDue: string[];
      pastDue: string[];
      eventuallyDue: string[];
    };
  }> {
    const stripe = await this.getStripe();

    try {
      const account = await stripe.accounts.retrieve(accountId);

      return {
        id: account.id,
        chargesEnabled: account.charges_enabled || false,
        payoutsEnabled: account.payouts_enabled || false,
        detailsSubmitted: account.details_submitted || false,
        requirements: {
          currentlyDue: account.requirements?.currently_due || [],
          pastDue: account.requirements?.past_due || [],
          eventuallyDue: account.requirements?.eventually_due || [],
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get account status for ${accountId}:`, error);
      throw new NotFoundException('Stripe Connect account not found');
    }
  }

  /**
   * Update seller's Stripe Connect status in database
   */
  async updateAccountStatus(accountId: string): Promise<void> {
    try {
      const status = await this.getAccountStatus(accountId);

      const settings = await this.prisma.sellerPayoutSettings.findFirst({
        where: { stripeAccountId: accountId },
      });

      if (!settings) {
        this.logger.warn(`No seller found for Stripe account ${accountId}`);
        return;
      }

      // Determine status
      let accountStatus = 'pending';
      if (status.detailsSubmitted && status.payoutsEnabled) {
        accountStatus = 'active';
      } else if (status.requirements.pastDue.length > 0) {
        accountStatus = 'action_required';
      }

      // Update database
      await this.prisma.sellerPayoutSettings.update({
        where: { id: settings.id },
        data: {
          stripeAccountStatus: accountStatus,
          stripeOnboardedAt: status.detailsSubmitted ? new Date() : null,
        },
      });

      this.logger.log(`Updated Stripe account status for ${accountId}: ${accountStatus}`);
    } catch (error) {
      this.logger.error(`Failed to update account status for ${accountId}:`, error);
    }
  }

  /**
   * Create payout transfer to seller
   */
  async createPayout(data: {
    sellerId: string;
    amount: number;
    currency: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    transferId: string;
    amount: number;
    currency: string;
    status: string;
  }> {
    const stripe = await this.getStripe();

    try {
      // Get seller's Stripe account
      const settings = await this.prisma.sellerPayoutSettings.findUnique({
        where: { sellerId: data.sellerId },
      });

      if (!settings?.stripeAccountId) {
        throw new BadRequestException('Seller does not have a Stripe Connect account');
      }

      if (settings.stripeAccountStatus !== 'active') {
        throw new BadRequestException(
          `Stripe Connect account is not active. Status: ${settings.stripeAccountStatus}`
        );
      }

      // Verify account is ready for payouts
      const accountStatus = await this.getAccountStatus(settings.stripeAccountId);
      if (!accountStatus.payoutsEnabled) {
        throw new BadRequestException('Stripe Connect account does not have payouts enabled');
      }

      // Create transfer
      const transfer = await stripe.transfers.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency.toLowerCase(),
        destination: settings.stripeAccountId,
        description: data.description || `Payout to seller ${data.sellerId}`,
        metadata: {
          sellerId: data.sellerId,
          ...data.metadata,
        },
      });

      this.logger.log(
        `Stripe transfer created: ${transfer.id} for ${data.amount} ${data.currency} to seller ${data.sellerId}`
      );

      return {
        transferId: transfer.id,
        amount: transfer.amount / 100,
        currency: transfer.currency.toUpperCase(),
        status: transfer.reversed ? 'failed' : 'succeeded',
      };
    } catch (error) {
      this.logger.error('Failed to create Stripe transfer:', error);
      throw new BadRequestException(
        `Failed to create payout: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(transferId: string): Promise<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    created: Date;
  }> {
    const stripe = await this.getStripe();

    try {
      const transfer = await stripe.transfers.retrieve(transferId);

      return {
        id: transfer.id,
        amount: transfer.amount / 100,
        currency: transfer.currency.toUpperCase(),
        status: transfer.reversed ? 'failed' : 'succeeded',
        created: new Date(transfer.created * 1000),
      };
    } catch (error) {
      this.logger.error(`Failed to get transfer status for ${transferId}:`, error);
      throw new NotFoundException('Transfer not found');
    }
  }

  /**
   * Reverse/cancel a transfer (if within reversal window)
   */
  async reverseTransfer(transferId: string, reason?: string): Promise<void> {
    const stripe = await this.getStripe();

    try {
      await stripe.transfers.createReversal(transferId, {
        description: reason || 'Payout reversal',
      });

      this.logger.log(`Transfer ${transferId} reversed`);
    } catch (error) {
      this.logger.error(`Failed to reverse transfer ${transferId}:`, error);
      throw new BadRequestException('Failed to reverse transfer');
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    this.logger.log(`Processing Stripe webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'account.updated':
          await this.handleAccountUpdated(event.data.object as Stripe.Account);
          break;

        case 'transfer.created':
        case 'transfer.updated':
          await this.handleTransferEvent(event.data.object as Stripe.Transfer);
          break;

        case 'transfer.reversed':
          await this.handleTransferReversed(event.data.object as Stripe.Transfer);
          break;

        case 'payout.paid':
        case 'payout.failed':
          await this.handlePayoutEvent(event.data.object as Stripe.Payout);
          break;

        default:
          this.logger.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle webhook ${event.type}:`, error);
      throw error;
    }
  }

  /**
   * Handle account.updated webhook
   */
  private async handleAccountUpdated(account: Stripe.Account): Promise<void> {
    this.logger.log(`Account updated: ${account.id}`);
    await this.updateAccountStatus(account.id);
  }

  /**
   * Handle transfer events
   */
  private async handleTransferEvent(transfer: Stripe.Transfer): Promise<void> {
    this.logger.log(`Transfer event: ${transfer.id}`);

    const sellerId = transfer.metadata?.sellerId;
    if (!sellerId) {
      this.logger.warn(`Transfer ${transfer.id} has no sellerId in metadata`);
      return;
    }

    // Find payout by seller and amount
    const payout = await this.prisma.payout.findFirst({
      where: {
        sellerId,
        amount: transfer.amount / 100,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (payout) {
      await this.prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          paymentReference: transfer.id,
        },
      });

      this.logger.log(`Payout ${payout.id} marked as completed (transfer ${transfer.id})`);
    }
  }

  /**
   * Handle transfer.reversed webhook
   */
  private async handleTransferReversed(transfer: Stripe.Transfer): Promise<void> {
    this.logger.log(`Transfer reversed: ${transfer.id}`);

    // Find and update payout
    const payout = await this.prisma.payout.findFirst({
      where: {
        paymentReference: transfer.id,
      },
    });

    if (payout) {
      await this.prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: 'FAILED',
          notes: 'Transfer reversed by Stripe',
        },
      });

      this.logger.log(`Payout ${payout.id} marked as failed (transfer reversed)`);
    }
  }

  /**
   * Handle payout events (for connected accounts)
   */
  private async handlePayoutEvent(payout: Stripe.Payout): Promise<void> {
    this.logger.log(`Payout event: ${payout.id} - ${payout.status}`);
    // Connected account payouts - can be used for additional tracking
  }

  /**
   * Delete Stripe Connect account
   */
  async deleteAccount(accountId: string): Promise<void> {
    const stripe = await this.getStripe();

    try {
      await stripe.accounts.del(accountId);
      this.logger.log(`Stripe Connect account deleted: ${accountId}`);

      // Update database
      await this.prisma.sellerPayoutSettings.updateMany({
        where: { stripeAccountId: accountId },
        data: {
          stripeAccountId: null,
          stripeAccountStatus: null,
          stripeOnboardedAt: null,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to delete account ${accountId}:`, error);
      throw new BadRequestException('Failed to delete Stripe Connect account');
    }
  }

  /**
   * Get dashboard login link for seller to manage their account
   */
  async createLoginLink(accountId: string): Promise<string> {
    const stripe = await this.getStripe();

    try {
      const loginLink = await stripe.accounts.createLoginLink(accountId);
      return loginLink.url;
    } catch (error) {
      this.logger.error(`Failed to create login link for ${accountId}:`, error);
      throw new BadRequestException('Failed to create dashboard login link');
    }
  }
}
