import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { GelatoService } from './gelato.service';
import { GelatoOrdersService } from './gelato-orders.service';
import { PrismaService } from '../database/prisma.service';
import { SellerGelatoSettingsService } from './seller-gelato-settings.service';

/**
 * Gelato Webhook Controller
 *
 * Supports both platform-wide and per-seller webhook endpoints:
 * - POST /webhooks/gelato - Platform webhook (backward compatible)
 * - POST /webhooks/gelato/:sellerIdentifier - Seller-specific webhook
 *
 * v2.9.0 - Added per-seller webhook routing
 */
@Controller('webhooks/gelato')
export class GelatoWebhookController {
  private readonly logger = new Logger(GelatoWebhookController.name);

  constructor(
    private readonly gelatoService: GelatoService,
    private readonly ordersService: GelatoOrdersService,
    private readonly prisma: PrismaService,
    private readonly sellerSettingsService: SellerGelatoSettingsService
  ) {}

  /**
   * Platform webhook endpoint (backward compatible)
   * POST /webhooks/gelato
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handlePlatformWebhook(
    @Headers('x-webhook-secret') webhookSecret: string,
    @Body() body: any
  ) {
    this.logger.log(`Received platform Gelato webhook: ${body?.event}`);

    // Verify platform webhook secret
    if (!this.gelatoService.verifyPlatformWebhookToken(webhookSecret || '')) {
      this.logger.warn('Invalid platform webhook token');
      throw new UnauthorizedException('Invalid webhook token');
    }

    try {
      const result = await this.ordersService.processWebhook(body);
      this.logger.log(
        `Platform webhook processed: ${body.event} - ${result.processed ? 'success' : result.reason}`
      );
      return { received: true, ...result };
    } catch (error) {
      this.logger.error(`Platform webhook processing failed: ${error.message}`);
      return { received: true, error: error.message };
    }
  }

  /**
   * Seller-specific webhook endpoint
   * POST /webhooks/gelato/:sellerIdentifier
   *
   * The sellerIdentifier is a base64-encoded storeId.
   * This allows sellers to configure unique webhook URLs in their Gelato dashboard.
   *
   * Example: POST /webhooks/gelato/Y2xrM3RleHQxMjM= (base64 of "clk3text123")
   */
  @Post(':sellerIdentifier')
  @HttpCode(HttpStatus.OK)
  async handleSellerWebhook(
    @Param('sellerIdentifier') sellerIdentifier: string,
    @Headers('x-webhook-secret') webhookSecret: string,
    @Body() body: any
  ) {
    this.logger.log(
      `Received seller Gelato webhook: ${body?.event} (identifier: ${sellerIdentifier})`
    );

    // Decode storeId from base64
    let storeId: string;
    try {
      storeId = Buffer.from(sellerIdentifier, 'base64').toString('utf-8');
    } catch (error) {
      this.logger.error(`Invalid seller identifier: ${sellerIdentifier}`);
      throw new BadRequestException('Invalid seller identifier');
    }

    // Load seller's Gelato settings
    const settings = await this.prisma.sellerGelatoSettings.findUnique({
      where: { storeId },
    });

    if (!settings || !settings.isEnabled) {
      this.logger.warn(`Webhook for non-configured seller: ${storeId}`);
      throw new UnauthorizedException('Gelato integration not configured for this seller');
    }

    if (!settings.gelatoWebhookSecret) {
      this.logger.warn(`Seller ${storeId} has no webhook secret configured`);
      // Allow webhook processing without verification if no secret is set
      // This matches Gelato's optional webhook secret behavior
    } else {
      // Decrypt and verify seller's webhook secret
      const decryptedSecret = await this.sellerSettingsService.getDecryptedWebhookSecret(storeId);

      if (!this.gelatoService.verifySellerWebhookToken(webhookSecret || '', decryptedSecret)) {
        this.logger.warn(`Invalid webhook token for seller ${storeId}`);
        throw new UnauthorizedException('Invalid webhook token');
      }
    }

    try {
      const result = await this.ordersService.processWebhook(body);
      this.logger.log(
        `Seller webhook processed (${storeId}): ${body.event} - ${result.processed ? 'success' : result.reason}`
      );
      return { received: true, ...result };
    } catch (error) {
      this.logger.error(`Seller webhook processing failed (${storeId}): ${error.message}`);
      return { received: true, error: error.message };
    }
  }
}
