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
import { PayPalService } from './paypal.service';
import { PaymentMonitorService } from './payment-monitor.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly paypalService: PayPalService,
    private readonly paymentMonitorService: PaymentMonitorService,
  ) {}

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

  // ==========================================
  // PAYPAL PAYMENT INTEGRATION
  // ==========================================

  /**
   * Create PayPal order
   * POST /payment/paypal/create-order
   */
  @Post('paypal/create-order')
  @UseGuards(JwtAuthGuard)
  async createPayPalOrder(
    @Body()
    body: {
      orderId: string;
      amount: number;
      currency: string;
      items?: Array<{ name: string; quantity: number; price: number }>;
      shippingAddress?: any;
    },
  ) {
    try {
      const data = await this.paypalService.createOrder(body);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create PayPal order',
      };
    }
  }

  /**
   * Capture PayPal order after user approval
   * POST /payment/paypal/capture/:paypalOrderId
   */
  @Post('paypal/capture/:paypalOrderId')
  @UseGuards(JwtAuthGuard)
  async capturePayPalOrder(@Param('paypalOrderId') paypalOrderId: string) {
    try {
      const data = await this.paypalService.captureOrder(paypalOrderId);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to capture PayPal order',
      };
    }
  }

  /**
   * Get PayPal order details
   * GET /payment/paypal/order/:paypalOrderId
   */
  @Get('paypal/order/:paypalOrderId')
  @UseGuards(JwtAuthGuard)
  async getPayPalOrderDetails(@Param('paypalOrderId') paypalOrderId: string) {
    try {
      const data = await this.paypalService.getOrderDetails(paypalOrderId);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get PayPal order details',
      };
    }
  }

  /**
   * Refund a PayPal capture
   * POST /payment/paypal/refund/:captureId
   */
  @Post('paypal/refund/:captureId')
  @UseGuards(JwtAuthGuard)
  async refundPayPalCapture(
    @Param('captureId') captureId: string,
    @Body() body: { amount?: number; currency?: string },
  ) {
    try {
      const data = await this.paypalService.refundCapture(captureId, body.amount, body.currency);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to refund PayPal capture',
      };
    }
  }

  // ==========================================
  // PAYMENT CAPTURE MONITORING (ADMIN)
  // ==========================================

  /**
   * Manually capture payment for an order
   * POST /payment/orders/:orderId/capture
   * Admin only
   */
  @Post('orders/:orderId/capture')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async captureOrderPayment(
    @Param('orderId') orderId: string,
    @Request() req: any,
  ) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.paymentService.capturePaymentWithStrategy(
        orderId,
        'MANUAL',
        userId,
      );
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to capture payment',
      };
    }
  }

  /**
   * Get orders approaching payment authorization expiry
   * GET /payment/monitoring/approaching-expiry
   * Admin only - for dashboard monitoring
   */
  @Get('monitoring/approaching-expiry')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getOrdersApproachingExpiry() {
    try {
      const data = await this.paymentMonitorService.getOrdersApproachingExpiry();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get approaching expiry orders',
      };
    }
  }

  /**
   * Get uncaptured payment statistics
   * GET /payment/monitoring/stats
   * Admin only - overview statistics
   */
  @Get('monitoring/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getUncapturedPaymentStats() {
    try {
      const data = await this.paymentMonitorService.getUncapturedPaymentStats();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get payment stats',
      };
    }
  }
}
