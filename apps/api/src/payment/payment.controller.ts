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
  Request,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Create a payment intent
   * POST /payment/create-intent
   */
  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(@Body() dto: CreatePaymentIntentDto, @Request() req: any) {
    return this.paymentService.createPaymentIntent(dto, req.user.userId || req.user.id);
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
   * Create a refund (Admin only)
   * POST /payment/refund/:orderId
   */
  @Post('refund/:orderId')
  @UseGuards(JwtAuthGuard)
  async createRefund(
    @Param('orderId') orderId: string,
    @Body() body: { amount?: number; reason?: string },
  ) {
    return this.paymentService.createRefund(orderId, body.amount, body.reason);
  }

  /**
   * Get transaction history for an order
   * GET /payment/transactions/:orderId
   */
  @Get('transactions/:orderId')
  @UseGuards(JwtAuthGuard)
  async getTransactionHistory(@Param('orderId') orderId: string) {
    return this.paymentService.getTransactionHistory(orderId);
  }
}
