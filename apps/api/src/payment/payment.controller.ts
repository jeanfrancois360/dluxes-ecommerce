import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ==========================================
  // PAYMENT METHODS MANAGEMENT
  // ==========================================

  /**
   * Get saved payment methods for current user
   * GET /payment/methods
   */
  @Get('methods')
  @UseGuards(JwtAuthGuard)
  async getPaymentMethods(@Request() req: any) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.paymentService.listPaymentMethods(userId);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get payment methods',
      };
    }
  }

  /**
   * Create a SetupIntent for adding a new card
   * POST /payment/methods/setup
   */
  @Post('methods/setup')
  @UseGuards(JwtAuthGuard)
  async createSetupIntent(@Request() req: any) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.paymentService.createSetupIntent(userId);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create setup intent',
      };
    }
  }

  /**
   * Set a payment method as default
   * PATCH /payment/methods/:id/default
   */
  @Patch('methods/:id/default')
  @UseGuards(JwtAuthGuard)
  async setDefaultPaymentMethod(@Request() req: any, @Param('id') paymentMethodId: string) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.paymentService.setDefaultPaymentMethod(userId, paymentMethodId);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to set default payment method',
      };
    }
  }

  /**
   * Remove a saved payment method
   * DELETE /payment/methods/:id
   */
  @Delete('methods/:id')
  @UseGuards(JwtAuthGuard)
  async removePaymentMethod(@Request() req: any, @Param('id') paymentMethodId: string) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.paymentService.removePaymentMethod(userId, paymentMethodId);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove payment method',
      };
    }
  }

  /**
   * Save payment method after successful payment
   * POST /payment/methods/save-after-payment
   */
  @Post('methods/save-after-payment')
  @UseGuards(JwtAuthGuard)
  async savePaymentMethodAfterPayment(
    @Request() req: any,
    @Body() body: { paymentIntentId: string; nickname?: string },
  ) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.paymentService.savePaymentMethodAfterPayment(
        body.paymentIntentId,
        userId,
        body.nickname,
      );
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save payment method',
      };
    }
  }

  /**
   * Update card nickname
   * PATCH /payment/methods/:id/nickname
   */
  @Patch('methods/:id/nickname')
  @UseGuards(JwtAuthGuard)
  async updateCardNickname(
    @Request() req: any,
    @Param('id') paymentMethodId: string,
    @Body() body: { nickname: string },
  ) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.paymentService.updateCardNickname(
        userId,
        paymentMethodId,
        body.nickname,
      );
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update card nickname',
      };
    }
  }

  /**
   * Get detailed payment method information
   * GET /payment/methods/:id/details
   */
  @Get('methods/:id/details')
  @UseGuards(JwtAuthGuard)
  async getSavedPaymentMethodDetails(@Request() req: any, @Param('id') paymentMethodId: string) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.paymentService.getSavedPaymentMethodDetails(userId, paymentMethodId);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get payment method details',
      };
    }
  }

  /**
   * Create a payment intent with a saved payment method
   * POST /payment/create-intent-saved
   */
  @Post('create-intent-saved')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntentWithSavedMethod(
    @Body() body: CreatePaymentIntentDto & { paymentMethodId: string },
    @Request() req: any,
  ) {
    try {
      const userId = req.user.userId || req.user.id;
      const { paymentMethodId, ...dto } = body;
      const data = await this.paymentService.createPaymentIntentWithSavedMethod(dto, userId, paymentMethodId);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create payment intent',
      };
    }
  }

  /**
   * Get supported payment currencies
   * GET /payment/currencies
   */
  @Get('currencies')
  async getSupportedCurrencies() {
    return this.paymentService.getSupportedPaymentCurrencies();
  }

  /**
   * Create a payment intent with multi-currency support
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

  /**
   * Get webhook statistics for monitoring (Admin only)
   * GET /payment/webhooks/statistics
   */
  @Get('webhooks/statistics')
  @UseGuards(JwtAuthGuard)
  async getWebhookStatistics(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days) : 7;
    return this.paymentService.getWebhookStatistics(daysNum);
  }

  /**
   * Get webhook events with pagination (Admin only)
   * GET /payment/webhooks
   */
  @Get('webhooks')
  @UseGuards(JwtAuthGuard)
  async getWebhookEvents(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('eventType') eventType?: string,
  ) {
    return this.paymentService.getWebhookEvents({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status: status as any,
      eventType,
    });
  }

  /**
   * Get webhook event details by ID (Admin only)
   * GET /payment/webhooks/:id
   */
  @Get('webhooks/:id')
  @UseGuards(JwtAuthGuard)
  async getWebhookEvent(@Param('id') id: string) {
    return this.paymentService.getWebhookEvent(id);
  }

  /**
   * Retry a failed webhook event (Admin only)
   * POST /payment/webhooks/:id/retry
   */
  @Post('webhooks/:id/retry')
  @UseGuards(JwtAuthGuard)
  async retryWebhookEvent(@Param('id') id: string) {
    return this.paymentService.retryWebhookEvent(id);
  }

  /**
   * Get payment health metrics (Admin only)
   * GET /payment/health
   */
  @Get('health')
  @UseGuards(JwtAuthGuard)
  async getPaymentHealthMetrics(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days) : 30;
    return this.paymentService.getPaymentHealthMetrics(daysNum);
  }
}
