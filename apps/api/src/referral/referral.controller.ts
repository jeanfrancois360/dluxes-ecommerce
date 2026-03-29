import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReferralService } from './referral.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetReferralHistoryDto, GetAllReferralsDto } from './dto/referral.dto';

/**
 * Referral Controller (v2.11.0)
 * Handles referral code generation, tracking, and reward distribution
 */
@Controller('referral')
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  // ============================================================================
  // USER ENDPOINTS (Authenticated users)
  // ============================================================================

  /**
   * Generate referral code for current user
   * POST /api/v1/referral/generate
   */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generateReferralCode(@Request() req: any) {
    const userId = req.user.id;
    const code = await this.referralService.generateReferralCode(userId);

    return {
      success: true,
      code,
      shareUrl: `${process.env.FRONTEND_URL}/auth/register?ref=${code}`,
    };
  }

  /**
   * Validate a referral code
   * GET /api/v1/referral/validate/:code
   */
  @Get('validate/:code')
  async validateReferralCode(@Param('code') code: string) {
    const isValid = await this.referralService.validateReferralCode(code);

    return {
      success: true,
      valid: isValid,
      code: code.toUpperCase(),
    };
  }

  /**
   * Get referral summary for current user
   * GET /api/v1/referral/summary
   */
  @Get('summary')
  async getReferralSummary(@Request() req: any) {
    const userId = req.user.id;
    const summary = await this.referralService.getReferralSummary(userId);

    return {
      success: true,
      data: summary,
    };
  }

  /**
   * Get referral history for current user
   * GET /api/v1/referral/history?page=1&limit=20&status=PAID
   */
  @Get('history')
  async getReferralHistory(@Request() req: any, @Query() query: GetReferralHistoryDto) {
    const userId = req.user.id;

    const result = await this.referralService.getReferralHistory(userId, {
      status: query.status,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page: query.page,
      limit: query.limit,
    });

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Get referral settings (public info for frontend)
   * GET /api/v1/referral/settings
   */
  @Get('settings')
  async getReferralSettings() {
    const settings = await this.referralService.getReferralSettings();

    // Only return public settings (hide internal config)
    return {
      success: true,
      data: {
        enabled: settings.enabled,
        buyerReward: settings.buyerReward,
        sellerReward: settings.sellerReward,
        minOrderValue: settings.minOrderValue,
        currency: settings.rewardCurrency,
        showLeaderboard: settings.showLeaderboard,
      },
    };
  }

  /**
   * Get top referrers leaderboard
   * GET /api/v1/referral/leaderboard?limit=10
   */
  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: number) {
    const settings = await this.referralService.getReferralSettings();

    if (!settings.showLeaderboard) {
      return {
        success: true,
        data: [],
        message: 'Leaderboard is currently disabled',
      };
    }

    const topReferrers = await this.referralService.getTopReferrers(limit ? Number(limit) : 10);

    // Anonymize email for privacy (show only first 3 chars)
    const anonymized = topReferrers.map((user, index) => ({
      rank: index + 1,
      name: `${user.firstName} ${user.lastName.charAt(0)}.`,
      email: user.email.substring(0, 3) + '***@***',
      totalReferrals: user.totalReferrals,
      code: user.referralCode?.code || null,
    }));

    return {
      success: true,
      data: anonymized,
    };
  }

  // ============================================================================
  // ADMIN ENDPOINTS (Admin/Super Admin only)
  // ============================================================================

  /**
   * Get all referrals with filters (Admin only)
   * GET /api/v1/referral/admin/all?page=1&limit=20&status=PAID
   */
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllReferrals(@Query() query: GetAllReferralsDto) {
    const result = await this.referralService.getAllReferrals({
      status: query.status,
      referredUserRole: query.role,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page: query.page,
      limit: query.limit,
    });

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Get referral statistics (Admin only)
   * GET /api/v1/referral/admin/statistics?startDate=2024-01-01&endDate=2024-12-31
   */
  @Get('admin/statistics')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getReferralStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const stats = await this.referralService.getReferralStatistics({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Get top referrers with full details (Admin only)
   * GET /api/v1/referral/admin/top-referrers?limit=50
   */
  @Get('admin/top-referrers')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getTopReferrersAdmin(@Query('limit') limit?: number) {
    const topReferrers = await this.referralService.getTopReferrers(limit ? Number(limit) : 50);

    return {
      success: true,
      data: topReferrers,
    };
  }

  /**
   * Get all referral settings (Admin only)
   * GET /api/v1/referral/admin/settings
   */
  @Get('admin/settings')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getReferralSettingsAdmin() {
    const settings = await this.referralService.getReferralSettings();

    return {
      success: true,
      data: settings,
    };
  }

  /**
   * Manually grant referral reward (Admin only)
   * POST /api/v1/referral/admin/grant-reward/:referralId
   */
  @Post('admin/grant-reward/:referralId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async grantRewardAdmin(@Param('referralId') referralId: string) {
    await this.referralService.grantReferralReward(referralId);

    return {
      success: true,
      message: 'Reward granted successfully',
    };
  }
}
