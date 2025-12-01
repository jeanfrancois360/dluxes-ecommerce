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
} from '@nestjs/common';
import { PayoutSchedulerService } from './payout-scheduler.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PayoutFrequency } from '@prisma/client';

@Controller('api/v1/payouts')
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
  // Admin Endpoints
  // ========================================================================

  /**
   * Manually trigger payout processing (Admin only)
   */
  @Post('admin/process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async processPayouts(@Request() req) {
    return this.payoutService.processScheduledPayouts();
  }

  /**
   * Trigger manual payout for specific seller (Admin only)
   */
  @Post('admin/seller/:sellerId/trigger')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async triggerSellerPayout(
    @Request() req,
    @Param('sellerId') sellerId: string
  ) {
    return this.payoutService.triggerManualPayout(sellerId, req.user.userId);
  }

  /**
   * Update payout schedule configuration (Admin only)
   */
  @Put('admin/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updatePayoutSchedule(
    @Body() body: {
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
    @Body() body: {
      paymentReference?: string;
      paymentProof?: string;
    }
  ) {
    return this.payoutService.completePayout(
      payoutId,
      body.paymentReference,
      body.paymentProof
    );
  }

  /**
   * Mark payout as failed (Admin only)
   */
  @Put('admin/:payoutId/fail')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async failPayout(
    @Param('payoutId') payoutId: string,
    @Body() body: { reason: string }
  ) {
    return this.payoutService.failPayout(payoutId, body.reason);
  }
}
