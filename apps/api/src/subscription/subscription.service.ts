import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { SubscriptionTier, Prisma } from '@prisma/client';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService
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
    productType: string
  ): Promise<{
    canList: boolean;
    reasons: {
      productTypeAllowed: boolean;
      meetsTierRequirement: boolean;
      hasListingCapacity: boolean;
      hasMonthlyCredits: boolean;
    };
  }> {
    // Product types that require a subscription (inquiry-based)
    const subscriptionRequiredTypes = ['SERVICE', 'RENTAL', 'VEHICLE', 'REAL_ESTATE'];
    const requiresSubscription = subscriptionRequiredTypes.includes(productType);

    // For PHYSICAL products, check store credits (selling credits)
    if (productType === 'PHYSICAL') {
      const store = await this.prisma.store.findUnique({
        where: { userId },
      });

      const now = new Date();
      const hasMonthlyCredits = store
        ? store.creditsBalance > 0 ||
          (store.creditsBalance === 0 &&
            store.creditsGraceEndsAt &&
            new Date(store.creditsGraceEndsAt) > now)
        : false;

      return {
        canList: hasMonthlyCredits,
        reasons: {
          productTypeAllowed: true,
          meetsTierRequirement: true,
          hasListingCapacity: true,
          hasMonthlyCredits,
        },
      };
    }

    // For subscription-required product types, check subscription
    const subscription = await this.getOrCreateSubscription(userId);
    const plan = subscription.plan;

    // Log subscription details for debugging
    this.logger.debug(
      `Checking subscription for user ${userId}: tier=${plan.tier}, planId=${plan.id}, status=${subscription.status}`
    );

    // Check if product type is allowed by plan's allowedProductTypes
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
    const meetsTierRequirement = tierOrder.indexOf(plan.tier) >= tierOrder.indexOf(minTier);

    // Check listing capacity from subscription
    const hasListingCapacity =
      plan.maxActiveListings === -1 || subscription.activeListingsCount < plan.maxActiveListings;

    // For subscription-required types, check subscription credits (not store credits)
    // The subscription must be active and have credits remaining
    const subscriptionCreditsRemaining = subscription.creditsAllocated - subscription.creditsUsed;

    // Check grace period for subscription (PAST_DUE status)
    let inGracePeriod = false;
    try {
      const gracePeriodSetting = await this.settingsService.getSetting('subscription_grace_days');
      const graceDays = Number(gracePeriodSetting.value) || 3;

      if (subscription.status === 'PAST_DUE' && subscription.currentPeriodEnd) {
        const graceEndDate = new Date(subscription.currentPeriodEnd);
        graceEndDate.setDate(graceEndDate.getDate() + graceDays);
        inGracePeriod = new Date() < graceEndDate;
      }
    } catch (error) {
      // Grace period setting not found, use default of 3 days
      const graceDays = 3;
      if (subscription.status === 'PAST_DUE' && subscription.currentPeriodEnd) {
        const graceEndDate = new Date(subscription.currentPeriodEnd);
        graceEndDate.setDate(graceEndDate.getDate() + graceDays);
        inGracePeriod = new Date() < graceEndDate;
      }
    }

    const hasSubscriptionCredits =
      (subscription.status === 'ACTIVE' || inGracePeriod) &&
      (plan.tier !== 'FREE' || subscriptionCreditsRemaining > 0);

    // Log the check results
    this.logger.debug(
      `Subscription check results: productTypeAllowed=${productTypeAllowed}, meetsTierRequirement=${meetsTierRequirement}, hasListingCapacity=${hasListingCapacity}, hasSubscriptionCredits=${hasSubscriptionCredits}, tier=${plan.tier}`
    );

    return {
      canList:
        productTypeAllowed && meetsTierRequirement && hasListingCapacity && hasSubscriptionCredits,
      reasons: {
        productTypeAllowed,
        meetsTierRequirement,
        hasListingCapacity,
        hasMonthlyCredits: hasSubscriptionCredits,
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
        creditsRemaining: subscription.creditsAllocated - subscription.creditsUsed,
      },
      plan: subscription.plan,
      tier: subscription.plan.tier,
      isActive: subscription.status === 'ACTIVE',
    };
  }

  // ============================================================================
  // ADMIN: SUBSCRIPTION PLANS MANAGEMENT
  // ============================================================================

  /**
   * Get all plans with detailed statistics (admin)
   */
  async adminGetPlans(params?: { isActive?: boolean }) {
    const where: Prisma.SubscriptionPlanWhereInput = {};

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const plans = await this.prisma.subscriptionPlan.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    // Calculate detailed stats for each plan
    return Promise.all(
      plans.map(async (plan) => {
        const subscriptions = await this.prisma.sellerSubscription.findMany({
          where: {
            planId: plan.id,
            status: { in: ['ACTIVE', 'TRIAL'] },
          },
          select: { billingCycle: true },
        });

        const monthlyCount = subscriptions.filter((s) => s.billingCycle === 'MONTHLY').length;
        const yearlyCount = subscriptions.filter((s) => s.billingCycle === 'YEARLY').length;

        const monthlyRevenue = monthlyCount * Number(plan.monthlyPrice);
        const yearlyRevenue = (yearlyCount * Number(plan.yearlyPrice)) / 12;

        return {
          ...plan,
          monthlyPrice: Number(plan.monthlyPrice),
          yearlyPrice: Number(plan.yearlyPrice),
          _count: {
            subscriptions: subscriptions.length,
          },
          stats: {
            totalSubscribers: subscriptions.length,
            monthlySubscribers: monthlyCount,
            yearlySubscribers: yearlyCount,
            monthlyRevenue,
            yearlyRevenue,
            totalRevenue: monthlyRevenue + yearlyRevenue,
          },
        };
      })
    );
  }

  /**
   * Get single plan with full details (admin)
   */
  async adminGetPlan(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        _count: { select: { subscriptions: true } },
        subscriptions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return {
      ...plan,
      monthlyPrice: Number(plan.monthlyPrice),
      yearlyPrice: Number(plan.yearlyPrice),
    };
  }

  /**
   * Update subscription plan (admin)
   */
  async adminUpdatePlan(id: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const data: Prisma.SubscriptionPlanUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.monthlyPrice !== undefined) data.monthlyPrice = dto.monthlyPrice;
    if (dto.yearlyPrice !== undefined) data.yearlyPrice = dto.yearlyPrice;
    if (dto.maxActiveListings !== undefined) data.maxActiveListings = dto.maxActiveListings;
    if (dto.monthlyCredits !== undefined) data.monthlyCredits = dto.monthlyCredits;
    if (dto.featuredSlotsPerMonth !== undefined)
      data.featuredSlotsPerMonth = dto.featuredSlotsPerMonth;
    if (dto.listingDurationDays !== undefined) data.listingDurationDays = dto.listingDurationDays;
    if (dto.features !== undefined) data.features = dto.features;
    if (dto.allowedProductTypes !== undefined) data.allowedProductTypes = dto.allowedProductTypes;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.isPopular !== undefined) data.isPopular = dto.isPopular;
    if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder;

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data,
    });

    // If prices changed, trigger Stripe price sync (admin must sync manually via /admin/sync-stripe endpoint)
    const pricesChanged =
      (dto.monthlyPrice !== undefined && Number(dto.monthlyPrice) !== Number(plan.monthlyPrice)) ||
      (dto.yearlyPrice !== undefined && Number(dto.yearlyPrice) !== Number(plan.yearlyPrice));

    if (pricesChanged) {
      this.logger.warn(
        `Plan ${plan.name} prices changed. Admin must sync Stripe prices via POST /subscription/admin/sync-stripe to update Stripe.`
      );
    }

    return {
      ...updated,
      monthlyPrice: Number(updated.monthlyPrice),
      yearlyPrice: Number(updated.yearlyPrice),
      pricesChanged, // Return flag to inform frontend
    };
  }

  /**
   * Toggle plan active status (admin)
   */
  async adminTogglePlanStatus(tier: SubscriptionTier) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { tier },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const updated = await this.prisma.subscriptionPlan.update({
      where: { tier },
      data: { isActive: !plan.isActive },
    });

    return {
      ...updated,
      monthlyPrice: Number(updated.monthlyPrice),
      yearlyPrice: Number(updated.yearlyPrice),
    };
  }

  /**
   * Toggle plan active status by ID (admin)
   */
  async adminTogglePlanStatusById(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive: !plan.isActive },
    });

    return {
      ...updated,
      monthlyPrice: Number(updated.monthlyPrice),
      yearlyPrice: Number(updated.yearlyPrice),
    };
  }

  /**
   * Create new subscription plan (admin)
   */
  async adminCreatePlan(dto: CreatePlanDto) {
    // Check if tier already exists
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { tier: dto.tier },
    });

    if (existing) {
      throw new ConflictException(`Plan with tier ${dto.tier} already exists`);
    }

    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        tier: dto.tier,
        name: dto.name,
        description: dto.description || null,
        monthlyPrice: dto.monthlyPrice,
        yearlyPrice: dto.yearlyPrice,
        maxActiveListings: dto.maxActiveListings ?? 10,
        monthlyCredits: dto.monthlyCredits ?? 5,
        featuredSlotsPerMonth: dto.featuredSlotsPerMonth ?? 0,
        listingDurationDays: dto.listingDurationDays ?? 30,
        features: dto.features || [],
        allowedProductTypes: dto.allowedProductTypes || [],
        isActive: dto.isActive ?? true,
        isPopular: dto.isPopular ?? false,
        displayOrder: dto.displayOrder ?? 0,
      },
    });

    return {
      ...plan,
      monthlyPrice: Number(plan.monthlyPrice),
      yearlyPrice: Number(plan.yearlyPrice),
    };
  }

  /**
   * Delete subscription plan (admin)
   */
  async adminDeletePlan(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (plan._count.subscriptions > 0) {
      throw new BadRequestException(
        `Cannot delete plan with ${plan._count.subscriptions} active subscriptions. Please cancel or migrate them first.`
      );
    }

    await this.prisma.subscriptionPlan.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Plan deleted successfully',
    };
  }

  /**
   * Duplicate subscription plan (admin)
   */
  async adminDuplicatePlan(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Generate a unique tier for the copy
    const copyTier = `${plan.tier}_COPY_${Date.now()}` as SubscriptionTier;

    const duplicate = await this.prisma.subscriptionPlan.create({
      data: {
        tier: copyTier,
        name: `${plan.name} (Copy)`,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        currency: plan.currency,
        maxActiveListings: plan.maxActiveListings,
        monthlyCredits: plan.monthlyCredits,
        listingDurationDays: plan.listingDurationDays,
        featuredSlotsPerMonth: plan.featuredSlotsPerMonth,
        allowedProductTypes: plan.allowedProductTypes,
        features: plan.features,
        isPopular: false,
        isActive: false, // Duplicates start as inactive
        displayOrder: plan.displayOrder + 1,
      },
    });

    return {
      ...duplicate,
      monthlyPrice: Number(duplicate.monthlyPrice),
      yearlyPrice: Number(duplicate.yearlyPrice),
    };
  }

  // ============================================================================
  // ADMIN: SELLER SUBSCRIPTIONS MANAGEMENT
  // ============================================================================

  /**
   * Get all seller subscriptions with filters (admin)
   */
  async adminGetSellerSubscriptions(params?: {
    status?: string;
    tier?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.SellerSubscriptionWhereInput = {};

    if (params?.status && params.status !== 'all') {
      where.status = params.status as any;
    }

    if (params?.tier && params.tier !== 'all') {
      where.plan = { tier: params.tier as SubscriptionTier };
    }

    if (params?.search) {
      where.OR = [
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
        {
          user: {
            firstName: { contains: params.search, mode: 'insensitive' },
          },
        },
        { user: { lastName: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [subscriptions, total] = await Promise.all([
      this.prisma.sellerSubscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          plan: {
            select: {
              id: true,
              tier: true,
              name: true,
              monthlyPrice: true,
              yearlyPrice: true,
            },
          },
        },
      }),
      this.prisma.sellerSubscription.count({ where }),
    ]);

    return {
      data: subscriptions.map((sub) => ({
        ...sub,
        plan: {
          ...sub.plan,
          monthlyPrice: Number(sub.plan.monthlyPrice),
          yearlyPrice: Number(sub.plan.yearlyPrice),
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cancel seller subscription (admin)
   */
  async adminCancelSubscription(id: string) {
    const subscription = await this.prisma.sellerSubscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.sellerSubscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        canceledAt: new Date(),
        cancelAtPeriodEnd: true,
      },
    });
  }

  /**
   * Reactivate cancelled subscription (admin)
   */
  async adminReactivateSubscription(id: string) {
    const subscription = await this.prisma.sellerSubscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== 'CANCELLED') {
      throw new BadRequestException('Only cancelled subscriptions can be reactivated');
    }

    return this.prisma.sellerSubscription.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        canceledAt: null,
        cancelAtPeriodEnd: false,
      },
    });
  }

  // ============================================================================
  // ADMIN: STATISTICS
  // ============================================================================

  /**
   * Get comprehensive subscription statistics (admin)
   */
  async adminGetStatistics() {
    const [plans, sellerSubscriptions, subscriptionsByStatus] = await Promise.all([
      this.prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { subscriptions: true } },
        },
      }),
      this.prisma.sellerSubscription.findMany({
        where: { status: { in: ['ACTIVE', 'TRIAL'] } },
        include: { plan: true },
      }),
      this.prisma.sellerSubscription.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    // Calculate revenue
    let monthlyRevenue = 0;
    let yearlyRevenue = 0;

    sellerSubscriptions.forEach((sub) => {
      if (sub.billingCycle === 'MONTHLY') {
        monthlyRevenue += Number(sub.plan.monthlyPrice);
      } else {
        yearlyRevenue += Number(sub.plan.yearlyPrice);
      }
    });

    const statusCounts = subscriptionsByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalPlans: plans.length,
      activePlans: plans.filter((p) => p.isActive).length,
      totalSubscriptions: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      activeSubscriptions: (statusCounts['ACTIVE'] || 0) + (statusCounts['TRIAL'] || 0),
      canceledSubscriptions: statusCounts['CANCELLED'] || 0,
      expiredSubscriptions: statusCounts['EXPIRED'] || 0,
      subscriptionsByStatus: statusCounts,
      monthlyRevenue,
      yearlyRevenue,
      totalRevenue: monthlyRevenue * 12 + yearlyRevenue,
      planBreakdown: plans.map((plan) => ({
        tier: plan.tier,
        name: plan.name,
        subscriberCount: plan._count.subscriptions,
      })),
    };
  }

  /**
   * Check if seller can list a product (includes PAST_DUE restriction)
   */
  async canSellerListProduct(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const subscription = await this.getOrCreateSubscription(userId);

    // Block PAST_DUE sellers from listing new products
    if (subscription.status === 'PAST_DUE') {
      return {
        allowed: false,
        reason:
          'Your subscription payment is past due. Please update your payment method to continue listing products.',
      };
    }

    // Block CANCELLED and EXPIRED sellers
    if (subscription.status === 'CANCELLED' || subscription.status === 'EXPIRED') {
      return {
        allowed: false,
        reason: 'Your subscription is inactive. Please subscribe to a plan to list products.',
      };
    }

    return { allowed: true };
  }

  /**
   * Get unified credit summary for seller (both store credits and subscription credits)
   */
  async getSellerCreditSummary(userId: string): Promise<{
    storeCredits: {
      balance: number;
      expiresAt: Date | null;
      graceEndsAt: Date | null;
      inGracePeriod: boolean;
      canListPhysical: boolean;
    };
    subscriptionCredits: {
      allocated: number;
      used: number;
      remaining: number;
      resetDate: Date;
      planName: string;
      planTier: string;
      allowedTypes: string[];
      canListService: boolean;
      canListRealEstate: boolean;
      canListVehicle: boolean;
      canListRental: boolean;
    };
    subscription: {
      status: string;
      planName: string;
      nextBillingDate: Date | null;
      cancelAtPeriodEnd: boolean;
    };
  }> {
    // Get store credits
    const store = await this.prisma.store.findUnique({
      where: { userId },
      select: {
        creditsBalance: true,
        creditsExpiresAt: true,
        creditsGraceEndsAt: true,
        status: true,
      },
    });

    const now = new Date();
    const storeInGracePeriod =
      store?.creditsBalance === 0 &&
      store?.creditsGraceEndsAt &&
      new Date(store.creditsGraceEndsAt) > now;

    const canListPhysical =
      store?.status === 'ACTIVE' && ((store?.creditsBalance ?? 0) > 0 || storeInGracePeriod);

    // Get subscription
    const subscription = await this.getOrCreateSubscription(userId);
    const plan = subscription.plan;

    const allowedTypes = (plan.allowedProductTypes as string[]) || [];

    // Calculate next reset date (1st of next month)
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      storeCredits: {
        balance: store?.creditsBalance ?? 0,
        expiresAt: store?.creditsExpiresAt ?? null,
        graceEndsAt: store?.creditsGraceEndsAt ?? null,
        inGracePeriod: storeInGracePeriod,
        canListPhysical,
      },
      subscriptionCredits: {
        allocated: subscription.creditsAllocated,
        used: subscription.creditsUsed,
        remaining: subscription.creditsAllocated - subscription.creditsUsed,
        resetDate,
        planName: plan.name,
        planTier: plan.tier,
        allowedTypes,
        canListService: allowedTypes.includes('SERVICE'),
        canListRealEstate: allowedTypes.includes('REAL_ESTATE'),
        canListVehicle: allowedTypes.includes('VEHICLE'),
        canListRental: allowedTypes.includes('RENTAL'),
      },
      subscription: {
        status: subscription.status,
        planName: plan.name,
        nextBillingDate: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
    };
  }

  /**
   * Reset monthly credits for active subscriptions (Cron job)
   * Runs on the 1st of every month at 1:00 AM UTC
   */
  async resetMonthlyCredits(): Promise<{ reset: number; errors: string[] }> {
    this.logger.log('Starting monthly credit reset for active subscriptions...');

    let resetCount = 0;
    const errors: string[] = [];

    try {
      // Get all ACTIVE subscriptions
      const activeSubscriptions = await this.prisma.sellerSubscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: true, user: { select: { email: true } } },
      });

      this.logger.log(`Found ${activeSubscriptions.length} active subscriptions to reset`);

      for (const subscription of activeSubscriptions) {
        try {
          await this.prisma.$transaction(async (tx) => {
            await tx.sellerSubscription.update({
              where: { id: subscription.id },
              data: {
                creditsAllocated: subscription.plan.monthlyCredits,
                creditsUsed: 0,
              },
            });

            await tx.subscriptionCreditEvent.create({
              data: {
                subscriptionId: subscription.id,
                userId: subscription.userId,
                eventType: 'CRON_RESET',
                creditsBefore: subscription.creditsAllocated,
                creditsAfter: subscription.plan.monthlyCredits,
                creditsUsedBefore: subscription.creditsUsed,
                creditsUsedAfter: 0,
                reason: 'Monthly credit reset — 1st of month cron job',
                metadata: {
                  planName: subscription.plan.name,
                  planTier: subscription.plan.tier,
                },
              },
            });
          });

          resetCount++;
          this.logger.debug(
            `Reset credits for user ${subscription.user.email}: ${subscription.plan.monthlyCredits} credits`
          );
        } catch (error) {
          const errorMsg = `Failed to reset credits for user ${subscription.userId}: ${error instanceof Error ? error.message : String(error)}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      this.logger.log(
        `Monthly credit reset completed: ${resetCount} reset, ${errors.length} errors`
      );

      return { reset: resetCount, errors };
    } catch (error) {
      const errorMsg = `Monthly credit reset failed: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errorMsg);
      throw error;
    }
  }
}
