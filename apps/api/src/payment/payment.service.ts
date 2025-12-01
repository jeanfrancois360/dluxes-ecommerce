import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentStatus, PaymentTransactionStatus, PaymentMethod, WebhookStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentService.name);
  private readonly MAX_WEBHOOK_RETRIES = 5;
  private readonly RETRY_DELAYS = [60, 300, 900, 3600, 7200]; // seconds: 1min, 5min, 15min, 1hr, 2hr

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!stripeSecretKey || stripeSecretKey === 'your-stripe-key') {
      this.logger.warn('STRIPE_SECRET_KEY not configured. Payment functionality will be disabled.');
      return;
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover',
    });
  }

  /**
   * Check if escrow is enabled (system setting)
   */
  private async isEscrowEnabled(): Promise<boolean> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'escrow.enabled' },
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
        where: { key: 'escrow.hold_period_days' },
      });
      return typeof setting?.value === 'number' ? setting.value : 7;
    } catch (error) {
      this.logger.warn('Failed to get hold period setting, defaulting to 7 days', error);
      return 7; // Default to 7 days
    }
  }

  /**
   * Create a Stripe Payment Intent with transaction logging
   */
  async createPaymentIntent(dto: CreatePaymentIntentDto, userId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Payment service not configured. Please set STRIPE_SECRET_KEY.');
    }

    if (!dto.orderId) {
      throw new BadRequestException('Order ID is required');
    }

    try {
      // Verify order exists
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
      });

      if (!order) {
        throw new BadRequestException('Order not found');
      }

      // Convert amount to cents (Stripe expects amounts in smallest currency unit)
      const amountInCents = Math.round(dto.amount * 100);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: dto.currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          orderId: dto.orderId,
          userId,
          customerEmail: dto.customerEmail || '',
        },
      });

      // Create payment transaction record
      const transaction = await this.prisma.paymentTransaction.create({
        data: {
          orderId: dto.orderId,
          userId,
          stripePaymentIntentId: paymentIntent.id,
          amount: new Decimal(dto.amount),
          currency: dto.currency,
          status: PaymentTransactionStatus.PENDING,
          paymentMethod: PaymentMethod.STRIPE,
          receiptEmail: dto.customerEmail,
        },
      });

      this.logger.log(`Payment intent created: ${paymentIntent.id} for order ${dto.orderId}`);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        transactionId: transaction.id,
      };
    } catch (error) {
      this.logger.error('Error creating payment intent:', error);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  /**
   * Handle Stripe webhook events with retry logic
   */
  async handleWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (error) {
      this.logger.error('Webhook signature verification failed:', error instanceof Error ? error.message : String(error));
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
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent, webhookEvent.id);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent, webhookEvent.id);
          break;

        case 'payment_intent.processing':
          await this.handlePaymentProcessing(event.data.object as Stripe.PaymentIntent, webhookEvent.id);
          break;

        case 'charge.refunded':
          await this.handleRefund(event.data.object as Stripe.Charge, webhookEvent.id);
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
      const nextRetryDelay = shouldRetry ? this.RETRY_DELAYS[Math.min(retryAttempt, this.RETRY_DELAYS.length - 1)] : null;

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
        this.logger.log(`Retrying webhook ${webhook.eventId} (attempt ${webhook.processingAttempts + 1})`);

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
   * Handle successful payment with commission calculation
   */
  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent, webhookEventId?: string) {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      this.logger.warn('Payment succeeded but no order ID in metadata');
      return;
    }

    try {
      // Find or create payment transaction
      let transaction = await this.prisma.paymentTransaction.findUnique({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (!transaction) {
        // Create transaction if it doesn't exist (fallback)
        transaction = await this.prisma.paymentTransaction.create({
          data: {
            orderId,
            userId: paymentIntent.metadata.userId || '',
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: paymentIntent.latest_charge as string,
            amount: new Decimal(paymentIntent.amount / 100),
            currency: paymentIntent.currency.toUpperCase(),
            status: PaymentTransactionStatus.SUCCEEDED,
            paymentMethod: PaymentMethod.STRIPE,
          },
        });
      } else {
        // Update existing transaction
        transaction = await this.prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: PaymentTransactionStatus.SUCCEEDED,
            stripeChargeId: paymentIntent.latest_charge as string,
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
        const { EnhancedCommissionService } = await import('../commission/enhanced-commission.service');
        const commissionService = new CommissionService(this.prisma, this.settingsService);
        await commissionService.calculateCommissionForTransaction(transaction.id);
        this.logger.log(`Commissions calculated for transaction ${transaction.id}`);
      } catch (commissionError) {
        this.logger.error(`Error calculating commissions for transaction ${transaction.id}:`, commissionError);
        // Don't fail the payment if commission calculation fails
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
              // TODO: Implement multi-vendor escrow split
              this.logger.warn(`Multi-vendor escrow not yet implemented for order ${orderId}`);
            }
          }
        } catch (escrowError) {
          this.logger.error(`Error creating escrow for transaction ${transaction.id}:`, escrowError);
          // Don't fail the payment if escrow creation fails
        }
      } else if (immediatePayoutEnabled) {
        this.logger.warn(
          `IMMEDIATE PAYOUT MODE ENABLED: Funds will be paid to seller immediately for order ${orderId}. This should only be used for testing or trusted sellers!`
        );
        // In immediate payout mode, funds would be transferred immediately
        // This requires additional payout service integration
      }

      // TODO: Send payment confirmation email via email service
      // TODO: Trigger inventory reservation
    } catch (error) {
      this.logger.error(`Error processing payment success for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Handle payment processing state
   */
  private async handlePaymentProcessing(paymentIntent: Stripe.PaymentIntent, webhookEventId?: string) {
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
          status: isFullRefund ? PaymentTransactionStatus.REFUNDED : PaymentTransactionStatus.PARTIALLY_REFUNDED,
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
        this.logger.error(`Error cancelling commissions for order ${transaction.orderId}:`, commissionError);
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

    if (order.paymentStatus !== PaymentStatus.PAID && order.paymentStatus !== PaymentStatus.PARTIALLY_REFUNDED) {
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
        reason: reason === 'duplicate' ? 'duplicate' :
                reason === 'fraudulent' ? 'fraudulent' : 'requested_by_customer',
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
          status: isFullRefund ? PaymentTransactionStatus.REFUNDED : PaymentTransactionStatus.PARTIALLY_REFUNDED,
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

      this.logger.log(`Refund created for order ${orderId}: $${refundAmount.toFixed(2)} (Stripe: ${refund.id})`);

      return {
        success: true,
        refundId: refund.id,
        amount: refundAmount,
        isFullRefund,
        message: isFullRefund ? 'Full refund processed successfully' : 'Partial refund processed successfully',
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
}
