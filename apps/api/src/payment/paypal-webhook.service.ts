import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { PaymentService } from './payment.service';
import { PayPalService } from './paypal.service';
import {
  WebhookStatus,
  PaymentTransactionStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * PayPal Webhook Service
 *
 * Handles PayPal webhook events with:
 * - Signature verification via PayPal REST API
 * - Idempotent event processing via WebhookEvent table
 * - Event routing for payment, refund, and dispute events
 *
 * Required env vars:
 *   PAYPAL_WEBHOOK_ID     - Webhook subscription ID (from PayPal dashboard)
 *   PAYPAL_CLIENT_ID      - For OAuth2 token to verify signatures
 *   PAYPAL_CLIENT_SECRET   - For OAuth2 token to verify signatures
 *   PAYPAL_MODE           - 'sandbox' | 'live'
 */
@Injectable()
export class PayPalWebhookService {
  private readonly logger = new Logger(PayPalWebhookService.name);
  private readonly webhookId: string;
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly isConfigured: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly paypalService: PayPalService
  ) {
    const mode = this.configService.get<string>('PAYPAL_MODE') || 'sandbox';
    this.baseUrl =
      mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    this.webhookId = this.configService.get<string>('PAYPAL_WEBHOOK_ID') || '';
    this.clientId = this.configService.get<string>('PAYPAL_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET') || '';
    this.isConfigured =
      Boolean(this.webhookId) && Boolean(this.clientId) && Boolean(this.clientSecret);

    if (this.isConfigured) {
      this.logger.log(`PayPal Webhooks initialized [mode: ${mode}]`);
    } else {
      this.logger.warn(
        'PayPal Webhooks not configured — set PAYPAL_WEBHOOK_ID, PAYPAL_CLIENT_ID, and PAYPAL_CLIENT_SECRET'
      );
    }
  }

  /**
   * Verify PayPal webhook signature via PayPal REST API.
   * Uses POST /v1/notifications/verify-webhook-signature
   */
  async verifyWebhookSignature(headers: Record<string, string>, body: string): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.warn('PayPal webhook verification skipped — not configured');
      return false;
    }

    const token = await this.getAccessToken();

    const verificationPayload = {
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: this.webhookId,
      webhook_event: JSON.parse(body),
    };

    const response = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationPayload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `PayPal webhook signature verification failed [${response.status}]: ${errorBody}`
      );
      return false;
    }

    const data = (await response.json()) as { verification_status: string };
    return data.verification_status === 'SUCCESS';
  }

  /**
   * Process a verified PayPal webhook event.
   * Idempotent — uses WebhookEvent.eventId to prevent duplicate processing.
   */
  async handleWebhookEvent(
    headers: Record<string, string>,
    rawBody: string
  ): Promise<{ received: boolean; eventId?: string }> {
    // Parse event
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw new BadRequestException('Invalid JSON payload');
    }

    const eventId = event.id;
    const eventType = event.event_type;

    if (!eventId || !eventType) {
      throw new BadRequestException('Missing event ID or event type');
    }

    this.logger.log(`PayPal webhook received: ${eventType} (${eventId})`);

    // Verify signature (skip in test/dev if webhook ID not configured)
    if (this.isConfigured) {
      const isValid = await this.verifyWebhookSignature(headers, rawBody);
      if (!isValid) {
        this.logger.error(`PayPal webhook signature verification FAILED for event ${eventId}`);
        throw new BadRequestException('Invalid webhook signature');
      }
      this.logger.debug(`PayPal webhook signature verified for event ${eventId}`);
    }

    // Idempotency check — prevent duplicate processing
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existing && existing.status === WebhookStatus.PROCESSED) {
      this.logger.log(`PayPal webhook already processed: ${eventId}`);
      return { received: true, eventId };
    }

    // Store/update webhook event
    const webhookEvent = await this.prisma.webhookEvent.upsert({
      where: { eventId },
      create: {
        provider: 'paypal',
        eventType,
        eventId,
        payload: event,
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
      // Route event to handler
      switch (eventType) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handleCaptureCompleted(event);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this.handleCaptureDenied(event);
          break;
        case 'PAYMENT.CAPTURE.REFUNDED':
          await this.handleCaptureRefunded(event);
          break;
        case 'PAYMENT.CAPTURE.REVERSED':
          await this.handleCaptureReversed(event);
          break;
        case 'CUSTOMER.DISPUTE.CREATED':
          await this.handleDisputeCreated(event);
          break;
        case 'CUSTOMER.DISPUTE.RESOLVED':
          await this.handleDisputeResolved(event);
          break;
        case 'CUSTOMER.DISPUTE.UPDATED':
          await this.handleDisputeUpdated(event);
          break;
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          await this.handleSubscriptionActivated(event);
          break;
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await this.handleSubscriptionCancelled(event);
          break;
        case 'BILLING.SUBSCRIPTION.SUSPENDED':
          await this.handleSubscriptionSuspended(event);
          break;
        case 'BILLING.SUBSCRIPTION.EXPIRED':
          await this.handleSubscriptionExpired(event);
          break;
        case 'PAYMENT.SALE.COMPLETED':
          await this.handleSaleCompleted(event);
          break;
        default:
          this.logger.log(`Unhandled PayPal webhook event type: ${eventType}`);
          await this.prisma.webhookEvent.update({
            where: { id: webhookEvent.id },
            data: { status: WebhookStatus.IGNORED },
          });
          return { received: true, eventId };
      }

      // Mark as processed
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookStatus.PROCESSED,
          lastProcessedAt: new Date(),
        },
      });

      this.logger.log(`PayPal webhook processed successfully: ${eventType} (${eventId})`);
    } catch (error) {
      this.logger.error(`PayPal webhook processing failed for ${eventId}:`, error);
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          lastProcessedAt: new Date(),
        },
      });
    }

    return { received: true, eventId };
  }

  /**
   * PAYMENT.CAPTURE.COMPLETED — Confirms a PayPal capture succeeded.
   *
   * This is the server-side confirmation that funds were captured.
   * If processSuccessfulPayment() already ran from the synchronous capture flow,
   * the idempotency guards (existing commissions, existing escrow) will skip duplicates.
   */
  private async handleCaptureCompleted(event: any): Promise<void> {
    const capture = event.resource;
    const captureId = capture?.id;
    const paypalOrderId = capture?.supplementary_data?.related_ids?.order_id;

    if (!captureId) {
      this.logger.warn('PAYMENT.CAPTURE.COMPLETED: missing capture ID');
      return;
    }

    // Find transaction by paypalOrderId or by captureId in metadata
    let transaction = paypalOrderId
      ? await this.prisma.paymentTransaction.findUnique({ where: { paypalOrderId } })
      : null;

    if (!transaction) {
      // Fallback: search by captureId in metadata
      transaction = await this.prisma.paymentTransaction.findFirst({
        where: {
          paymentMethod: PaymentMethod.PAYPAL,
          metadata: { path: ['captureId'], equals: captureId },
        },
      });
    }

    if (!transaction) {
      this.logger.warn(
        `PAYMENT.CAPTURE.COMPLETED: no transaction found for captureId=${captureId}, paypalOrderId=${paypalOrderId}`
      );
      return;
    }

    // If transaction is already SUCCEEDED and order is CONFIRMED, post-payment already ran
    if (transaction.status === PaymentTransactionStatus.SUCCEEDED) {
      const order = await this.prisma.order.findUnique({
        where: { id: transaction.orderId },
        select: { paymentStatus: true },
      });
      if (order?.paymentStatus === PaymentStatus.PAID) {
        this.logger.log(
          `PAYMENT.CAPTURE.COMPLETED: order ${transaction.orderId} already processed — idempotent skip`
        );
        return;
      }
    }

    // Update transaction if not already succeeded
    if (transaction.status !== PaymentTransactionStatus.SUCCEEDED) {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentTransactionStatus.SUCCEEDED,
          metadata: {
            ...(transaction.metadata as any),
            captureId,
            captureStatus: 'COMPLETED',
            webhookConfirmedAt: new Date().toISOString(),
          },
        },
      });
    }

    // Run post-payment processing (idempotent — will skip if already done)
    const grossAmount = new Decimal(Number(transaction.amount));
    await this.paymentService.processSuccessfulPayment(
      transaction.orderId,
      { id: transaction.id, amount: transaction.amount, currency: transaction.currency },
      grossAmount,
      null
    );
  }

  /**
   * PAYMENT.CAPTURE.DENIED — Capture was denied by PayPal.
   */
  private async handleCaptureDenied(event: any): Promise<void> {
    const capture = event.resource;
    const paypalOrderId = capture?.supplementary_data?.related_ids?.order_id;

    const transaction = paypalOrderId
      ? await this.prisma.paymentTransaction.findUnique({ where: { paypalOrderId } })
      : null;

    if (!transaction) {
      this.logger.warn(`PAYMENT.CAPTURE.DENIED: no transaction found for order ${paypalOrderId}`);
      return;
    }

    await this.prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: { status: PaymentTransactionStatus.FAILED, failureReason: 'PayPal capture denied' },
    });

    await this.prisma.order.update({
      where: { id: transaction.orderId },
      data: { paymentStatus: PaymentStatus.FAILED },
    });

    await this.prisma.orderTimeline.create({
      data: {
        orderId: transaction.orderId,
        status: 'PENDING' as any,
        title: 'Payment Denied',
        description: 'PayPal payment capture was denied. Please try another payment method.',
        icon: 'x-circle',
      },
    });

    this.logger.log(`PayPal capture denied for order ${transaction.orderId}`);
  }

  /**
   * PAYMENT.CAPTURE.REFUNDED — PayPal refund completed.
   */
  private async handleCaptureRefunded(event: any): Promise<void> {
    const refund = event.resource;
    const captureId = refund?.links
      ?.find((l: any) => l.rel === 'up')
      ?.href?.split('/')
      .pop();

    if (!captureId) {
      this.logger.warn('PAYMENT.CAPTURE.REFUNDED: could not extract capture ID');
      return;
    }

    const transaction = await this.prisma.paymentTransaction.findFirst({
      where: {
        paymentMethod: PaymentMethod.PAYPAL,
        metadata: { path: ['captureId'], equals: captureId },
      },
    });

    if (!transaction) {
      this.logger.warn(`PAYMENT.CAPTURE.REFUNDED: no transaction found for captureId ${captureId}`);
      return;
    }

    const refundAmount = refund?.amount?.value ? parseFloat(refund.amount.value) : null;
    const isFullRefund = !refundAmount || refundAmount >= Number(transaction.amount);

    await this.prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: isFullRefund
          ? PaymentTransactionStatus.REFUNDED
          : PaymentTransactionStatus.PARTIALLY_REFUNDED,
        refundedAmount: refundAmount ? new Decimal(refundAmount) : transaction.amount,
        refundedAt: new Date(),
      },
    });

    await this.prisma.order.update({
      where: { id: transaction.orderId },
      data: {
        paymentStatus: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
      },
    });

    this.logger.log(
      `PayPal refund processed for order ${transaction.orderId}: ${isFullRefund ? 'full' : 'partial'} (${refundAmount})`
    );
  }

  /**
   * PAYMENT.CAPTURE.REVERSED — Chargeback/reversal.
   */
  private async handleCaptureReversed(event: any): Promise<void> {
    const resource = event.resource;
    const captureId = resource?.id;

    const transaction = captureId
      ? await this.prisma.paymentTransaction.findFirst({
          where: {
            paymentMethod: PaymentMethod.PAYPAL,
            metadata: { path: ['captureId'], equals: captureId },
          },
        })
      : null;

    if (!transaction) {
      this.logger.warn(`PAYMENT.CAPTURE.REVERSED: no transaction found for captureId ${captureId}`);
      return;
    }

    await this.prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: PaymentTransactionStatus.DISPUTED,
        metadata: {
          ...(transaction.metadata as any),
          reversedAt: new Date().toISOString(),
          reversalReason: resource?.status_details?.reason || 'CHARGEBACK',
        },
      },
    });

    await this.prisma.order.update({
      where: { id: transaction.orderId },
      data: { paymentStatus: 'DISPUTED' as any },
    });

    this.logger.error(
      `PayPal capture REVERSED for order ${transaction.orderId} — possible chargeback`
    );
  }

  /**
   * CUSTOMER.DISPUTE.CREATED — Dispute opened.
   */
  private async handleDisputeCreated(event: any): Promise<void> {
    const dispute = event.resource;
    const disputeId = dispute?.dispute_id;
    const captureId = dispute?.disputed_transactions?.[0]?.seller_transaction_id;

    this.logger.error(
      `PayPal DISPUTE CREATED: ${disputeId} for captureId=${captureId}, reason=${dispute?.reason}`
    );

    if (!captureId) return;

    const transaction = await this.prisma.paymentTransaction.findFirst({
      where: {
        paymentMethod: PaymentMethod.PAYPAL,
        metadata: { path: ['captureId'], equals: captureId },
      },
    });

    if (transaction) {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentTransactionStatus.DISPUTED,
          metadata: {
            ...(transaction.metadata as any),
            disputeId,
            disputeReason: dispute?.reason,
            disputeCreatedAt: new Date().toISOString(),
          },
        },
      });

      // Update escrow to DISPUTED if it exists
      await this.prisma.escrowTransaction.updateMany({
        where: { orderId: transaction.orderId, status: { in: ['HELD', 'PENDING_RELEASE'] } },
        data: { status: 'DISPUTED' },
      });
    }
  }

  /**
   * CUSTOMER.DISPUTE.RESOLVED — Dispute resolved.
   */
  private async handleDisputeResolved(event: any): Promise<void> {
    const dispute = event.resource;
    const disputeId = dispute?.dispute_id;
    const outcome = dispute?.dispute_outcome?.outcome_code;

    this.logger.log(`PayPal DISPUTE RESOLVED: ${disputeId}, outcome=${outcome}`);

    const transaction = await this.prisma.paymentTransaction.findFirst({
      where: {
        paymentMethod: PaymentMethod.PAYPAL,
        metadata: { path: ['disputeId'], equals: disputeId },
      },
    });

    if (transaction) {
      const isWon = outcome === 'RESOLVED_BUYER_FAVOUR' ? false : true;
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: isWon
            ? PaymentTransactionStatus.SUCCEEDED
            : PaymentTransactionStatus.LOST_DISPUTE,
          metadata: {
            ...(transaction.metadata as any),
            disputeOutcome: outcome,
            disputeResolvedAt: new Date().toISOString(),
          },
        },
      });
    }
  }

  /**
   * CUSTOMER.DISPUTE.UPDATED — Dispute status change.
   */
  private async handleDisputeUpdated(event: any): Promise<void> {
    const dispute = event.resource;
    const disputeId = dispute?.dispute_id;
    this.logger.log(`PayPal DISPUTE UPDATED: ${disputeId}, status=${dispute?.status}`);
    // Log for awareness — no automatic action needed for status updates
  }

  /**
   * Get OAuth2 access token for API calls (signature verification).
   */
  private async getAccessToken(): Promise<string> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new BadRequestException('Failed to get PayPal access token for webhook verification');
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }

  // ==========================================================================
  // PAYPAL SUBSCRIPTION WEBHOOK HANDLERS
  // ==========================================================================

  private async handleSubscriptionActivated(event: any): Promise<void> {
    const resource = event.resource;
    const paypalSubscriptionId = resource?.id;
    const customId = resource?.custom_id;

    this.logger.log(`PayPal subscription activated: ${paypalSubscriptionId}`);

    if (!paypalSubscriptionId) return;

    // Try to parse metadata from custom_id
    let metadata: any = {};
    try {
      metadata = customId ? JSON.parse(customId) : {};
    } catch {
      // custom_id might not be JSON
    }

    // Update seller subscription if found
    const subscription = await this.prisma.sellerSubscription.findFirst({
      where: { paypalSubscriptionId },
    });

    if (subscription) {
      await this.prisma.sellerSubscription.update({
        where: { id: subscription.id },
        data: { status: 'ACTIVE' },
      });
      this.logger.log(`Seller subscription ${subscription.id} activated via webhook`);
    }

    // Also check ad plan subscriptions
    const adSub = await this.prisma.sellerPlanSubscription.findFirst({
      where: { stripeSubscriptionId: `paypal-sub-${paypalSubscriptionId}` },
    });

    if (adSub) {
      await this.prisma.sellerPlanSubscription.update({
        where: { id: adSub.id },
        data: { status: 'ACTIVE' },
      });
      this.logger.log(`Ad plan subscription ${adSub.id} activated via webhook`);
    }
  }

  private async handleSubscriptionCancelled(event: any): Promise<void> {
    const paypalSubscriptionId = event.resource?.id;
    this.logger.log(`PayPal subscription cancelled: ${paypalSubscriptionId}`);

    if (!paypalSubscriptionId) return;

    // Cancel seller subscription
    const subscription = await this.prisma.sellerSubscription.findFirst({
      where: { paypalSubscriptionId },
    });

    if (subscription) {
      await this.prisma.sellerSubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED',
          canceledAt: new Date(),
          cancelAtPeriodEnd: true,
        },
      });
      this.logger.log(`Seller subscription ${subscription.id} cancelled via webhook`);
    }

    // Cancel ad plan subscription
    const adSub = await this.prisma.sellerPlanSubscription.findFirst({
      where: { stripeSubscriptionId: `paypal-sub-${paypalSubscriptionId}` },
    });

    if (adSub) {
      await this.prisma.sellerPlanSubscription.update({
        where: { id: adSub.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          autoRenew: false,
        },
      });
      this.logger.log(`Ad plan subscription ${adSub.id} cancelled via webhook`);
    }
  }

  private async handleSubscriptionSuspended(event: any): Promise<void> {
    const paypalSubscriptionId = event.resource?.id;
    this.logger.log(`PayPal subscription suspended: ${paypalSubscriptionId}`);

    if (!paypalSubscriptionId) return;

    const subscription = await this.prisma.sellerSubscription.findFirst({
      where: { paypalSubscriptionId },
    });

    if (subscription) {
      await this.prisma.sellerSubscription.update({
        where: { id: subscription.id },
        data: { status: 'PAST_DUE' },
      });
    }
  }

  private async handleSubscriptionExpired(event: any): Promise<void> {
    const paypalSubscriptionId = event.resource?.id;
    this.logger.log(`PayPal subscription expired: ${paypalSubscriptionId}`);

    if (!paypalSubscriptionId) return;

    const subscription = await this.prisma.sellerSubscription.findFirst({
      where: { paypalSubscriptionId },
    });

    if (subscription) {
      await this.prisma.sellerSubscription.update({
        where: { id: subscription.id },
        data: { status: 'EXPIRED' },
      });
    }
  }

  private async handleSaleCompleted(event: any): Promise<void> {
    const resource = event.resource;
    const billingAgreementId = resource?.billing_agreement_id;

    this.logger.log(`PayPal sale completed for subscription: ${billingAgreementId}`);

    if (!billingAgreementId) return;

    // This is a recurring payment — extend the subscription period
    const subscription = await this.prisma.sellerSubscription.findFirst({
      where: { paypalSubscriptionId: billingAgreementId },
      include: { plan: true },
    });

    if (subscription) {
      const now = new Date();
      const periodEnd = new Date(now);
      if (subscription.billingCycle === 'YEARLY') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      await this.prisma.sellerSubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          creditsAllocated: subscription.plan.monthlyCredits,
          creditsUsed: 0,
        },
      });

      this.logger.log(
        `Subscription ${subscription.id} renewed via PayPal sale, new period end: ${periodEnd.toISOString()}`
      );
    }
  }
}
