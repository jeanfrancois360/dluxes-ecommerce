import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { StripeSubscriptionService } from './stripe-subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { SubscriptionTier } from '@prisma/client';

@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly stripeSubscriptionService: StripeSubscriptionService,
  ) {}

  // ==========================================================================
  // PUBLIC & USER ENDPOINTS
  // ==========================================================================

  /**
   * Get all available plans (public)
   */
  @Get('plans')
  async getPlans() {
    const data = await this.subscriptionService.getPlans();
    return { success: true, data };
  }

  /**
   * Get current user's subscription
   */
  @Get('my-subscription')
  @UseGuards(JwtAuthGuard)
  async getMySubscription(@Req() req: any) {
    const data = await this.subscriptionService.getSubscriptionInfo(
      req.user.id,
    );
    return { success: true, data };
  }

  /**
   * Check if user can list a product type
   */
  @Get('can-list/:productType')
  @UseGuards(JwtAuthGuard)
  async canListProductType(
    @Req() req: any,
    @Param('productType') productType: string,
  ) {
    const data = await this.subscriptionService.canListProductType(
      req.user.id,
      productType,
    );
    return { success: true, data };
  }

  // ==========================================================================
  // ADMIN ENDPOINTS: SUBSCRIPTION PLANS
  // ==========================================================================

  /**
   * Get all plans with detailed stats (admin)
   */
  @Get('admin/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminGetPlans(@Query('isActive') isActive?: string) {
    const params =
      isActive !== undefined ? { isActive: isActive === 'true' } : undefined;
    const data = await this.subscriptionService.adminGetPlans(params);
    return { success: true, data };
  }

  /**
   * Get single plan details (admin)
   */
  @Get('admin/plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminGetPlan(@Param('id') id: string) {
    const data = await this.subscriptionService.adminGetPlan(id);
    return { success: true, data };
  }

  /**
   * Update subscription plan (admin)
   */
  @Patch('admin/plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminUpdatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    const data = await this.subscriptionService.adminUpdatePlan(id, dto);
    return { success: true, data };
  }

  /**
   * Create subscription plan (admin)
   */
  @Post('admin/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminCreatePlan(@Body() dto: CreatePlanDto) {
    const data = await this.subscriptionService.adminCreatePlan(dto);
    return { success: true, data };
  }

  /**
   * Delete subscription plan (admin)
   */
  @Delete('admin/plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminDeletePlan(@Param('id') id: string) {
    const data = await this.subscriptionService.adminDeletePlan(id);
    return { success: true, ...data };
  }

  /**
   * Toggle plan active status (admin)
   */
  @Patch('admin/plans/toggle/:tier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminTogglePlanStatus(@Param('tier') tier: SubscriptionTier) {
    const data = await this.subscriptionService.adminTogglePlanStatus(tier);
    return { success: true, data };
  }

  /**
   * Toggle plan active status by ID (admin)
   */
  @Patch('admin/plans/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminTogglePlanStatusById(@Param('id') id: string) {
    const data = await this.subscriptionService.adminTogglePlanStatusById(id);
    return { success: true, data };
  }

  /**
   * Duplicate subscription plan (admin)
   */
  @Post('admin/plans/:id/duplicate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminDuplicatePlan(@Param('id') id: string) {
    const data = await this.subscriptionService.adminDuplicatePlan(id);
    return { success: true, data };
  }

  // ==========================================================================
  // ADMIN ENDPOINTS: SELLER SUBSCRIPTIONS
  // ==========================================================================

  /**
   * Get all seller subscriptions (admin)
   */
  @Get('admin/seller-subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminGetSellerSubscriptions(
    @Query('status') status?: string,
    @Query('tier') tier?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.subscriptionService.adminGetSellerSubscriptions({
      status,
      tier,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    return { success: true, ...data };
  }

  /**
   * Cancel seller subscription (admin)
   */
  @Post('admin/seller-subscriptions/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminCancelSubscription(@Param('id') id: string) {
    const data = await this.subscriptionService.adminCancelSubscription(id);
    return { success: true, data };
  }

  /**
   * Reactivate seller subscription (admin)
   */
  @Post('admin/seller-subscriptions/:id/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminReactivateSubscription(@Param('id') id: string) {
    const data = await this.subscriptionService.adminReactivateSubscription(id);
    return { success: true, data };
  }

  // ==========================================================================
  // ADMIN ENDPOINTS: STATISTICS
  // ==========================================================================

  /**
   * Get subscription statistics (admin)
   */
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminGetStatistics() {
    const data = await this.subscriptionService.adminGetStatistics();
    return { success: true, data };
  }

  // ==========================================================================
  // STRIPE SUBSCRIPTION ENDPOINTS
  // ==========================================================================

  /**
   * Create Stripe checkout session for subscription
   */
  @Post('create-checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async createCheckout(
    @Req() req: any,
    @Body() body: { planId: string; billingCycle: 'MONTHLY' | 'YEARLY' },
  ) {
    const data = await this.stripeSubscriptionService.createCheckoutSession(
      req.user.id,
      body.planId,
      body.billingCycle,
    );
    return { success: true, data };
  }

  /**
   * Verify checkout session and activate subscription (fallback for delayed webhooks)
   * This endpoint can be called by the success page to ensure subscription is activated
   */
  @Post('verify-checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async verifyCheckout(
    @Req() req: any,
    @Body() body: { sessionId: string },
  ) {
    const data = await this.stripeSubscriptionService.verifyAndActivateCheckout(
      req.user.id,
      body.sessionId,
    );
    return { success: true, data };
  }

  /**
   * Create Stripe billing portal session
   */
  @Post('create-portal')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async createPortal(@Req() req: any) {
    const data = await this.stripeSubscriptionService.createPortalSession(req.user.id);
    return { success: true, data };
  }

  /**
   * Cancel subscription at period end
   */
  @Post('cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async cancelSubscription(@Req() req: any) {
    await this.stripeSubscriptionService.cancelSubscription(req.user.id);
    return { success: true, message: 'Subscription will be cancelled at the end of the billing period' };
  }

  /**
   * Resume cancelled subscription
   */
  @Post('resume')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async resumeSubscription(@Req() req: any) {
    await this.stripeSubscriptionService.resumeSubscription(req.user.id);
    return { success: true, message: 'Subscription resumed successfully' };
  }

  /**
   * Sync Stripe prices (Admin only)
   */
  @Post('admin/sync-stripe')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async syncStripe() {
    const data = await this.stripeSubscriptionService.syncStripePrices();
    return { success: true, ...data };
  }
}
