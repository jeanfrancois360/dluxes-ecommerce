import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { SETTING_DEFAULTS } from '../settings/settings.defaults';
import { Prisma, ReferralCouponStatus, ReferralStatus, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Referral Service (v2.11.0)
 * Handles dynamic referral code generation, tracking, and reward distribution
 * Supports both BUYER and SELLER referrals with different reward structures
 */
@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService
  ) {}

  // ============================================================================
  // REFERRAL CODE MANAGEMENT
  // ============================================================================

  /**
   * Generate a unique referral code for a user
   * Format: [PREFIX][RANDOM_ALPHANUMERIC]
   * Example: "REF12AB34CD" or "ABCD1234" (no prefix)
   */
  async generateReferralCode(userId: string): Promise<string> {
    this.logger.log(`Generating referral code for user: ${userId}`);

    // Check if referral system is enabled
    const enabled = await this.isReferralEnabled();
    if (!enabled) {
      this.logger.warn(`Referral system is disabled. Skipping code generation for user ${userId}`);
      throw new BadRequestException('Referral system is currently disabled');
    }

    // Check if user already has a code
    const existingCode = await this.prisma.referralCode.findUnique({
      where: { userId },
    });

    if (existingCode) {
      this.logger.warn(`User ${userId} already has referral code: ${existingCode.code}`);
      return existingCode.code;
    }

    // Get settings for code generation
    const [codeLength, prefix] = await Promise.all([
      this.getReferralCodeLength(),
      this.getReferralCodePrefix(),
    ]);

    // Generate unique code
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = this.generateRandomCode(codeLength, prefix);
      attempts++;

      // Check if code is unique
      const existing = await this.prisma.referralCode.findUnique({
        where: { code },
      });

      if (!existing) break;

      if (attempts >= maxAttempts) {
        throw new BadRequestException('Unable to generate unique referral code. Please try again.');
      }
    } while (attempts < maxAttempts);

    // Create referral code record
    const referralCode = await this.prisma.referralCode.create({
      data: {
        code,
        userId,
        isActive: true,
      },
    });

    this.logger.log(`✅ Generated referral code: ${code} for user ${userId}`);
    return referralCode.code;
  }

  /**
   * Generate random alphanumeric code
   * Uses uppercase letters and numbers for better readability
   * Excludes confusing characters: O, 0, I, 1, L
   */
  private generateRandomCode(length: number, prefix: string): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Excludes O, 0, I, 1, L
    let code = prefix.toUpperCase();

    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  }

  /**
   * Validate a referral code
   * Checks if code exists, is active, not expired, and not at max usage
   */
  async validateReferralCode(code: string): Promise<boolean> {
    try {
      const referralCode = await this.prisma.referralCode.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!referralCode) {
        this.logger.warn(`Referral code not found: ${code}`);
        return false;
      }

      // Check if active
      if (!referralCode.isActive) {
        this.logger.warn(`Referral code inactive: ${code}`);
        return false;
      }

      // Check if expired
      if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
        this.logger.warn(`Referral code expired: ${code}`);
        return false;
      }

      // Check max usage
      if (referralCode.maxUsage && referralCode.usageCount >= referralCode.maxUsage) {
        this.logger.warn(
          `Referral code at max usage: ${code} (${referralCode.usageCount}/${referralCode.maxUsage})`
        );
        return false;
      }

      this.logger.log(`✅ Referral code valid: ${code}`);
      return true;
    } catch (error) {
      this.logger.error(`Error validating referral code: ${error.message}`);
      return false;
    }
  }

  /**
   * Apply referral code to a newly registered user
   * Creates PENDING referral record and increments usage count
   * NON-BLOCKING: Returns void, logs errors without throwing
   */
  async applyReferralCode(code: string, newUserId: string): Promise<void> {
    try {
      this.logger.log(`Applying referral code ${code} to user ${newUserId}`);

      // Check if referral system is enabled
      const enabled = await this.isReferralEnabled();
      if (!enabled) {
        this.logger.warn(
          `Referral system is disabled. Skipping code application for user ${newUserId}`
        );
        return;
      }

      // Validate code
      const isValid = await this.validateReferralCode(code);
      if (!isValid) {
        this.logger.warn(`Invalid referral code: ${code}`);
        return;
      }

      // Get referral code with referrer info
      const referralCode = await this.prisma.referralCode.findUnique({
        where: { code: code.toUpperCase() },
        include: { user: true },
      });

      if (!referralCode) {
        this.logger.warn(`Referral code not found: ${code}`);
        return;
      }

      // Prevent self-referral
      if (referralCode.userId === newUserId) {
        this.logger.warn(`User ${newUserId} attempted self-referral with code ${code}`);
        return;
      }

      // Get referred user to determine role
      const referredUser = await this.prisma.user.findUnique({
        where: { id: newUserId },
      });

      if (!referredUser) {
        this.logger.warn(`Referred user not found: ${newUserId}`);
        return;
      }

      // Get reward amount and currency based on referred user's role (fetch BEFORE transaction)
      const rewardAmount =
        referredUser.role === 'SELLER'
          ? await this.getReferralSellerReward()
          : await this.getReferralBuyerReward();

      const rewardCurrency = await this.getReferralRewardCurrency();

      // Create referral record and update user/code in transaction
      await this.prisma.$transaction(async (prisma) => {
        // Create referral record (PENDING status)
        await prisma.referral.create({
          data: {
            referrerId: referralCode.userId,
            referredId: newUserId,
            referredUserRole: referredUser.role,
            rewardAmount: new Decimal(rewardAmount),
            rewardCurrency,
            status: ReferralStatus.PENDING,
          },
        });

        // Update referred user with referredById
        await prisma.user.update({
          where: { id: newUserId },
          data: { referredById: referralCode.userId },
        });

        // Increment code usage count
        await prisma.referralCode.update({
          where: { id: referralCode.id },
          data: { usageCount: { increment: 1 } },
        });
      });

      this.logger.log(
        `✅ Applied referral code ${code} to user ${newUserId}. Reward: $${rewardAmount} (${referredUser.role})`
      );
    } catch (error) {
      // NON-BLOCKING: Log error but don't throw
      this.logger.error(`Failed to apply referral code: ${error.message}`, error.stack);
    }
  }

  // ============================================================================
  // REFERRAL QUALIFICATION & REWARDS
  // ============================================================================

  /**
   * Check if a buyer's first order qualifies for referral reward
   * Called after order payment is successful
   * NON-BLOCKING: Returns void, logs errors without throwing
   */
  async checkBuyerQualification(orderId: string): Promise<void> {
    try {
      this.logger.log(`Checking buyer qualification for order: ${orderId}`);

      // Get order with user info
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            include: {
              referredReferrals: {
                where: { status: ReferralStatus.PENDING },
                take: 1,
              },
            },
          },
        },
      });

      if (!order) {
        this.logger.warn(`Order not found: ${orderId}`);
        return;
      }

      // Check if user has pending referral
      const pendingReferral = order.user.referredReferrals[0];
      if (!pendingReferral) {
        this.logger.log(`No pending referral for user ${order.userId}`);
        return;
      }

      // Check if this is first order
      const orderCount = await this.prisma.order.count({
        where: {
          userId: order.userId,
          paymentStatus: 'PAID',
        },
      });

      if (orderCount > 1) {
        this.logger.log(`User ${order.userId} already has ${orderCount} orders, not first order`);
        return;
      }

      // Check minimum order value
      const minOrderValue = await this.getReferralMinOrderValue();
      if (order.total.toNumber() < minOrderValue) {
        this.logger.log(`Order ${orderId} total $${order.total} below minimum $${minOrderValue}`);
        return;
      }

      // Check expiration
      const expirationDays = await this.getReferralBuyerExpirationDays();
      if (expirationDays > 0) {
        const expirationDate = new Date(pendingReferral.createdAt);
        expirationDate.setDate(expirationDate.getDate() + expirationDays);

        if (new Date() > expirationDate) {
          this.logger.log(`Referral ${pendingReferral.id} expired`);
          await this.expireReferral(pendingReferral.id);
          return;
        }
      }

      // Qualify and grant reward
      await this.qualifyReferral(pendingReferral.id, orderId);

      this.logger.log(`✅ Buyer qualification successful for order ${orderId}`);
    } catch (error) {
      // NON-BLOCKING: Log error but don't throw
      this.logger.error(`Failed to check buyer qualification: ${error.message}`, error.stack);
    }
  }

  /**
   * Check if a seller's first product creation qualifies for referral reward
   * Called after seller creates their first product
   * NON-BLOCKING: Returns void, logs errors without throwing
   */
  async checkSellerQualification(storeId: string): Promise<void> {
    try {
      this.logger.log(`Checking seller qualification for store: ${storeId}`);

      // Get store with user and pending referral
      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
        include: {
          user: {
            include: {
              referredReferrals: {
                where: { status: ReferralStatus.PENDING },
                take: 1,
              },
            },
          },
        },
      });

      if (!store) {
        this.logger.warn(`Store not found: ${storeId}`);
        return;
      }

      // Check if user has pending referral
      const pendingReferral = store.user.referredReferrals[0];
      if (!pendingReferral) {
        this.logger.log(`No pending referral for user ${store.userId}`);
        return;
      }

      // Check if referral is for SELLER role
      if (pendingReferral.referredUserRole !== 'SELLER') {
        this.logger.log(`Referral ${pendingReferral.id} is not for SELLER role`);
        return;
      }

      // Check if this is first product
      const productCount = await this.prisma.product.count({
        where: { storeId },
      });

      if (productCount > 1) {
        this.logger.log(`Store ${storeId} already has ${productCount} products, not first product`);
        return;
      }

      // Check expiration
      const expirationDays = await this.getReferralSellerExpirationDays();
      if (expirationDays > 0) {
        const expirationDate = new Date(pendingReferral.createdAt);
        expirationDate.setDate(expirationDate.getDate() + expirationDays);

        if (new Date() > expirationDate) {
          this.logger.log(`Referral ${pendingReferral.id} expired`);
          await this.expireReferral(pendingReferral.id);
          return;
        }
      }

      // Qualify and grant reward
      await this.qualifyReferral(pendingReferral.id, null, storeId);

      this.logger.log(`✅ Seller qualification successful for store ${storeId}`);
    } catch (error) {
      // NON-BLOCKING: Log error but don't throw
      this.logger.error(`Failed to check seller qualification: ${error.message}`, error.stack);
    }
  }

  /**
   * Mark referral as QUALIFIED and link to order/store
   */
  private async qualifyReferral(
    referralId: string,
    orderId?: string,
    storeId?: string
  ): Promise<void> {
    await this.prisma.referral.update({
      where: { id: referralId },
      data: {
        status: ReferralStatus.QUALIFIED,
        qualifiedAt: new Date(),
        ...(orderId && { orderId }),
        ...(storeId && { storeId }),
      },
    });

    // Immediately grant reward (move to PAID status)
    await this.grantReferralReward(referralId);
  }

  /**
   * Mark referral as EXPIRED
   */
  private async expireReferral(referralId: string): Promise<void> {
    await this.prisma.referral.update({
      where: { id: referralId },
      data: { status: ReferralStatus.EXPIRED },
    });
  }

  /**
   * Grant referral reward to referrer.
   * Branches on referral_reward_type setting:
   *  - 'store_credit': increments User.storeCredit immediately
   *  - 'coupon': creates a ReferralCoupon record the referrer redeems manually
   */
  async grantReferralReward(referralId: string): Promise<void> {
    try {
      this.logger.log(`Granting reward for referral: ${referralId}`);

      const referral = await this.prisma.referral.findUnique({
        where: { id: referralId },
        include: { referrer: true },
      });

      if (!referral) {
        throw new NotFoundException(`Referral ${referralId} not found`);
      }

      if (referral.status !== ReferralStatus.QUALIFIED) {
        this.logger.warn(`Referral ${referralId} is not qualified (status: ${referral.status})`);
        return;
      }

      const rewardType = await this.getReferralRewardType();

      if (rewardType === 'coupon') {
        // --- COUPON PATH ---
        const couponCode = await this.generateUniqueCouponCode();
        const rewardCurrency = referral.rewardCurrency || 'USD';

        // Get optional expiration (use buyer expiration days as a proxy)
        const expirationDays = await this.getReferralBuyerExpirationDays();
        const expiresAt =
          expirationDays > 0 ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000) : null;

        await this.prisma.$transaction(async (prisma) => {
          // Create coupon record
          await prisma.referralCoupon.create({
            data: {
              referralId,
              referrerId: referral.referrerId,
              code: couponCode,
              amount: referral.rewardAmount,
              currency: rewardCurrency,
              status: ReferralCouponStatus.ACTIVE,
              ...(expiresAt && { expiresAt }),
            },
          });

          // Stamp coupon code on referral and mark PAID
          await prisma.referral.update({
            where: { id: referralId },
            data: {
              status: ReferralStatus.PAID,
              paidAt: new Date(),
              couponCode,
            },
          });

          // totalReferrals counter still increments for leaderboard accuracy
          await prisma.user.update({
            where: { id: referral.referrerId },
            data: { totalReferrals: { increment: 1 } },
          });
        });

        this.logger.log(
          `✅ Issued coupon ${couponCode} ($${referral.rewardAmount}) to user ${referral.referrerId} for referral ${referralId}`
        );
      } else {
        // --- STORE CREDIT PATH (default) ---
        await this.prisma.$transaction(async (prisma) => {
          await prisma.user.update({
            where: { id: referral.referrerId },
            data: {
              storeCredit: { increment: referral.rewardAmount },
              totalReferrals: { increment: 1 },
            },
          });

          await prisma.referral.update({
            where: { id: referralId },
            data: { status: ReferralStatus.PAID, paidAt: new Date() },
          });
        });

        this.logger.log(
          `✅ Granted $${referral.rewardAmount} store credit to user ${referral.referrerId} for referral ${referralId}`
        );
      }
    } catch (error) {
      this.logger.error(`Failed to grant referral reward: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Redeem a referral coupon — converts it to store credit for the owner.
   * Called by the user from their referrals page.
   */
  async redeemReferralCoupon(
    userId: string,
    code: string
  ): Promise<{ amount: Decimal; currency: string }> {
    const coupon = await this.prisma.referralCoupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon code not found');
    }

    if (coupon.referrerId !== userId) {
      throw new BadRequestException('This coupon does not belong to you');
    }

    if (coupon.status !== ReferralCouponStatus.ACTIVE) {
      throw new BadRequestException(
        coupon.status === ReferralCouponStatus.REDEEMED
          ? 'This coupon has already been redeemed'
          : 'This coupon has expired'
      );
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      // Mark expired if not already done
      await this.prisma.referralCoupon.update({
        where: { id: coupon.id },
        data: { status: ReferralCouponStatus.EXPIRED },
      });
      throw new BadRequestException('This coupon has expired');
    }

    // Atomically redeem: add store credit + mark coupon REDEEMED
    await this.prisma.$transaction(async (prisma) => {
      await prisma.user.update({
        where: { id: userId },
        data: { storeCredit: { increment: coupon.amount } },
      });

      await prisma.referralCoupon.update({
        where: { id: coupon.id },
        data: { status: ReferralCouponStatus.REDEEMED, redeemedAt: new Date() },
      });
    });

    this.logger.log(
      `✅ Coupon ${code} redeemed by user ${userId} — $${coupon.amount} added to store credit`
    );

    return { amount: coupon.amount, currency: coupon.currency };
  }

  // ============================================================================
  // REFERRAL DASHBOARD & HISTORY
  // ============================================================================

  /**
   * Get referral summary for a user
   * Shows total referrals, earnings, pending rewards, etc.
   */
  async getReferralSummary(userId: string) {
    const [referralCode, stats, storeCredit] = await Promise.all([
      // Get user's referral code
      this.prisma.referralCode.findUnique({
        where: { userId },
      }),

      // Get referral statistics
      this.prisma.referral.groupBy({
        by: ['status'],
        where: { referrerId: userId },
        _sum: { rewardAmount: true },
        _count: true,
      }),

      // Get user's store credit balance
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { storeCredit: true, totalReferrals: true },
      }),
    ]);

    // Transform stats into summary
    const summary = {
      referralCode: referralCode?.code || null,
      codeActive: referralCode?.isActive || false,
      usageCount: referralCode?.usageCount || 0,
      maxUsage: referralCode?.maxUsage || 0,
      storeCredit: storeCredit?.storeCredit || new Decimal(0),
      totalReferrals: storeCredit?.totalReferrals || 0,
      pending: {
        count: 0,
        potentialEarnings: new Decimal(0),
      },
      qualified: {
        count: 0,
        amount: new Decimal(0),
      },
      paid: {
        count: 0,
        amount: new Decimal(0),
      },
      expired: {
        count: 0,
      },
    };

    // Populate stats from groupBy results
    stats.forEach((stat) => {
      const count = stat._count;
      const amount = stat._sum.rewardAmount || new Decimal(0);

      switch (stat.status) {
        case ReferralStatus.PENDING:
          summary.pending.count = count;
          summary.pending.potentialEarnings = new Decimal(amount.toString());
          break;
        case ReferralStatus.QUALIFIED:
          summary.qualified.count = count;
          summary.qualified.amount = new Decimal(amount.toString());
          break;
        case ReferralStatus.PAID:
          summary.paid.count = count;
          summary.paid.amount = new Decimal(amount.toString());
          break;
        case ReferralStatus.EXPIRED:
          summary.expired.count = count;
          break;
      }
    });

    return summary;
  }

  /**
   * Get referral history with pagination and filters
   */
  async getReferralHistory(
    userId: string,
    filters?: {
      status?: ReferralStatus;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ReferralWhereInput = {
      referrerId: userId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.startDate &&
        filters?.endDate && {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
    };

    const [referrals, total] = await Promise.all([
      this.prisma.referral.findMany({
        where,
        include: {
          referred: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              createdAt: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.referral.count({ where }),
    ]);

    return {
      data: referrals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================================
  // ADMIN METHODS
  // ============================================================================

  /**
   * Get top referrers for leaderboard
   */
  async getTopReferrers(limit: number = 10) {
    const topReferrers = await this.prisma.user.findMany({
      where: {
        totalReferrals: { gt: 0 },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        totalReferrals: true,
        storeCredit: true,
        referralCode: {
          select: {
            code: true,
            usageCount: true,
          },
        },
      },
      orderBy: { totalReferrals: 'desc' },
      take: limit,
    });

    return topReferrers;
  }

  /**
   * Get all referrals with filters (Admin only)
   */
  async getAllReferrals(filters?: {
    status?: ReferralStatus;
    referredUserRole?: UserRole;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ReferralWhereInput = {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.referredUserRole && { referredUserRole: filters.referredUserRole }),
      ...(filters?.startDate &&
        filters?.endDate && {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
    };

    const [referrals, total] = await Promise.all([
      this.prisma.referral.findMany({
        where,
        include: {
          referrer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          referred: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.referral.count({ where }),
    ]);

    return {
      data: referrals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get referral statistics for admin dashboard
   */
  async getReferralStatistics(filters?: { startDate?: Date; endDate?: Date }) {
    const dateFilter =
      filters?.startDate && filters?.endDate
        ? { createdAt: { gte: filters.startDate, lte: filters.endDate } }
        : {};

    const [totalStats, buyerStats, sellerStats, statusStats] = await Promise.all([
      // Overall stats
      this.prisma.referral.aggregate({
        where: dateFilter,
        _sum: { rewardAmount: true },
        _count: true,
      }),

      // Buyer referral stats
      this.prisma.referral.aggregate({
        where: { ...dateFilter, referredUserRole: 'BUYER' },
        _sum: { rewardAmount: true },
        _count: true,
      }),

      // Seller referral stats
      this.prisma.referral.aggregate({
        where: { ...dateFilter, referredUserRole: 'SELLER' },
        _sum: { rewardAmount: true },
        _count: true,
      }),

      // Stats by status
      this.prisma.referral.groupBy({
        by: ['status'],
        where: dateFilter,
        _sum: { rewardAmount: true },
        _count: true,
      }),
    ]);

    // Transform status stats into object
    const byStatus: any = {
      pending: { count: 0, amount: 0 },
      qualified: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      expired: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 },
    };

    statusStats.forEach((stat) => {
      const key = stat.status.toLowerCase();
      byStatus[key] = {
        count: stat._count,
        amount: stat._sum.rewardAmount || 0,
      };
    });

    return {
      total: {
        count: totalStats._count,
        rewardsPaid: totalStats._sum.rewardAmount || 0,
      },
      buyers: {
        count: buyerStats._count,
        rewardsPaid: buyerStats._sum.rewardAmount || 0,
      },
      sellers: {
        count: sellerStats._count,
        rewardsPaid: sellerStats._sum.rewardAmount || 0,
      },
      byStatus,
    };
  }

  // ============================================================================
  // SETTINGS HELPERS
  // ============================================================================

  /**
   * Get all referral settings at once (optimized)
   */
  async getReferralSettings() {
    const D = SETTING_DEFAULTS.referral;
    try {
      const settings = await this.settingsService.getSettingsByCategory('referral');

      const map = settings.reduce(
        (acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        },
        {} as Record<string, any>
      );

      return {
        enabled: map['referral_enabled'] != null ? Boolean(map['referral_enabled']) : D.enabled,
        rewardType:
          map['referral_reward_type'] != null
            ? (String(map['referral_reward_type']) as 'store_credit' | 'coupon')
            : D.reward_type,
        buyerReward:
          map['referral_buyer_reward'] != null
            ? Number(map['referral_buyer_reward'])
            : D.buyer_reward,
        sellerReward:
          map['referral_seller_reward'] != null
            ? Number(map['referral_seller_reward'])
            : D.seller_reward,
        minOrderValue:
          map['referral_min_order_value'] != null
            ? Number(map['referral_min_order_value'])
            : D.min_order_value,
        buyerExpirationDays:
          map['referral_buyer_expiration_days'] != null
            ? Number(map['referral_buyer_expiration_days'])
            : D.buyer_expiration_days,
        sellerExpirationDays:
          map['referral_seller_expiration_days'] != null
            ? Number(map['referral_seller_expiration_days'])
            : D.seller_expiration_days,
        codeLength:
          map['referral_code_length'] != null ? Number(map['referral_code_length']) : D.code_length,
        codePrefix:
          map['referral_code_prefix'] != null ? String(map['referral_code_prefix']) : D.code_prefix,
        maxUsagePerCode:
          map['referral_max_usage_per_code'] != null
            ? Number(map['referral_max_usage_per_code'])
            : D.max_usage_per_code,
        rewardCurrency:
          map['referral_reward_currency'] != null
            ? String(map['referral_reward_currency'])
            : D.reward_currency,
        autoGenerateCode:
          map['referral_auto_generate_code'] != null
            ? Boolean(map['referral_auto_generate_code'])
            : D.auto_generate_code,
        minPayoutAmount:
          map['referral_min_payout_amount'] != null
            ? Number(map['referral_min_payout_amount'])
            : D.min_payout_amount,
        showLeaderboard:
          map['referral_show_leaderboard'] != null
            ? Boolean(map['referral_show_leaderboard'])
            : D.show_leaderboard,
      };
    } catch (error) {
      this.logger.warn('Failed to get referral settings, using fallback defaults');
      return {
        enabled: D.enabled,
        rewardType: D.reward_type,
        buyerReward: D.buyer_reward,
        sellerReward: D.seller_reward,
        minOrderValue: D.min_order_value,
        buyerExpirationDays: D.buyer_expiration_days,
        sellerExpirationDays: D.seller_expiration_days,
        codeLength: D.code_length,
        codePrefix: D.code_prefix,
        maxUsagePerCode: D.max_usage_per_code,
        rewardCurrency: D.reward_currency,
        autoGenerateCode: D.auto_generate_code,
        minPayoutAmount: D.min_payout_amount,
        showLeaderboard: D.show_leaderboard,
      };
    }
  }

  // Individual setting getters (with fallbacks)
  private async isReferralEnabled(): Promise<boolean> {
    try {
      const setting = await this.settingsService.getSetting('referral_enabled');
      if (setting?.value != null) return Boolean(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    return SETTING_DEFAULTS.referral.enabled;
  }

  private async getReferralBuyerReward(): Promise<number> {
    try {
      const setting = await this.settingsService.getSetting('referral_buyer_reward');
      if (setting?.value != null) return Number(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    return SETTING_DEFAULTS.referral.buyer_reward;
  }

  private async getReferralSellerReward(): Promise<number> {
    try {
      const setting = await this.settingsService.getSetting('referral_seller_reward');
      if (setting?.value != null) return Number(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    return SETTING_DEFAULTS.referral.seller_reward;
  }

  private async getReferralMinOrderValue(): Promise<number> {
    try {
      const setting = await this.settingsService.getSetting('referral_min_order_value');
      if (setting?.value != null) return Number(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    return SETTING_DEFAULTS.referral.min_order_value;
  }

  private async getReferralBuyerExpirationDays(): Promise<number> {
    try {
      const setting = await this.settingsService.getSetting('referral_buyer_expiration_days');
      if (setting?.value != null) return Number(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    return SETTING_DEFAULTS.referral.buyer_expiration_days;
  }

  private async getReferralSellerExpirationDays(): Promise<number> {
    try {
      const setting = await this.settingsService.getSetting('referral_seller_expiration_days');
      if (setting?.value != null) return Number(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    return SETTING_DEFAULTS.referral.seller_expiration_days;
  }

  private async getReferralCodeLength(): Promise<number> {
    try {
      const setting = await this.settingsService.getSetting('referral_code_length');
      if (setting?.value != null) {
        const length = Number(setting.value);
        // Enforce min/max
        return Math.max(6, Math.min(12, length));
      }
    } catch {
      // DB unavailable or setting missing
    }
    return SETTING_DEFAULTS.referral.code_length;
  }

  private async getReferralCodePrefix(): Promise<string> {
    try {
      const setting = await this.settingsService.getSetting('referral_code_prefix');
      const prefix = setting.value != null ? String(setting.value) : '';
      // Enforce max length
      return prefix.slice(0, 4);
    } catch {
      // DB unavailable or setting missing
    }
    return SETTING_DEFAULTS.referral.code_prefix;
  }

  private async getReferralRewardCurrency(): Promise<string> {
    try {
      const setting = await this.settingsService.getSetting('referral_reward_currency');
      if (setting?.value != null) return String(setting.value);
    } catch {
      // DB unavailable or setting missing
    }
    return SETTING_DEFAULTS.referral.reward_currency;
  }

  private async getReferralRewardType(): Promise<'store_credit' | 'coupon'> {
    try {
      const setting = await this.settingsService.getSetting('referral_reward_type');
      const val = setting?.value != null ? String(setting.value) : null;
      if (val === 'coupon') return 'coupon';
    } catch {
      // DB unavailable or setting missing
    }
    return SETTING_DEFAULTS.referral.reward_type;
  }

  /**
   * Generate a unique coupon code in the format CPN-XXXXXXXX
   */
  private async generateUniqueCouponCode(): Promise<string> {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let attempts = 0;

    while (attempts < 10) {
      let code = 'CPN-';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const existing = await this.prisma.referralCoupon.findUnique({ where: { code } });
      if (!existing) return code;
      attempts++;
    }

    throw new Error('Unable to generate unique coupon code');
  }
}
