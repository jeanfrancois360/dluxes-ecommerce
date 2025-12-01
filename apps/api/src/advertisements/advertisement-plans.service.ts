import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PlanBillingPeriod, SubscriptionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Advertisement Plans Service
 * Manages seller promotion tiers and subscriptions
 * NON-DESTRUCTIVE: Extends existing advertisement system
 */
@Injectable()
export class AdvertisementPlansService {
  private readonly logger = new Logger(AdvertisementPlansService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create advertisement plan (Admin only)
   */
  async createPlan(data: {
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
    // Check for duplicate slug
    const existing = await this.prisma.advertisementPlan.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new BadRequestException(`Plan with slug '${data.slug}' already exists`);
    }

    const plan = await this.prisma.advertisementPlan.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        maxActiveAds: data.maxActiveAds,
        maxImpressions: data.maxImpressions,
        priorityBoost: data.priorityBoost || 0,
        allowedPlacements: data.allowedPlacements,
        price: new Decimal(data.price),
        currency: data.currency || 'USD',
        billingPeriod: data.billingPeriod,
        trialDays: data.trialDays || 0,
        isFeatured: data.isFeatured || false,
        displayOrder: data.displayOrder || 0,
        isActive: true,
      },
    });

    this.logger.log(`Advertisement plan created: ${plan.name} (${plan.slug})`);
    return plan;
  }

  /**
   * Get all advertisement plans
   */
  async getAllPlans(filters?: { isActive?: boolean }) {
    return this.prisma.advertisementPlan.findMany({
      where: {
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { price: 'asc' }],
    });
  }

  /**
   * Get active plans for public display
   */
  async getActivePlans() {
    return this.prisma.advertisementPlan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        maxActiveAds: true,
        maxImpressions: true,
        priorityBoost: true,
        allowedPlacements: true,
        price: true,
        currency: true,
        billingPeriod: true,
        trialDays: true,
        isFeatured: true,
      },
      orderBy: [{ displayOrder: 'asc' }, { price: 'asc' }],
    });
  }

  /**
   * Get plan by slug
   */
  async getPlanBySlug(slug: string) {
    const plan = await this.prisma.advertisementPlan.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plan '${slug}' not found`);
    }

    return plan;
  }

  /**
   * Update plan
   */
  async updatePlan(
    slug: string,
    data: Partial<{
      name: string;
      description: string;
      maxActiveAds: number;
      maxImpressions: number;
      priorityBoost: number;
      allowedPlacements: string[];
      price: number;
      billingPeriod: PlanBillingPeriod;
      trialDays: number;
      isActive: boolean;
      isFeatured: boolean;
      displayOrder: number;
    }>
  ) {
    const plan = await this.prisma.advertisementPlan.findUnique({
      where: { slug },
    });

    if (!plan) {
      throw new NotFoundException(`Plan '${slug}' not found`);
    }

    const updateData: any = { ...data };
    if (data.price !== undefined) {
      updateData.price = new Decimal(data.price);
    }

    return this.prisma.advertisementPlan.update({
      where: { slug },
      data: updateData,
    });
  }

  /**
   * Delete plan (only if no active subscriptions)
   */
  async deletePlan(slug: string) {
    const plan = await this.prisma.advertisementPlan.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plan '${slug}' not found`);
    }

    if (plan._count.subscriptions > 0) {
      throw new BadRequestException(
        'Cannot delete plan with active subscriptions. Deactivate the plan instead.'
      );
    }

    return this.prisma.advertisementPlan.delete({
      where: { slug },
    });
  }

  /**
   * Subscribe seller to a plan
   */
  async subscribeToPlan(sellerId: string, planId: string, autoRenew: boolean = true) {
    const plan = await this.prisma.advertisementPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (!plan.isActive) {
      throw new BadRequestException('This plan is not currently available');
    }

    // Check for existing active subscription
    const existingSubscription = await this.prisma.sellerPlanSubscription.findFirst({
      where: {
        sellerId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
      },
    });

    if (existingSubscription) {
      throw new BadRequestException(
        'You already have an active subscription. Cancel it first to switch plans.'
      );
    }

    // Calculate subscription period
    const now = new Date();
    let periodEnd = new Date(now);

    switch (plan.billingPeriod) {
      case PlanBillingPeriod.FREE:
        // Free plan - 1 year period
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        break;
      case PlanBillingPeriod.WEEKLY:
        periodEnd.setDate(periodEnd.getDate() + 7);
        break;
      case PlanBillingPeriod.MONTHLY:
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        break;
      case PlanBillingPeriod.QUARTERLY:
        periodEnd.setMonth(periodEnd.getMonth() + 3);
        break;
      case PlanBillingPeriod.YEARLY:
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        break;
    }

    const subscription = await this.prisma.sellerPlanSubscription.create({
      data: {
        sellerId,
        planId,
        status: plan.trialDays > 0 ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        autoRenew,
        lastPaymentAt: plan.price.toNumber() === 0 ? now : null,
        nextPaymentAt: plan.price.toNumber() > 0 ? periodEnd : null,
      },
      include: {
        plan: true,
      },
    });

    this.logger.log(
      `Seller ${sellerId} subscribed to plan '${plan.name}' (${plan.billingPeriod})`
    );

    return subscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelledBy: string,
    reason?: string
  ) {
    const subscription = await this.prisma.sellerPlanSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription already cancelled');
    }

    return this.prisma.sellerPlanSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy,
        cancellationReason: reason,
        autoRenew: false,
      },
    });
  }

  /**
   * Get seller's active subscription
   */
  async getSellerSubscription(sellerId: string) {
    return this.prisma.sellerPlanSubscription.findFirst({
      where: {
        sellerId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
      },
      include: {
        plan: true,
      },
    });
  }

  /**
   * Get all subscriptions for a seller
   */
  async getSellerSubscriptions(sellerId: string) {
    return this.prisma.sellerPlanSubscription.findMany({
      where: { sellerId },
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all subscriptions (Admin)
   */
  async getAllSubscriptions(filters?: {
    status?: SubscriptionStatus;
    planId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.planId && { planId: filters.planId }),
    };

    const [subscriptions, total] = await Promise.all([
      this.prisma.sellerPlanSubscription.findMany({
        where,
        include: {
          seller: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sellerPlanSubscription.count({ where }),
    ]);

    return {
      data: subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Process expired subscriptions (for cron job)
   */
  async processExpiredSubscriptions() {
    const now = new Date();

    const expiredSubscriptions = await this.prisma.sellerPlanSubscription.findMany({
      where: {
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
        currentPeriodEnd: { lte: now },
        autoRenew: false,
      },
      take: 50,
    });

    this.logger.log(`Processing ${expiredSubscriptions.length} expired subscriptions`);

    let successCount = 0;

    for (const subscription of expiredSubscriptions) {
      try {
        await this.prisma.sellerPlanSubscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.EXPIRED,
          },
        });
        successCount++;
      } catch (error) {
        this.logger.error(`Failed to expire subscription ${subscription.id}:`, error);
      }
    }

    this.logger.log(`Expired ${successCount} subscriptions`);

    return {
      processed: expiredSubscriptions.length,
      successful: successCount,
    };
  }

  /**
   * Get subscription statistics (Admin)
   */
  async getSubscriptionStatistics() {
    const [active, trial, pastDue, cancelled, expired, totalRevenue] = await Promise.all([
      this.prisma.sellerPlanSubscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      this.prisma.sellerPlanSubscription.count({
        where: { status: SubscriptionStatus.TRIAL },
      }),
      this.prisma.sellerPlanSubscription.count({
        where: { status: SubscriptionStatus.PAST_DUE },
      }),
      this.prisma.sellerPlanSubscription.count({
        where: { status: SubscriptionStatus.CANCELLED },
      }),
      this.prisma.sellerPlanSubscription.count({
        where: { status: SubscriptionStatus.EXPIRED },
      }),
      this.prisma.sellerPlanSubscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
        },
        include: {
          plan: true,
        },
      }),
    ]);

    // Calculate monthly recurring revenue
    const mrr = totalRevenue.reduce((sum, sub) => {
      const planPrice = sub.plan.price.toNumber();
      switch (sub.plan.billingPeriod) {
        case PlanBillingPeriod.WEEKLY:
          return sum + (planPrice * 4.33);
        case PlanBillingPeriod.MONTHLY:
          return sum + planPrice;
        case PlanBillingPeriod.QUARTERLY:
          return sum + (planPrice / 3);
        case PlanBillingPeriod.YEARLY:
          return sum + (planPrice / 12);
        default:
          return sum;
      }
    }, 0);

    return {
      active,
      trial,
      pastDue,
      cancelled,
      expired,
      total: active + trial + pastDue + cancelled + expired,
      monthlyRecurringRevenue: Math.round(mrr * 100) / 100,
    };
  }
}
