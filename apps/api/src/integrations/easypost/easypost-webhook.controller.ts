import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  HttpCode,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EasyPostTrackingService } from './easypost-tracking.service';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../../settings/settings.service';
import * as crypto from 'crypto';

@Controller('webhooks/easypost')
export class EasyPostWebhookController {
  private readonly logger = new Logger(EasyPostWebhookController.name);

  constructor(
    private readonly trackingService: EasyPostTrackingService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService
  ) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(@Body() payload: any, @Headers('x-hmac-signature') signature: string) {
    const eventId = payload.id;
    const eventType = payload.description;

    this.logger.log(`Received EasyPost webhook: ${eventType} (${eventId})`);

    // Verify signature if configured
    const webhookSecret = await this.getWebhookSecret();
    if (webhookSecret && signature) {
      const isValid = this.verifySignature(payload, signature, webhookSecret);
      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
        throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
      }
    }

    // Check for duplicate event (idempotency)
    const existingEvent = await this.prisma.easyPostWebhookLog.findUnique({
      where: { eventId },
    });

    if (existingEvent?.status === 'PROCESSED') {
      this.logger.log(`Event ${eventId} already processed, skipping`);
      return { received: true, duplicate: true };
    }

    // Log the event
    const webhookLog = await this.prisma.easyPostWebhookLog.upsert({
      where: { eventId },
      create: {
        eventId,
        eventType,
        payload,
        status: 'PENDING',
      },
      update: {
        status: 'PENDING',
      },
    });

    try {
      // Process based on event type
      await this.processEvent(eventType, payload);

      // Mark as processed
      await this.prisma.easyPostWebhookLog.update({
        where: { id: webhookLog.id },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });

      return { received: true, processed: true };
    } catch (error) {
      this.logger.error(`Error processing webhook ${eventId}:`, error);

      await this.prisma.easyPostWebhookLog.update({
        where: { id: webhookLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });

      // Return 200 to prevent retries for unrecoverable errors
      return { received: true, error: error.message };
    }
  }

  private async processEvent(eventType: string, payload: any) {
    const result = payload.result;

    switch (eventType) {
      case 'tracker.created':
      case 'tracker.updated':
        await this.trackingService.processTrackingUpdate(result.id, result);
        break;

      case 'insurance.purchased':
        this.logger.log(`Insurance purchased: ${result.id}`);
        break;

      case 'refund.successful':
        await this.handleRefundSuccess(result);
        break;

      case 'refund.rejected':
        await this.handleRefundRejected(result);
        break;

      default:
        this.logger.log(`Unhandled event type: ${eventType}`);
    }
  }

  private async handleRefundSuccess(result: any) {
    const shipment = await this.prisma.easyPostShipment.findFirst({
      where: { easypostShipmentId: result.shipment_id },
    });

    if (shipment) {
      await this.prisma.easyPostShipment.update({
        where: { id: shipment.id },
        data: { refundStatus: 'REFUNDED' },
      });
    }
  }

  private async handleRefundRejected(result: any) {
    const shipment = await this.prisma.easyPostShipment.findFirst({
      where: { easypostShipmentId: result.shipment_id },
    });

    if (shipment) {
      await this.prisma.easyPostShipment.update({
        where: { id: shipment.id },
        data: { refundStatus: 'REJECTED' },
      });
    }
  }

  private async getWebhookSecret(): Promise<string | null> {
    try {
      const setting = await this.settingsService.getSetting('easypost_webhook_secret');
      return (setting?.value as string) || this.configService.get('EASYPOST_WEBHOOK_SECRET');
    } catch {
      return this.configService.get('EASYPOST_WEBHOOK_SECRET');
    }
  }

  private verifySignature(payload: any, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    const expectedSignature = hmac.digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
}
