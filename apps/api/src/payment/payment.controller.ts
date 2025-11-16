import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Create a payment intent
   * POST /payment/create-intent
   */
  @Post('create-intent')
  async createPaymentIntent(@Body() dto: CreatePaymentIntentDto) {
    return this.paymentService.createPaymentIntent(dto);
  }

  /**
   * Handle Stripe webhook
   * POST /payment/webhook
   */
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    const rawBody = request.rawBody;

    if (!rawBody) {
      throw new Error('No raw body');
    }

    return this.paymentService.handleWebhook(signature, rawBody);
  }

  /**
   * Get payment status for an order
   * GET /payment/status/:orderId
   */
  @Get('status/:orderId')
  async getPaymentStatus(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentStatus(orderId);
  }

  /**
   * Create a refund (Admin only - should add auth guard)
   * POST /payment/refund/:orderId
   */
  @Post('refund/:orderId')
  async createRefund(
    @Param('orderId') orderId: string,
    @Body() body: { amount?: number },
  ) {
    return this.paymentService.createRefund(orderId, body.amount);
  }
}
