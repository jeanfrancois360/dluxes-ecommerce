import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../database/prisma.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
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
   * Create a Stripe Payment Intent
   */
  async createPaymentIntent(dto: CreatePaymentIntentDto) {
    try {
      // Convert amount to cents (Stripe expects amounts in smallest currency unit)
      const amountInCents = Math.round(dto.amount * 100);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: dto.currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          orderId: dto.orderId || '',
          customerEmail: dto.customerEmail || '',
        },
      });

      this.logger.log(`Payment intent created: ${paymentIntent.id}`);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      this.logger.error('Error creating payment intent:', error);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  /**
   * Handle Stripe webhook events
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

    this.logger.log(`Webhook received: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await this.handleRefund(event.data.object as Stripe.Charge);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      this.logger.warn('Payment succeeded but no order ID in metadata');
      return;
    }

    try {
      // Update order payment status
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paidAt: new Date(),
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

      this.logger.log(`Order ${orderId} payment confirmed`);

      // TODO: Send payment confirmation email
      // TODO: Trigger order processing workflow
    } catch (error) {
      this.logger.error(`Error updating order ${orderId}:`, error);
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      return;
    }

    try {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.FAILED,
        },
      });

      this.logger.log(`Order ${orderId} payment failed`);

      // TODO: Send payment failed notification email
    } catch (error) {
      this.logger.error(`Error updating order ${orderId}:`, error);
    }
  }

  /**
   * Handle refund
   */
  private async handleRefund(charge: Stripe.Charge) {
    // Find order by charge ID or payment intent
    // Update order status to refunded
    this.logger.log(`Refund processed for charge ${charge.id}`);

    // TODO: Implement refund logic
    // TODO: Send refund confirmation email
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
   * Create a refund
   */
  async createRefund(orderId: string, amount?: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Order has not been paid');
    }

    // TODO: Find payment intent ID from order
    // TODO: Create refund with Stripe
    // TODO: Update order status

    return { success: true, message: 'Refund initiated' };
  }
}
