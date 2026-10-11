import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from '@paypal/checkout-server-sdk';
import { PrismaService } from '../database/prisma.service';
import { PaymentMethod, PaymentStatus, PaymentTransactionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { assertOrderAccess, AuthenticatedUser } from '../common/authorization/order-access.helper';

@Injectable()
export class PayPalService {
  private client: paypal.core.PayPalHttpClient | null = null;
  private readonly logger = new Logger(PayPalService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.initializePayPal();
  }

  /**
   * Initialize PayPal client with credentials from environment
   */
  private initializePayPal(): void {
    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');
    const mode = this.configService.get<string>('PAYPAL_MODE') || 'sandbox';

    if (!clientId || !clientSecret) {
      this.logger.warn('PayPal credentials not found. PayPal payments will be disabled.');
      return;
    }

    // Set up environment (sandbox or production)
    let environment;
    if (mode === 'production' || mode === 'live') {
      environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
      this.logger.log('PayPal initialized in LIVE mode');
    } else {
      environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
      this.logger.log('PayPal initialized in SANDBOX mode');
    }

    this.client = new paypal.core.PayPalHttpClient(environment);
  }

  /**
   * Get PayPal client (throws if not configured)
   */
  private getClient(): paypal.core.PayPalHttpClient {
    if (!this.client) {
      throw new BadRequestException(
        'PayPal is not configured. Please add PayPal credentials to environment variables.'
      );
    }
    return this.client;
  }

  /**
   * Create PayPal order
   */
  async createOrder(
    data: {
      orderId: string;
      amount: number;
      currency: string;
      items?: Array<{ name: string; quantity: number; price: number }>;
      shippingAddress?: any;
    },
    userId: string
  ): Promise<{ orderId: string; approvalUrl: string }> {
    const client = this.getClient();

    try {
      // Validate currency is supported by PayPal
      const supportedCurrencies = [
        'AUD',
        'BRL',
        'CAD',
        'CNY',
        'CZK',
        'DKK',
        'EUR',
        'HKD',
        'HUF',
        'ILS',
        'JPY',
        'MYR',
        'MXN',
        'TWD',
        'NZD',
        'NOK',
        'PHP',
        'PLN',
        'GBP',
        'RUB',
        'SGD',
        'SEK',
        'CHF',
        'THB',
        'USD',
      ];

      if (!supportedCurrencies.includes(data.currency.toUpperCase())) {
        throw new BadRequestException(
          `Currency ${data.currency} is not supported by PayPal. Supported currencies: ${supportedCurrencies.join(', ')}`
        );
      }

      // Create PayPal order request
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: data.orderId,
            amount: {
              currency_code: data.currency.toUpperCase(),
              value: data.amount.toFixed(2),
              // No breakdown - total amount includes items + tax + shipping
            },
            // Items array removed - PayPal requires breakdown if items are provided
            // We send just the total amount for simplicity
            shipping: data.shippingAddress
              ? {
                  name: {
                    full_name: `${data.shippingAddress.firstName} ${data.shippingAddress.lastName}`,
                  },
                  address: {
                    address_line_1: data.shippingAddress.addressLine1,
                    address_line_2: data.shippingAddress.addressLine2 || undefined,
                    admin_area_2: data.shippingAddress.city,
                    admin_area_1: data.shippingAddress.state || undefined,
                    postal_code: data.shippingAddress.postalCode || undefined,
                    country_code: this.getCountryCode(data.shippingAddress.country),
                  },
                }
              : undefined,
          },
        ],
        application_context: {
          brand_name: 'NextPik',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: `${this.configService.get('FRONTEND_URL')}/checkout/paypal/success`,
          cancel_url: `${this.configService.get('FRONTEND_URL')}/checkout/paypal/cancel`,
        },
      });

      // Execute request
      const response = await client.execute(request);
      const paypalOrder = response.result;

      // Find approval URL
      const approvalUrl = paypalOrder.links?.find((link) => link.rel === 'approve')?.href;

      if (!approvalUrl) {
        throw new BadRequestException('Failed to get PayPal approval URL');
      }

      this.logger.log(
        `PayPal order created: ${paypalOrder.id} for internal order: ${data.orderId}`
      );

      // Save PayPal transaction with indexed paypalOrderId column
      await this.prisma.paymentTransaction.create({
        data: {
          orderId: data.orderId,
          userId: userId,
          paymentMethod: PaymentMethod.PAYPAL,
          paypalOrderId: paypalOrder.id,
          amount: new Decimal(data.amount),
          currency: data.currency.toUpperCase(),
          status: PaymentTransactionStatus.PENDING,
          metadata: {
            paypalOrderId: paypalOrder.id,
            status: paypalOrder.status,
            approvalUrl,
          },
        },
      });

      return {
        orderId: paypalOrder.id,
        approvalUrl,
      };
    } catch (error) {
      this.logger.error('PayPal order creation failed:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`PayPal order creation failed: ${error.message}`);
    }
  }

  /**
   * Capture PayPal order after user approval
   */
  async captureOrder(
    paypalOrderId: string,
    user: AuthenticatedUser
  ): Promise<{
    success: boolean;
    orderId: string;
    transactionId: string;
    transaction?: { id: string; amount: any; currency: string };
  }> {
    const client = this.getClient();

    try {
      // Find our order by PayPal order ID using the indexed column.
      // Falls back to metadata JSON scan for transactions created before the migration.
      let transaction = await this.prisma.paymentTransaction.findUnique({
        where: { paypalOrderId },
        include: { order: true },
      });

      // Fallback: legacy transactions may only have paypalOrderId in metadata JSON
      if (!transaction) {
        const legacyTransactions = await this.prisma.paymentTransaction.findMany({
          where: { paymentMethod: PaymentMethod.PAYPAL, paypalOrderId: null },
          include: { order: true },
        });
        transaction =
          legacyTransactions.find((t) => {
            const metadata = t.metadata as any;
            return metadata?.paypalOrderId === paypalOrderId;
          }) || null;
      }

      if (!transaction) {
        throw new NotFoundException('Payment order not found');
      }

      // Skip order access check for non-order payments (credits, subscriptions)
      // which have null orderId
      const isNonOrderPayment = !transaction.orderId;
      if (isNonOrderPayment) {
        // For credit/subscription purchases, verify the user matches the transaction
        if (transaction.userId !== user.id && transaction.userId !== user.userId) {
          throw new ForbiddenException('This payment does not belong to you');
        }
      } else {
        // Verify the calling user owns this order before capturing funds.
        await assertOrderAccess(this.prisma, transaction.orderId, user, 'buyer');
      }

      if (transaction.status === PaymentTransactionStatus.SUCCEEDED) {
        throw new BadRequestException('Order already captured');
      }

      // Capture the order
      const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
      request.requestBody({});

      const response = await client.execute(request);
      const captureResult = response.result;

      // Check if capture was successful
      const capture = captureResult.purchase_units[0].payments.captures[0];
      const isSuccess = capture.status === 'COMPLETED';

      if (isSuccess) {
        // Update transaction
        const updatedTransaction = await this.prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: PaymentTransactionStatus.SUCCEEDED,
            metadata: {
              ...(transaction.metadata as object),
              captureId: capture.id,
              captureStatus: capture.status,
              capturedAt: new Date().toISOString(),
            },
          },
        });

        this.logger.log(`PayPal order captured: ${paypalOrderId} -> ${capture.id}`);

        // NOTE: Post-payment processing (escrow, commissions, emails, etc.) is handled
        // by the controller calling PaymentService.processSuccessfulPayment() after this
        // method returns. This avoids circular dependency between PayPalService and PaymentService.

        return {
          success: true,
          orderId: transaction.orderId,
          transactionId: capture.id,
          // Return transaction data so the controller can pass it to processSuccessfulPayment
          transaction: {
            id: updatedTransaction.id,
            amount: updatedTransaction.amount,
            currency: updatedTransaction.currency,
          },
        };
      } else {
        throw new BadRequestException(`Payment capture failed with status: ${capture.status}`);
      }
    } catch (error) {
      this.logger.error('PayPal capture failed:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(`PayPal capture failed: ${error.message}`);
    }
  }

  /**
   * Get order details from PayPal
   */
  async getOrderDetails(paypalOrderId: string): Promise<any> {
    const client = this.getClient();

    try {
      const request = new paypal.orders.OrdersGetRequest(paypalOrderId);
      const response = await client.execute(request);
      return response.result;
    } catch (error) {
      this.logger.error('Failed to get PayPal order details:', error);
      throw new BadRequestException('Failed to get order details');
    }
  }

  /**
   * Refund a PayPal capture
   */
  async refundCapture(captureId: string, amount?: number, currency?: string): Promise<any> {
    const client = this.getClient();

    try {
      const request = new paypal.payments.CapturesRefundRequest(captureId);
      request.requestBody(
        amount && currency
          ? {
              amount: {
                value: amount.toFixed(2),
                currency_code: currency.toUpperCase(),
              },
            }
          : {}
      );

      const response = await client.execute(request);
      this.logger.log(`PayPal refund created: ${response.result.id} for capture: ${captureId}`);

      // Write audit trail: update PaymentTransaction status and Order.paymentStatus
      try {
        const txn = await this.prisma.paymentTransaction.findFirst({
          where: {
            paymentMethod: PaymentMethod.PAYPAL,
            metadata: {
              path: ['captureId'],
              equals: captureId,
            },
          },
          include: { order: true },
        });
        if (txn) {
          const isFullRefund = !amount || amount >= Number(txn.amount);
          await this.prisma.paymentTransaction.update({
            where: { id: txn.id },
            data: {
              status: isFullRefund
                ? PaymentTransactionStatus.REFUNDED
                : PaymentTransactionStatus.PARTIALLY_REFUNDED,
              refundedAmount: amount ? new Decimal(amount) : txn.amount,
              refundedAt: new Date(),
              metadata: {
                ...(txn.metadata as any),
                refundId: response.result.id,
                refundedAt: new Date().toISOString(),
                refundAmount: amount ?? 'full',
              } as any,
            },
          });
          await this.prisma.order.update({
            where: { id: txn.orderId },
            data: {
              paymentStatus: isFullRefund
                ? PaymentStatus.REFUNDED
                : PaymentStatus.PARTIALLY_REFUNDED,
            },
          });
          this.logger.log(
            `PayPal refund audit trail written for transaction ${txn.id}, order ${txn.orderId}`
          );

          // Reverse escrow if it exists (full refund → REFUNDED, partial → keep HELD)
          try {
            const escrow = await this.prisma.escrowTransaction.findFirst({
              where: { orderId: txn.orderId },
            });
            if (escrow && isFullRefund) {
              await this.prisma.escrowTransaction.update({
                where: { id: escrow.id },
                data: { status: 'REFUNDED' },
              });
              // Also update split allocations if they exist
              await this.prisma.escrowSplitAllocation.updateMany({
                where: { escrowTransactionId: escrow.id },
                data: { status: 'REFUNDED' },
              });
              this.logger.log(`Escrow reversed for order ${txn.orderId} (full refund)`);
            } else if (escrow) {
              this.logger.log(
                `Partial PayPal refund for order ${txn.orderId} — escrow remains ${escrow.status}`
              );
            }
          } catch (escrowError) {
            this.logger.error(`Escrow reversal failed for order ${txn.orderId}:`, escrowError);
            // Don't fail the refund if escrow update fails
          }

          // Cancel commissions on full refund
          if (isFullRefund) {
            try {
              await this.prisma.commission.updateMany({
                where: { transactionId: txn.id, paidOut: false },
                data: { status: 'CANCELLED' as any },
              });
              this.logger.log(`Commissions cancelled for transaction ${txn.id} (full refund)`);
            } catch (commissionError) {
              this.logger.error(
                `Commission cancellation failed for transaction ${txn.id}:`,
                commissionError
              );
            }
          }
        } else {
          this.logger.warn(
            `PayPal refund ${response.result.id}: no PaymentTransaction found for captureId ${captureId}`
          );
        }
      } catch (auditError) {
        this.logger.error(
          `PayPal refund audit trail failed for captureId ${captureId}:`,
          auditError
        );
        // Don't fail the refund response if audit write fails
      }

      return response.result;
    } catch (error) {
      this.logger.error('PayPal refund failed:', error);
      throw new BadRequestException(`PayPal refund failed: ${error.message}`);
    }
  }

  /**
   * Helper: Convert country name to ISO 2-letter code
   */
  private getCountryCode(countryName: string): string {
    // Simple mapping - expand as needed
    const mapping: Record<string, string> = {
      'United States': 'US',
      'United Kingdom': 'GB',
      Canada: 'CA',
      Australia: 'AU',
      Germany: 'DE',
      France: 'FR',
      Spain: 'ES',
      Italy: 'IT',
      Netherlands: 'NL',
      Belgium: 'BE',
      Switzerland: 'CH',
      Austria: 'AT',
      Sweden: 'SE',
      Norway: 'NO',
      Denmark: 'DK',
      Finland: 'FI',
      Ireland: 'IE',
      Poland: 'PL',
      Portugal: 'PT',
      Greece: 'GR',
      'Czech Republic': 'CZ',
      Hungary: 'HU',
      Romania: 'RO',
      Bulgaria: 'BG',
      Croatia: 'HR',
      Japan: 'JP',
      China: 'CN',
      India: 'IN',
      Brazil: 'BR',
      Mexico: 'MX',
      'South Africa': 'ZA',
      Singapore: 'SG',
      Malaysia: 'MY',
      Thailand: 'TH',
      Philippines: 'PH',
      Indonesia: 'ID',
      Vietnam: 'VN',
      'South Korea': 'KR',
      'New Zealand': 'NZ',
    };

    return mapping[countryName] || 'US'; // Default to US if not found
  }

  /**
   * Create a PayPal order for non-order payments (credits, subscriptions).
   * Unlike createOrder(), this does NOT require a NextPik order ID.
   * Stores metadata in the PaymentTransaction for post-capture processing.
   */
  async createCreditOrder(data: {
    amount: number;
    currency: string;
    userId: string;
    metadata: Record<string, string>;
    description: string;
  }): Promise<{ orderId: string; approvalUrl: string }> {
    const client = this.getClient();

    try {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: data.currency.toUpperCase(),
              value: data.amount.toFixed(2),
            },
            description: data.description,
          },
        ],
        application_context: {
          brand_name: 'NextPik',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: `${this.configService.get('FRONTEND_URL')}/seller/selling-credits/success?paypal=true`,
          cancel_url: `${this.configService.get('FRONTEND_URL')}/seller/selling-credits?canceled=true`,
        },
      });

      const response = await client.execute(request);
      const paypalOrder = response.result;

      const approvalUrl = paypalOrder.links?.find((link: any) => link.rel === 'approve')?.href;
      if (!approvalUrl) {
        throw new BadRequestException('Failed to get PayPal approval URL');
      }

      // Store as a PaymentTransaction without an orderId (credit purchase, not product order)
      await this.prisma.paymentTransaction.create({
        data: {
          userId: data.userId,
          paymentMethod: PaymentMethod.PAYPAL,
          paypalOrderId: paypalOrder.id,
          amount: new Decimal(data.amount),
          currency: data.currency.toUpperCase(),
          status: PaymentTransactionStatus.PENDING,
          metadata: {
            paypalOrderId: paypalOrder.id,
            ...data.metadata,
          },
        },
      });

      this.logger.log(
        `PayPal credit order created: ${paypalOrder.id} for user ${data.userId} ($${data.amount})`
      );

      return { orderId: paypalOrder.id, approvalUrl };
    } catch (error) {
      this.logger.error('PayPal credit order creation failed:', error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`PayPal credit order creation failed: ${error.message}`);
    }
  }
}
