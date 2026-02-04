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
      hasMonthlyCredits: boolean;
    };
  }> {
    // Check monthly selling credits (required for ALL product types)
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

    // PHYSICAL products only require monthly selling credits
    if (productType === 'PHYSICAL') {
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

    // For SERVICE and other premium product types, check subscription
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

    return {
      canList:
        productTypeAllowed &&
        meetsTierRequirement &&
        hasListingCapacity &&
        hasMonthlyCredits,
      reasons: {
        productTypeAllowed,
        meetsTierRequirement,
        hasListingCapacity,
        hasMonthlyCredits,
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

        const monthlyCount = subscriptions.filter(
          (s) => s.billingCycle === 'MONTHLY',
        ).length;
        const yearlyCount = subscriptions.filter(
          (s) => s.billingCycle === 'YEARLY',
        ).length;

        const monthlyRevenue =
          monthlyCount * Number(plan.monthlyPrice);
        const yearlyRevenue =
          (yearlyCount * Number(plan.yearlyPrice)) / 12;

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
      }),
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
    if (dto.maxActiveListings !== undefined)
      data.maxActiveListings = dto.maxActiveListings;
    if (dto.monthlyCredits !== undefined)
      data.monthlyCredits = dto.monthlyCredits;
    if (dto.featuredSlotsPerMonth !== undefined)
      data.featuredSlotsPerMonth = dto.featuredSlotsPerMonth;
    if (dto.listingDurationDays !== undefined)
      data.listingDurationDays = dto.listingDurationDays;
    if (dto.features !== undefined) data.features = dto.features;
    if (dto.allowedProductTypes !== undefined)
      data.allowedProductTypes = dto.allowedProductTypes;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.isPopular !== undefined) data.isPopular = dto.isPopular;
    if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder;

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data,
    });

    return {
      ...updated,
      monthlyPrice: Number(updated.monthlyPrice),
      yearlyPrice: Number(updated.yearlyPrice),
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
      throw new ConflictException(
        `Plan with tier ${dto.tier} already exists`,
      );
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
        `Cannot delete plan with ${plan._count.subscriptions} active subscriptions. Please cancel or migrate them first.`,
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
    const [
      plans,
      sellerSubscriptions,
      subscriptionsByStatus,
    ] = await Promise.all([
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
      {} as Record<string, number>,
    );

    return {
      totalPlans: plans.length,
      activePlans: plans.filter((p) => p.isActive).length,
      totalSubscriptions: Object.values(statusCounts).reduce(
        (a, b) => a + b,
        0,
      ),
      activeSubscriptions:
        (statusCounts['ACTIVE'] || 0) + (statusCounts['TRIAL'] || 0),
      canceledSubscriptions: statusCounts['CANCELLED'] || 0,
      expiredSubscriptions: statusCounts['EXPIRED'] || 0,
      subscriptionsByStatus: statusCounts,
      monthlyRevenue,
      yearlyRevenue,
      totalRevenue: monthlyRevenue + yearlyRevenue / 12,
      planBreakdown: plans.map((plan) => ({
        tier: plan.tier,
        name: plan.name,
        subscriberCount: plan._count.subscriptions,
      })),
    };
  }
}
