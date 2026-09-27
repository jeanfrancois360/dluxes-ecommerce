import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SellerCreditsService } from './seller-credits.service';
import { PayPalService } from '../payment/paypal.service';

/**
 * Seller controller for managing credits and subscriptions
 */
@Controller('seller/credits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class SellerCreditsController {
  constructor(
    private readonly sellerCreditsService: SellerCreditsService,
    private readonly paypalService: PayPalService
  ) {}

  /**
   * Get current credit balance and status
   * GET /seller/credits
   */
  @Get()
  async getCreditBalance(@Req() req: any) {
    return this.sellerCreditsService.getCreditBalance(req.user.id);
  }

  /**
   * Get credit transaction history
   * GET /seller/credits/history?page=1&limit=20
   */
  @Get('history')
  async getCreditHistory(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.sellerCreditsService.getCreditHistory(req.user.id, pageNum, limitNum);
  }

  /**
   * Get current credit price
   * GET /seller/credits/price
   */
  @Get('price')
  async getCreditPrice() {
    const price = await this.sellerCreditsService.getCreditPrice();

    return {
      success: true,
      data: {
        pricePerMonth: price,
        currency: 'USD',
      },
    };
  }

  /**
   * Get seller status (approved, has credits, can publish)
   * GET /seller/credits/status
   */
  @Get('status')
  async getSellingStatus(@Req() req: any) {
    const balance = await this.sellerCreditsService.getCreditBalance(req.user.id);

    return {
      success: true,
      data: {
        approved: balance.data.storeStatus === 'ACTIVE',
        hasCredits: balance.data.creditsBalance > 0,
        canPublish: balance.data.canPublish,
        inGracePeriod: balance.data.inGracePeriod,
        graceEndsAt: balance.data.graceEndsAt,
        creditsBalance: balance.data.creditsBalance,
        expiresAt: balance.data.expiresAt,
      },
    };
  }

  /**
   * Create Stripe Checkout Session in setup mode for card capture
   * POST /seller/credits/setup-card
   * Captures card without charging — required before listing with promotion credits
   */
  @Post('setup-card')
  @HttpCode(HttpStatus.OK)
  async createCardSetupSession(@Req() req: any) {
    return this.sellerCreditsService.createCardSetupSession(req.user.id);
  }

  /**
   * Create Stripe Checkout Session for credit purchase
   * POST /seller/credits/checkout
   * Body: { months: number }
   */
  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  async createCheckoutSession(@Req() req: any, @Body() body: { months: number }) {
    const { months } = body;

    // Validate months
    if (!months || typeof months !== 'number' || months < 1 || months > 12) {
      return {
        success: false,
        message: 'Months must be a number between 1 and 12',
      };
    }

    return this.sellerCreditsService.createCheckoutSession(req.user.id, months);
  }

  /**
   * Verify Stripe session and get purchase details
   * GET /seller/credits/verify-session?session_id=xxx
   */
  @Get('verify-session')
  async verifySession(@Req() req: any, @Query('session_id') sessionId: string) {
    if (!sessionId) {
      return {
        success: false,
        message: 'Session ID is required',
      };
    }

    return this.sellerCreditsService.verifyAndProcessSession(req.user.id, sessionId);
  }

  // ==========================================
  // PAYPAL CREDIT PURCHASE
  // ==========================================

  /**
   * Create PayPal order for credit purchase
   * POST /seller/credits/paypal/create-order
   * Body: { months: number }
   */
  @Post('paypal/create-order')
  @HttpCode(HttpStatus.OK)
  async createPayPalOrder(@Req() req: any, @Body() body: { months: number }) {
    const { months } = body;
    if (!months || typeof months !== 'number' || months < 1 || months > 12) {
      return { success: false, message: 'Months must be a number between 1 and 12' };
    }

    // Get validated credit purchase data
    const creditData = await this.sellerCreditsService.createPayPalCreditOrder(req.user.id, months);
    const { amount, currency, storeId, userId, description } = creditData.data;

    // Create a placeholder order in the system to get an orderId for PayPal
    // We reuse the PayPal service's createOrder which needs an orderId
    // For credits, we create a PayPal order directly
    const paypalResult = await this.paypalService.createCreditOrder({
      amount,
      currency,
      userId,
      metadata: {
        type: 'seller_credits',
        creditMonths: months.toString(),
        creditStoreId: storeId,
        userId,
      },
      description,
    });

    return { success: true, data: paypalResult };
  }

  /**
   * Capture PayPal order and process credit purchase
   * POST /seller/credits/paypal/capture
   * Body: { paypalOrderId: string }
   */
  @Post('paypal/capture')
  @HttpCode(HttpStatus.OK)
  async capturePayPalOrder(@Req() req: any, @Body() body: { paypalOrderId: string }) {
    if (!body.paypalOrderId) {
      return { success: false, message: 'PayPal order ID is required' };
    }

    return this.sellerCreditsService.capturePayPalCreditOrder(
      req.user.id,
      body.paypalOrderId,
      this.paypalService
    );
  }
}
