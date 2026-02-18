import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { GelatoService } from './gelato.service';
import { GelatoOrdersService } from './gelato-orders.service';

@Controller('webhooks/gelato')
export class GelatoWebhookController {
  private readonly logger = new Logger(GelatoWebhookController.name);

  constructor(
    private readonly gelatoService: GelatoService,
    private readonly ordersService: GelatoOrdersService
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Headers('x-webhook-secret') webhookSecret: string, @Body() body: any) {
    this.logger.log(`Received Gelato webhook: ${body?.event}`);

    if (!this.gelatoService.verifyWebhookToken(webhookSecret || '')) {
      this.logger.warn('Invalid webhook token');
      throw new UnauthorizedException('Invalid webhook token');
    }

    try {
      const result = await this.ordersService.processWebhook(body);
      this.logger.log(
        `Webhook processed: ${body.event} - ${result.processed ? 'success' : result.reason}`
      );
      return { received: true, ...result };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      return { received: true, error: error.message };
    }
  }
}
