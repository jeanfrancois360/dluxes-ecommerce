import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdvertisementPlansService } from './advertisement-plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlanBillingPeriod, SubscriptionStatus } from '@prisma/client';

@Controller('advertisement-plans')
export class AdvertisementPlansController {
  constructor(private readonly plansService: AdvertisementPlansService) {}

  // ========================================================================
  // Admin Endpoints (Must come BEFORE wildcard routes)
  // ========================================================================

  /**
   * Get all plans (Admin)
   */
  @Get('admin/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllPlans(@Query('isActive') isActive?: string) {
    return this.plansService.getAllPlans({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  /**
   * Create plan (Admin)
   */
  @Post('admin/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createPlan(@Body() body: {
    name: string;
    slug: string;
    description?: string;
    maxActiveAds: number;
    maxImpressions?: number;
    priorityBoost?: number;
    allowedPlacements: string[];
    price: number;
    currency?: string;
    billingPeriod: PlanBillingPeriod;
    trialDays?: number;
    isFeatured?: boolean;
    displayOrder?: number;
  }) {
    return this.plansService.createPlan(body);
  }

  /**
   * Update plan (Admin)
   */
  @Put('admin/plans/:slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updatePlan(
    @Param('slug') slug: string,
    @Body() body: any
  ) {
    return this.plansService.updatePlan(slug, body);
  }

  /**
   * Delete plan (Admin)
   */
  @Delete('admin/plans/:slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deletePlan(@Param('slug') slug: string) {
    return this.plansService.deletePlan(slug);
  }

  /**
   * Get all subscriptions (Admin)
   */
  @Get('admin/subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllSubscriptions(
    @Query('status') status?: SubscriptionStatus,
    @Query('planId') planId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.plansService.getAllSubscriptions({
      status,
      planId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * Get subscription statistics (Admin)
   */
  @Get('admin/statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getStatistics() {
    return this.plansService.getSubscriptionStatistics();
  }

  // ========================================================================
  // Seller Endpoints
  // ========================================================================

  /**
   * Subscribe to a plan (Sellers only)
   */
  @Post('subscribe')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  async subscribe(
    @Request() req,
    @Body() body: {
      planId: string;
      autoRenew?: boolean;
    }
  ) {
    return this.plansService.subscribeToPlan(
      req.user.userId,
      body.planId,
      body.autoRenew ?? true
    );
  }

  /**
   * Get seller's active subscription
   */
  @Get('seller/subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  async getSellerSubscription(@Request() req) {
    return this.plansService.getSellerSubscription(req.user.userId);
  }

  /**
   * Get all seller's subscriptions
   */
  @Get('seller/subscriptions/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  async getSellerSubscriptions(@Request() req) {
    return this.plansService.getSellerSubscriptions(req.user.userId);
  }

  /**
   * Cancel subscription
   */
  @Post('subscriptions/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  async cancelSubscription(
    @Request() req,
    @Param('id') id: string,
    @Body() body?: { reason?: string }
  ) {
    return this.plansService.cancelSubscription(
      id,
      req.user.userId,
      body?.reason
    );
  }

  // ========================================================================
  // Public Endpoints (Wildcard routes MUST be last)
  // ========================================================================

  /**
   * Get all active plans (Public - for seller signup)
   */
  @Get()
  async getActivePlans() {
    return this.plansService.getActivePlans();
  }

  /**
   * Get plan by slug (MUST be last - wildcard route)
   */
  @Get(':slug')
  async getPlanBySlug(@Param('slug') slug: string) {
    return this.plansService.getPlanBySlug(slug);
  }
}
