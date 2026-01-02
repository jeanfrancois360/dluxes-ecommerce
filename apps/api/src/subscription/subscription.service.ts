import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { SubscriptionTier } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Get all active subscription plans
   */
  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Get a specific plan by tier
   */
  async getPlanByTier(tier: SubscriptionTier) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { tier },
    });
    if (!plan) {
      throw new NotFoundException(`Plan ${tier} not found`);
    }
    return plan;
  }

  /**
   * Get user's current subscription (or create FREE if none)
   */
  async getOrCreateSubscription(userId: string) {
    let subscription = await this.prisma.sellerSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      // Create FREE subscription by default
      const freePlan = await this.getPlanByTier('FREE');
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      subscription = await this.prisma.sellerSubscription.create({
        data: {
          userId,
          planId: freePlan.id,
          status: 'ACTIVE',
          billingCycle: 'MONTHLY',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          creditsAllocated: freePlan.monthlyCredits,
          creditsUsed: 0,
        },
        include: { plan: true },
      });

      this.logger.log(`Created FREE subscription for user ${userId}`);
    }

    return subscription;
  }

  /**
   * Check if user can list a specific product type
   */
  async canListProductType(
    userId: string,
    productType: string,
  ): Promise<{
    canList: boolean;
    reasons: {
      productTypeAllowed: boolean;
      meetsTierRequirement: boolean;
      hasListingCapacity: boolean;
      hasCredits: boolean;
    };
  }> {
    const subscription = await this.getOrCreateSubscription(userId);
    const plan = subscription.plan;

    // Check if product type is allowed by plan
    const allowedTypes = plan.allowedProductTypes as string[];
    const productTypeAllowed = allowedTypes.includes(productType);

    // Check minimum tier requirement
    const minTierKey = `min_tier_${productType.toLowerCase()}`;
    let minTier = 'FREE';
    try {
      const setting = await this.settingsService.getSetting(minTierKey);
      minTier = String(setting.value);
    } catch {
      // Use default
    }
    const tierOrder = ['FREE', 'STARTER', 'PROFESSIONAL', 'BUSINESS'];
    const meetsTierRequirement =
      tierOrder.indexOf(plan.tier) >= tierOrder.indexOf(minTier);

    // Check listing capacity
    const hasListingCapacity =
      plan.maxActiveListings === -1 ||
      subscription.activeListingsCount < plan.maxActiveListings;

    // Check credits
    const creditCostKey = `credit_cost_list_${productType.toLowerCase()}`;
    let creditCost = 1;
    try {
      const setting = await this.settingsService.getSetting(creditCostKey);
      creditCost = Number(setting.value);
    } catch {
      // Use default
    }

    const creditBalance = await this.prisma.creditBalance.findUnique({
      where: { userId },
    });
    const hasCredits = (creditBalance?.availableCredits ?? 0) >= creditCost;

    return {
      canList:
        productTypeAllowed &&
        meetsTierRequirement &&
        hasListingCapacity &&
        hasCredits,
      reasons: {
        productTypeAllowed,
        meetsTierRequirement,
        hasListingCapacity,
        hasCredits,
      },
    };
  }

  /**
   * Get subscription info formatted for API response
   */
  async getSubscriptionInfo(userId: string) {
    const subscription = await this.getOrCreateSubscription(userId);

    return {
      subscription: {
        ...subscription,
        creditsRemaining:
          subscription.creditsAllocated - subscription.creditsUsed,
      },
      plan: subscription.plan,
      tier: subscription.plan.tier,
      isActive: subscription.status === 'ACTIVE',
    };
  }
}
