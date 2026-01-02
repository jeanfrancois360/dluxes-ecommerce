import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

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
    const data = await this.subscriptionService.getSubscriptionInfo(req.user.id);
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
}
