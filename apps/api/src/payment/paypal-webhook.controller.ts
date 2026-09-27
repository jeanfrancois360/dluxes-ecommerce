import {
  Controller,
  Post,
  Headers,
  Req,
  RawBodyRequest,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PayPalWebhookService } from './paypal-webhook.service';

/**
 * PayPal Webhook Controller
 *
 * Receives PayPal webhook events at POST /webhooks/paypal.
 * No JWT auth — authenticated via PayPal HMAC signature verification.
 *
 * Events handled:
 *   PAYMENT.CAPTURE.COMPLETED  — Capture confirmed
 *   PAYMENT.CAPTURE.DENIED     — Capture denied
 *   PAYMENT.CAPTURE.REFUNDED   — Refund completed
 *   PAYMENT.CAPTURE.REVERSED   — Chargeback/reversal
 *   CUSTOMER.DISPUTE.CREATED   — Dispute opened
 *   CUSTOMER.DISPUTE.RESOLVED  — Dispute resolved
 *   CUSTOMER.DISPUTE.UPDATED   — Dispute status change
 */
@Controller('webhooks/paypal')
export class PayPalWebhookController {
  private readonly logger = new Logger(PayPalWebhookController.name);

  constructor(private readonly paypalWebhookService: PayPalWebhookService) {}

  /**
   * POST /webhooks/paypal
   *
   * SECURITY: Authenticated via PayPal signature verification (not JWT).
   * Do NOT add @UseGuards(JwtAuthGuard) — it will break PayPal webhook delivery.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers() headers: Record<string, string>,
    @Req() request: RawBodyRequest<Request>
  ) {
    const rawBody = request.rawBody;

    if (!rawBody) {
      this.logger.error('PayPal webhook received with no raw body');
      return { received: false, error: 'No raw body' };
    }

    return this.paypalWebhookService.handleWebhookEvent(headers, rawBody.toString());
  }
}
