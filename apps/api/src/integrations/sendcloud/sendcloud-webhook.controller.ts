import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  Logger,
  HttpCode,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// SendCloud parcel status IDs → internal meaning
// https://support.sendcloud.com/hc/en-us/articles/360024674971
const STATUS_LABEL_PURCHASED = new Set([1, 2000, 2001]); // Announced, Being sorted
const STATUS_OUT_FOR_DELIVERY = new Set([80, 2300]); // At sorting facility / out for delivery
const STATUS_DELIVERED = new Set([11, 2100]); // Delivered

@Controller('webhooks/sendcloud')
export class SendcloudWebhookController {
  private readonly logger = new Logger(SendcloudWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService
  ) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Body() payload: any,
    @Headers('sendcloud-signature') rawSignature: string,
    @Req() req: RawBodyRequest<Request>
  ) {
    this.logger.log(`Received SendCloud webhook: ${payload?.action}`);

    // Verify HMAC signature if secret is configured
    const secret = this.configService.get<string>('SENDCLOUD_WEBHOOK_SECRET');
    if (secret && rawSignature) {
      const rawBody = (req as any).rawBody as Buffer | undefined;
      if (rawBody) {
        const isValid = this.verifySignature(rawBody, rawSignature, secret);
        if (!isValid) {
          this.logger.warn('Invalid SendCloud webhook signature');
          throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
        }
      }
    }

    try {
      await this.processEvent(payload);
      return { received: true };
    } catch (error) {
      this.logger.error('Error processing SendCloud webhook:', error);
      // Return 200 to prevent retries for non-transient errors
      return { received: true, error: error.message };
    }
  }

  private async processEvent(payload: any) {
    if (payload?.action !== 'parcel_status_changed') {
      this.logger.log(`Unhandled SendCloud action: ${payload?.action}`);
      return;
    }

    const parcel = payload.parcel;
    if (!parcel) return;

    const statusId: number = parcel.status?.id;
    const trackingNumber: string = parcel.tracking_number;
    const orderReference: string = parcel.order_number; // This is our order number

    if (!orderReference && !trackingNumber) return;

    const internalStatus = this.mapStatus(statusId);
    if (!internalStatus) {
      this.logger.log(`Ignoring SendCloud status id ${statusId}`);
      return;
    }

    await this.sendBuyerEmail(orderReference, trackingNumber, internalStatus, parcel);
  }

  private mapStatus(statusId: number): 'label_purchased' | 'out_for_delivery' | 'delivered' | null {
    if (STATUS_LABEL_PURCHASED.has(statusId)) return 'label_purchased';
    if (STATUS_OUT_FOR_DELIVERY.has(statusId)) return 'out_for_delivery';
    if (STATUS_DELIVERED.has(statusId)) return 'delivered';
    return null;
  }

  private async sendBuyerEmail(
    orderNumber: string,
    trackingNumber: string,
    status: 'label_purchased' | 'out_for_delivery' | 'delivered',
    parcel: any
  ) {
    try {
      // Look up order by order number or by tracking number in delivery table
      const order = await this.prisma.order.findFirst({
        where: orderNumber
          ? { orderNumber }
          : {
              delivery: { trackingNumber },
            },
        include: { user: true },
      });

      if (!order?.user) {
        this.logger.warn(
          `No order found for SendCloud webhook (orderNumber=${orderNumber}, tracking=${trackingNumber})`
        );
        return;
      }

      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      const customerName = `${order.user.firstName} ${order.user.lastName}`;

      if (status === 'label_purchased') {
        await this.emailService.sendOrderShipped(order.user.email, {
          orderNumber: order.orderNumber,
          customerName,
          orderId: order.id,
          trackingNumber: trackingNumber || undefined,
          carrier: parcel.carrier?.code || undefined,
        });
      } else if (status === 'out_for_delivery') {
        await this.emailService.sendOrderOutForDelivery(order.user.email, {
          orderNumber: order.orderNumber,
          customerName,
          orderId: order.id,
          trackingNumber: trackingNumber || undefined,
          carrier: parcel.carrier?.code || undefined,
        });
      } else if (status === 'delivered') {
        const reviewUrl = `${frontendUrl}/account/orders/${order.id}#review`;
        await this.emailService.sendOrderDelivered(order.user.email, {
          orderNumber: order.orderNumber,
          customerName,
          orderId: order.id,
          reviewUrl,
        });

        // Update delivery record
        await this.prisma.delivery.updateMany({
          where: { orderId: order.id },
          data: { currentStatus: 'DELIVERED', deliveredAt: new Date() },
        });
      }
    } catch (error) {
      this.logger.error('Failed to send buyer email from SendCloud webhook:', error);
    }
  }

  private verifySignature(rawBody: Buffer, signature: string, secret: string): boolean {
    try {
      // SendCloud signature format: "t=<timestamp>,v1=<hmac_hex>"
      const parts = Object.fromEntries(signature.split(',').map((p) => p.split('=')));
      const timestamp = parts['t'];
      const receivedHmac = parts['v1'];

      if (!timestamp || !receivedHmac) return false;

      const payload = `${timestamp}.${rawBody.toString('utf8')}`;
      const expectedHmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      return crypto.timingSafeEqual(Buffer.from(receivedHmac), Buffer.from(expectedHmac));
    } catch {
      return false;
    }
  }
}
