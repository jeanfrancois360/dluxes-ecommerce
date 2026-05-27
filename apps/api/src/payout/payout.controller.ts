import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { PayoutSchedulerService } from './payout-scheduler.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PayoutFrequency } from '@prisma/client';

@Controller('payouts')
export class PayoutController {
  constructor(private readonly payoutService: PayoutSchedulerService) {}

  /**
   * Get seller's pending payout amount
   */
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  async getPendingPayout(@Request() req) {
    return this.payoutService.getSellerPendingPayout(req.user.userId);
  }

  /**
   * Get payout schedule configuration (Sellers can view)
   */
  @Get('schedule')
  async getPayoutSchedule() {
    return this.payoutService.getPayoutConfig();
  }

  // ========================================================================
  // Seller Endpoints (v2.11.1)
  // ========================================================================

  /**
   * Get seller's payout history
   * @route GET /payouts/seller/history
   */
  @Get('seller/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async getSellerHistory(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string
  ) {
    const userId = req.user.userId || req.user.id;
    return this.payoutService.getSellerPayoutHistory(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status
    );
  }

  /**
   * Get seller's payout statistics
   * @route GET /payouts/seller/stats
   */
  @Get('seller/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async getSellerStats(@Request() req) {
    const userId = req.user.userId || req.user.id;
    return this.payoutService.getSellerPayoutStats(userId);
  }

  /**
   * Get seller's eligible commissions for next payout
   * @route GET /payouts/seller/eligible-commissions
   */
  @Get('seller/eligible-commissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async getEligibleCommissions(@Request() req) {
    const userId = req.user.userId || req.user.id;
    return this.payoutService.getEligibleCommissions(userId);
  }

  /**
   * Request manual payout
   * @route POST /payouts/seller/request
   */
  @Post('seller/request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async requestPayout(@Request() req) {
    const userId = req.user.userId || req.user.id;
    return this.payoutService.requestManualPayout(userId);
  }

  // ========================================================================
  // Admin Endpoints
  // ========================================================================

  /**
   * Get all payouts (Admin only)
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllPayouts(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('status') status?: string
  ) {
    return this.payoutService.getAllPayouts({
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      status,
    });
  }

  /**
   * Manually trigger payout processing (Admin only)
   * Creates payout records for all eligible sellers
   */
  @Post('admin/process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async processPayouts(@Request() req) {
    return this.payoutService.processScheduledPayouts();
  }

  /**
   * Execute transfers for all PENDING payouts (Admin only)
   * Sends funds via Stripe Connect or PayPal for each pending payout record
   */
  @Post('admin/process-pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async processPendingPayouts() {
    return this.payoutService.processPendingPayouts();
  }

  /**
   * Poll payment providers and sync status of all PROCESSING payouts (Admin only)
   * Resolves PayPal batch statuses and marks payouts COMPLETED or FAILED
   */
  @Post('admin/update-statuses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updatePayoutStatuses() {
    return this.payoutService.updatePayoutStatuses();
  }

  /**
   * Retry a failed payout — resets it to PENDING and re-links commissions (Admin only)
   * This does NOT create a new payout record.
   */
  @Post('admin/:payoutId/retry')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async retryPayout(@Param('payoutId') payoutId: string) {
    try {
      const data = await this.payoutService.retryPayout(payoutId);
      return { success: true, data, message: 'Payout reset to pending — ready to execute' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retry payout',
      };
    }
  }

  /**
   * Trigger manual payout for specific seller (Admin only)
   * Creates a new payout record for the seller.
   */
  @Post('admin/seller/:sellerId/trigger')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async triggerSellerPayout(@Request() req, @Param('sellerId') sellerId: string) {
    return this.payoutService.triggerManualPayout(sellerId, req.user.userId);
  }

  /**
   * Update payout schedule configuration (Admin only)
   */
  @Put('admin/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updatePayoutSchedule(
    @Body()
    body: {
      frequency?: PayoutFrequency;
      dayOfWeek?: number;
      dayOfMonth?: number;
      minPayoutAmount?: number;
      holdPeriodDays?: number;
      isAutomatic?: boolean;
      isActive?: boolean;
      notifyBeforeDays?: number;
    }
  ) {
    return this.payoutService.updatePayoutConfig(body);
  }

  /**
   * Mark payout as completed (Admin only)
   */
  @Put('admin/:payoutId/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async completePayout(
    @Param('payoutId') payoutId: string,
    @Body()
    body: {
      paymentReference?: string;
      paymentProof?: string;
    }
  ) {
    return this.payoutService.completePayout(payoutId, body.paymentReference, body.paymentProof);
  }

  /**
   * Mark payout as failed (Admin only)
   */
  @Put('admin/:payoutId/fail')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async failPayout(@Param('payoutId') payoutId: string, @Body() body: { reason: string }) {
    return this.payoutService.failPayout(payoutId, body.reason);
  }

  /**
   * Get payout statistics (Admin only)
   * @route GET /payouts/admin/statistics
   */
  @Get('admin/statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sellerId') sellerId?: string
  ) {
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (sellerId) filters.sellerId = sellerId;

    return this.payoutService.getPayoutStatistics(filters);
  }

  /**
   * Get single payout details (Admin only)
   * @route GET /payouts/admin/:payoutId
   */
  @Get('admin/:payoutId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getPayoutDetails(@Param('payoutId') payoutId: string) {
    const payout = await this.payoutService['prisma'].payout.findUnique({
      where: { id: payoutId },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            payoutCurrency: true,
          },
        },
        commissions: {
          select: {
            id: true,
            orderAmount: true,
            commissionAmount: true,
            orderId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    return {
      success: true,
      data: payout,
    };
  }
}
