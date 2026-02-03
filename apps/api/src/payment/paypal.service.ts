import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from '@paypal/checkout-server-sdk';
import { PrismaService } from '../database/prisma.service';
import { PaymentMethod, PaymentStatus, PaymentTransactionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PayPalService {
  private client: paypal.core.PayPalHttpClient | null = null;
  private readonly logger = new Logger(PayPalService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
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
      throw new BadRequestException('PayPal is not configured. Please add PayPal credentials to environment variables.');
    }
    return this.client;
  }

  /**
   * Create PayPal order
   */
  async createOrder(data: {
    orderId: string;
    amount: number;
    currency: string;
    items?: Array<{ name: string; quantity: number; price: number }>;
    shippingAddress?: any;
  }): Promise<{ orderId: string; approvalUrl: string }> {
    const client = this.getClient();

    try {
      // Validate currency is supported by PayPal
      const supportedCurrencies = [
        'AUD', 'BRL', 'CAD', 'CNY', 'CZK', 'DKK', 'EUR', 'HKD', 'HUF',
        'ILS', 'JPY', 'MYR', 'MXN', 'TWD', 'NZD', 'NOK', 'PHP', 'PLN',
        'GBP', 'RUB', 'SGD', 'SEK', 'CHF', 'THB', 'USD',
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
              breakdown: data.items
                ? {
                    item_total: {
                      currency_code: data.currency.toUpperCase(),
                      value: data.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2),
                    },
                  }
                : undefined,
            },
            items: data.items?.map((item) => ({
              name: item.name,
              unit_amount: {
                currency_code: data.currency.toUpperCase(),
                value: item.price.toFixed(2),
              },
              quantity: item.quantity.toString(),
            })),
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

      this.logger.log(`PayPal order created: ${paypalOrder.id} for internal order: ${data.orderId}`);

      // Save PayPal transaction
      await this.prisma.paymentTransaction.create({
        data: {
          orderId: data.orderId,
          userId: data.orderId, // Will be updated with actual userId later
          paymentMethod: PaymentMethod.PAYPAL,
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
  async captureOrder(paypalOrderId: string): Promise<{ success: boolean; orderId: string; transactionId: string }> {
    const client = this.getClient();

    try {
      // Find our order by PayPal order ID (stored in metadata)
      const transactions = await this.prisma.paymentTransaction.findMany({
        where: {
          paymentMethod: PaymentMethod.PAYPAL,
        },
        include: { order: true },
      });

      const transaction = transactions.find((t) => {
        const metadata = t.metadata as any;
        return metadata?.paypalOrderId === paypalOrderId;
      });

      if (!transaction) {
        throw new BadRequestException('Order not found');
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
        await this.prisma.paymentTransaction.update({
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

        // Update order payment status
        await this.prisma.order.update({
          where: { id: transaction.orderId },
          data: {
            paymentStatus: PaymentStatus.PAID,
            status: 'PROCESSING', // Move to PROCESSING after payment
          },
        });

        this.logger.log(`PayPal order captured: ${paypalOrderId} -> ${capture.id}`);

        return {
          success: true,
          orderId: transaction.orderId,
          transactionId: capture.id,
        };
      } else {
        throw new BadRequestException(`Payment capture failed with status: ${capture.status}`);
      }
    } catch (error) {
      this.logger.error('PayPal capture failed:', error);
      if (error instanceof BadRequestException) {
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
      'Canada': 'CA',
      'Australia': 'AU',
      'Germany': 'DE',
      'France': 'FR',
      'Spain': 'ES',
      'Italy': 'IT',
      'Netherlands': 'NL',
      'Belgium': 'BE',
      'Switzerland': 'CH',
      'Austria': 'AT',
      'Sweden': 'SE',
      'Norway': 'NO',
      'Denmark': 'DK',
      'Finland': 'FI',
      'Ireland': 'IE',
      'Poland': 'PL',
      'Portugal': 'PT',
      'Greece': 'GR',
      'Czech Republic': 'CZ',
      'Hungary': 'HU',
      'Romania': 'RO',
      'Bulgaria': 'BG',
      'Croatia': 'HR',
      'Japan': 'JP',
      'China': 'CN',
      'India': 'IN',
      'Brazil': 'BR',
      'Mexico': 'MX',
      'South Africa': 'ZA',
      'Singapore': 'SG',
      'Malaysia': 'MY',
      'Thailand': 'TH',
      'Philippines': 'PH',
      'Indonesia': 'ID',
      'Vietnam': 'VN',
      'South Korea': 'KR',
      'New Zealand': 'NZ',
    };

    return mapping[countryName] || 'US'; // Default to US if not found
  }
}
