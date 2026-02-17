import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { GelatoService } from './gelato.service';
import { GelatoOrdersService } from './gelato-orders.service';
import { GelatoWebhookPayload } from './interfaces';

@Controller('webhooks/gelato')
export class GelatoWebhookController {
  private readonly logger = new Logger(GelatoWebhookController.name);

  constructor(
    private readonly gelatoService: GelatoService,
    private readonly ordersService: GelatoOrdersService
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-gelato-signature') signature: string,
    @Body() body: GelatoWebhookPayload
  ) {
    this.logger.log(`Received Gelato webhook: ${body.event}`);

    const rawBody = req.rawBody?.toString() || JSON.stringify(body);

    if (signature && !this.gelatoService.verifyWebhookSignature(rawBody, signature)) {
      this.logger.warn('Invalid webhook signature');
      throw new UnauthorizedException('Invalid webhook signature');
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
