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

// EasyShip tracking status → internal meaning
// https://developers.easyship.com/reference/tracking-statuses
const EASYSHIP_STATUS_MAP: Record<string, 'label_purchased' | 'out_for_delivery' | 'delivered'> = {
  // Label created / picked up
  Pending: 'label_purchased',
  'Pickup in Progress': 'label_purchased',
  'Picked Up': 'label_purchased',
  // Out for delivery
  'Out For Delivery': 'out_for_delivery',
  // Delivered
  Delivered: 'delivered',
};

@Controller('webhooks/easyship')
export class EasyshipWebhookController {
  private readonly logger = new Logger(EasyshipWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService
  ) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-easyship-signature') signature: string,
    @Req() req: RawBodyRequest<Request>
  ) {
    this.logger.log(`Received EasyShip webhook: ${payload?.event}`);

    // Verify HMAC signature if secret is configured
    const secret = this.configService.get<string>('EASYSHIP_WEBHOOK_SECRET');
    if (secret && signature) {
      const rawBody = (req as any).rawBody as Buffer | undefined;
      if (rawBody) {
        const isValid = this.verifySignature(rawBody, signature, secret);
        if (!isValid) {
          this.logger.warn('Invalid EasyShip webhook signature');
          throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
        }
      }
    }

    try {
      await this.processEvent(payload);
      return { received: true };
    } catch (error) {
      this.logger.error('Error processing EasyShip webhook:', error);
      return { received: true, error: error.message };
    }
  }

  private async processEvent(payload: any) {
    const event: string = payload?.event;
    const shipmentData = payload?.shipment ?? payload;
    const trackingNumber: string = shipmentData?.tracking_number;

    switch (event) {
      // Label was successfully created → buyer email: "being prepared"
      case 'shipment.label.created':
        if (!trackingNumber) return;
        await this.sendBuyerEmail(trackingNumber, 'label_purchased', shipmentData);
        break;

      // Tracking status changed → map to out_for_delivery or delivered
      case 'shipment.tracking.status.changed':
      case 'shipment.tracking.checkpoints.created': {
        if (!trackingNumber) return;
        const rawStatus: string = shipmentData?.last_tracking_info?.status ?? shipmentData?.status;
        if (!rawStatus) return;
        const internalStatus = EASYSHIP_STATUS_MAP[rawStatus];
        if (!internalStatus) {
          this.logger.log(`Ignoring EasyShip status: ${rawStatus}`);
          return;
        }
        await this.sendBuyerEmail(trackingNumber, internalStatus, shipmentData);
        break;
      }

      default:
        this.logger.log(`Unhandled EasyShip event: ${event}`);
    }
  }

  private async sendBuyerEmail(
    trackingNumber: string,
    status: 'label_purchased' | 'out_for_delivery' | 'delivered',
    shipmentData: any
  ) {
    try {
      // Resolve order via delivery tracking number
      const order = await this.prisma.order.findFirst({
        where: { delivery: { trackingNumber } },
        include: { user: true },
      });

      if (!order?.user) {
        this.logger.warn(`No order found for EasyShip tracking number: ${trackingNumber}`);
        return;
      }

      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      const customerName = `${order.user.firstName} ${order.user.lastName}`;
      const carrier: string = shipmentData.courier_name ?? shipmentData.carrier ?? undefined;

      if (status === 'label_purchased') {
        await this.emailService.sendOrderShipped(order.user.email, {
          orderNumber: order.orderNumber,
          customerName,
          orderId: order.id,
          trackingNumber,
          carrier,
        });
      } else if (status === 'out_for_delivery') {
        await this.emailService.sendOrderOutForDelivery(order.user.email, {
          orderNumber: order.orderNumber,
          customerName,
          orderId: order.id,
          trackingNumber,
          carrier,
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
      this.logger.error('Failed to send buyer email from EasyShip webhook:', error);
    }
  }

  private verifySignature(rawBody: Buffer, signature: string, secret: string): boolean {
    try {
      const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }
}
