import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import {
  CommissionRuleType,
  CommissionStatus,
  PaymentTransactionStatus,
  Prisma,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Commission Service
 * Handles commission calculation, rules engine, and payout management
 */
@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService
  ) {}

  /**
   * Calculate and create commission entries for a successful payment transaction
   */
  async calculateCommissionForTransaction(transactionId: string): Promise<void> {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    store: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Payment transaction not found');
    }

    if (transaction.status !== PaymentTransactionStatus.SUCCEEDED) {
      this.logger.warn(
        `Cannot calculate commission for transaction ${transactionId} with status ${transaction.status}`
      );
      return;
    }

    // Check if commission should include shipping
    const applyToShipping = await this.shouldApplyCommissionToShipping();
    const orderShipping = new Decimal(transaction.order.shipping);
    const orderSubtotal = transaction.order.items.reduce(
      (sum, item) => sum.add(new Decimal(item.total)),
      new Decimal(0)
    );

    // Calculate commission per order item
    for (const item of transaction.order.items) {
      if (!item.product.store) {
        this.logger.warn(`Product ${item.productId} has no store, skipping commission`);
        continue;
      }

      let commissionBase = new Decimal(item.total);

      // If commission applies to shipping, distribute shipping proportionally
      if (applyToShipping && orderShipping.greaterThan(0) && orderSubtotal.greaterThan(0)) {
        const itemProportion = new Decimal(item.total).dividedBy(orderSubtotal);
        const itemShippingShare = orderShipping.times(itemProportion);
        commissionBase = commissionBase.add(itemShippingShare);

        this.logger.log(
          `Item ${item.id}: proportional shipping share = ${itemShippingShare.toFixed(2)} (${itemProportion.times(100).toFixed(2)}% of ${orderShipping.toFixed(2)})`
        );
      }

      const rule = await this.findApplicableRule(
        item.product.store.userId,
        item.product.categoryId,
        commissionBase
      );

      const commissionAmount = await this.calculateAmount(commissionBase, rule);

      // Get default commission rate if no rule found
      let ruleValue = rule?.value;
      if (!ruleValue) {
        ruleValue = await this.getDefaultCommissionRate();
      }

      // Create commission entry
      await this.prisma.commission.create({
        data: {
          transactionId,
          orderId: transaction.orderId,
          orderItemId: item.id,
          sellerId: item.product.store.userId,
          storeId: item.product.storeId!,
          ruleId: rule?.id,
          ruleType: rule?.type || CommissionRuleType.PERCENTAGE,
          ruleValue,
          orderAmount: commissionBase,
          commissionAmount,
          currency: transaction.currency,
          status: CommissionStatus.CONFIRMED,
        },
      });

      this.logger.log(
        `Commission created: ${commissionAmount} ${transaction.currency} for seller ${item.product.store.userId} (base: ${commissionBase.toFixed(2)})`
      );
    }
  }

  /**
   * Find the most applicable commission rule based on priority
   * Priority: Seller Override > Seller Rule > Category Rule > Default Rule
   */
  private async findApplicableRule(
    sellerId: string,
    categoryId: string | null,
    orderAmount: Decimal
  ) {
    const now = new Date();
    const orderAmountNumber = orderAmount.toNumber();

    // Priority 1: Seller + Category specific override (MOST SPECIFIC)
    if (categoryId) {
      const sellerCategoryOverride = await this.prisma.sellerCommissionOverride.findFirst({
        where: {
          sellerId,
          categoryId,
          isActive: true,
          AND: [
            { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
            { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
            {
              OR: [{ minOrderValue: null }, { minOrderValue: { lte: orderAmountNumber } }],
            },
            {
              OR: [{ maxOrderValue: null }, { maxOrderValue: { gte: orderAmountNumber } }],
            },
          ],
        },
        orderBy: { priority: 'desc' },
      });

      if (sellerCategoryOverride) {
        this.logger.log(
          `Using seller+category override for ${sellerId} + ${categoryId}: ${sellerCategoryOverride.commissionRate}%`
        );
        return {
          id: sellerCategoryOverride.id,
          type: sellerCategoryOverride.commissionType,
          value: sellerCategoryOverride.commissionRate,
        };
      }
    }

    // Priority 2: Seller-only override (all categories)
    const sellerOverride = await this.prisma.sellerCommissionOverride.findFirst({
      where: {
        sellerId,
        categoryId: null,
        isActive: true,
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
          {
            OR: [{ minOrderValue: null }, { minOrderValue: { lte: orderAmountNumber } }],
          },
          {
            OR: [{ maxOrderValue: null }, { maxOrderValue: { gte: orderAmountNumber } }],
          },
        ],
      },
      orderBy: { priority: 'desc' },
    });

    if (sellerOverride) {
      this.logger.log(
        `Using seller-only override for ${sellerId}: ${sellerOverride.commissionRate}%`
      );
      return {
        id: sellerOverride.id,
        type: sellerOverride.commissionType,
        value: sellerOverride.commissionRate,
      };
    }

    // Priority 3: Category-only override (all sellers)
    if (categoryId) {
      const categoryOverride = await this.prisma.sellerCommissionOverride.findFirst({
        where: {
          sellerId: null,
          categoryId,
          isActive: true,
          AND: [
            { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
            { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
            {
              OR: [{ minOrderValue: null }, { minOrderValue: { lte: orderAmountNumber } }],
            },
            {
              OR: [{ maxOrderValue: null }, { maxOrderValue: { gte: orderAmountNumber } }],
            },
          ],
        },
        orderBy: { priority: 'desc' },
      });

      if (categoryOverride) {
        this.logger.log(
          `Using category-only override for ${categoryId}: ${categoryOverride.commissionRate}%`
        );
        return {
          id: categoryOverride.id,
          type: categoryOverride.commissionType,
          value: categoryOverride.commissionRate,
        };
      }
    }

    // Priority 4-6: Fall back to standard commission rules (category/global rules)
    const rules = await this.prisma.commissionRule.findMany({
      where: {
        isActive: true,
        OR: [
          { sellerId },
          { categoryId },
          { AND: [{ sellerId: null }, { categoryId: null }] }, // Default rule
        ],
        AND: [
          {
            OR: [{ validFrom: null }, { validFrom: { lte: now } }],
          },
          {
            OR: [{ validUntil: null }, { validUntil: { gte: now } }],
          },
          {
            OR: [{ minOrderValue: null }, { minOrderValue: { lte: orderAmountNumber } }],
          },
          {
            OR: [{ maxOrderValue: null }, { maxOrderValue: { gte: orderAmountNumber } }],
          },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 1,
    });

    return rules[0] || null;
  }

  /**
   * Calculate commission amount based on rule and apply settings (min/max/fixed fee)
   */
  private async calculateAmount(orderAmount: Decimal, rule: any | null): Promise<Decimal> {
    // Step 1: Calculate base percentage commission
    let percentageCommission: Decimal;

    if (!rule) {
      // Get default commission rate from settings
      const defaultRate = await this.getDefaultCommissionRate();
      percentageCommission = orderAmount.mul(defaultRate.toNumber() / 100);
    } else if (rule.type === CommissionRuleType.PERCENTAGE) {
      percentageCommission = orderAmount.mul(rule.value.toNumber() / 100);
    } else {
      // Fixed amount rule
      percentageCommission = new Decimal(rule.value);
    }

    // Step 2: Apply min/max caps from settings
    try {
      const [minSetting, maxSetting, fixedFeeSetting] = await Promise.all([
        this.settingsService.getSetting('commission_min_amount').catch(() => null),
        this.settingsService.getSetting('commission_max_amount').catch(() => null),
        this.settingsService.getSetting('commission_fixed_fee').catch(() => null),
      ]);

      // Apply minimum cap
      if (minSetting && minSetting.value) {
        const minAmount = new Decimal(Number(minSetting.value));
        if (percentageCommission.lessThan(minAmount)) {
          this.logger.log(
            `Applying minimum commission cap: ${percentageCommission.toFixed(2)} -> ${minAmount.toFixed(2)}`
          );
          percentageCommission = minAmount;
        }
      }

      // Apply maximum cap (if set and > 0)
      if (maxSetting && maxSetting.value) {
        const maxAmount = new Decimal(Number(maxSetting.value));
        if (maxAmount.greaterThan(0) && percentageCommission.greaterThan(maxAmount)) {
          this.logger.log(
            `Applying maximum commission cap: ${percentageCommission.toFixed(2)} -> ${maxAmount.toFixed(2)}`
          );
          percentageCommission = maxAmount;
        }
      }

      // Step 3: Add fixed transaction fee
      if (fixedFeeSetting && fixedFeeSetting.value) {
        const fixedFee = new Decimal(Number(fixedFeeSetting.value));
        if (fixedFee.greaterThan(0)) {
          this.logger.log(
            `Adding fixed transaction fee: ${percentageCommission.toFixed(2)} + ${fixedFee.toFixed(2)} = ${percentageCommission.add(fixedFee).toFixed(2)}`
          );
          percentageCommission = percentageCommission.add(fixedFee);
        }
      }
    } catch (error) {
      this.logger.warn('Error applying commission settings, using base calculation', error);
    }

    return percentageCommission;
  }

  /**
   * Get default commission rate from settings
   * Falls back to env variable or hardcoded value
   */
  private async getDefaultCommissionRate(): Promise<Decimal> {
    try {
      const setting = await this.settingsService.getSetting('global_commission_rate');
      const rate = Number(setting.value);
      if (rate && !isNaN(rate)) {
        return new Decimal(rate);
      }
    } catch (error) {
      this.logger.warn('global_commission_rate setting not found, using fallback');
    }

    // Fallback to env variable or hardcoded 10%
    const envRate = process.env.DEFAULT_COMMISSION_RATE;
    if (envRate) {
      return new Decimal(parseFloat(envRate));
    }

    return new Decimal(10);
  }

  /**
   * Check if commission should be applied to shipping fees
   */
  private async shouldApplyCommissionToShipping(): Promise<boolean> {
    try {
      const setting = await this.settingsService.getSetting('commission_applies_to_shipping');
      return Boolean(setting.value);
    } catch (error) {
      this.logger.warn('commission_applies_to_shipping setting not found, defaulting to false');
      return false;
    }
  }

  /**
   * Get seller's commission summary
   */
  async getSellerCommissionSummary(sellerId: string) {
    const [total, pending, confirmed, paid] = await Promise.all([
      this.prisma.commission.aggregate({
        where: { sellerId },
        _sum: { commissionAmount: true },
        _count: true,
      }),
      this.prisma.commission.aggregate({
        where: { sellerId, status: CommissionStatus.PENDING },
        _sum: { commissionAmount: true },
        _count: true,
      }),
      this.prisma.commission.aggregate({
        where: { sellerId, status: CommissionStatus.CONFIRMED },
        _sum: { commissionAmount: true },
        _count: true,
      }),
      this.prisma.commission.aggregate({
        where: { sellerId, status: CommissionStatus.PAID },
        _sum: { commissionAmount: true },
        _count: true,
      }),
    ]);

    return {
      total: {
        amount: total._sum.commissionAmount || 0,
        count: total._count,
      },
      pending: {
        amount: pending._sum.commissionAmount || 0,
        count: pending._count,
      },
      confirmed: {
        amount: confirmed._sum.commissionAmount || 0,
        count: confirmed._count,
      },
      paid: {
        amount: paid._sum.commissionAmount || 0,
        count: paid._count,
      },
      available: confirmed._sum.commissionAmount || 0, // Available for payout
    };
  }

  /**
   * Get seller's commission history with filters
   */
  async getSellerCommissions(
    sellerId: string,
    filters?: {
      status?: CommissionStatus;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CommissionWhereInput = {
      sellerId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.startDate &&
        filters?.endDate && {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
    };

    const [commissions, total] = await Promise.all([
      this.prisma.commission.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              createdAt: true,
            },
          },
          store: {
            select: {
              name: true,
            },
          },
          payout: {
            select: {
              id: true,
              status: true,
              processedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.commission.count({ where }),
    ]);

    return {
      data: commissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create commission rules (Admin only)
   */
  async createRule(data: {
    name: string;
    description?: string;
    type: CommissionRuleType;
    value: number;
    categoryId?: string;
    sellerId?: string;
    minOrderValue?: number;
    maxOrderValue?: number;
    tier?: number;
    priority?: number;
    validFrom?: Date;
    validUntil?: Date;
  }) {
    return this.prisma.commissionRule.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        value: new Decimal(data.value),
        categoryId: data.categoryId,
        sellerId: data.sellerId,
        minOrderValue: data.minOrderValue ? new Decimal(data.minOrderValue) : undefined,
        maxOrderValue: data.maxOrderValue ? new Decimal(data.maxOrderValue) : undefined,
        tier: data.tier || 0,
        priority: data.priority || 0,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
      },
    });
  }

  /**
   * Get all commission rules (Admin only)
   */
  async getAllRules(filters?: { isActive?: boolean; categoryId?: string; sellerId?: string }) {
    return this.prisma.commissionRule.findMany({
      where: {
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.sellerId && { sellerId: filters.sellerId }),
      },
      include: {
        category: {
          select: { name: true, slug: true },
        },
        seller: {
          select: { email: true, firstName: true, lastName: true },
        },
        _count: {
          select: { commissions: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Update commission rule
   */
  async updateRule(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      type: CommissionRuleType;
      value: number;
      isActive: boolean;
      priority: number;
      validFrom: Date;
      validUntil: Date;
    }>
  ) {
    const updateData: any = { ...data };
    if (data.value !== undefined) {
      updateData.value = new Decimal(data.value);
    }

    return this.prisma.commissionRule.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete commission rule
   */
  async deleteRule(id: string) {
    return this.prisma.commissionRule.delete({
      where: { id },
    });
  }

  /**
   * Handle order cancellation - cancel associated commissions
   */
  async cancelCommissionsForOrder(orderId: string): Promise<void> {
    await this.prisma.commission.updateMany({
      where: {
        orderId,
        status: { in: [CommissionStatus.PENDING, CommissionStatus.CONFIRMED] },
      },
      data: {
        status: CommissionStatus.CANCELLED,
      },
    });

    this.logger.log(`Cancelled commissions for order ${orderId}`);
  }

  /**
   * Get commission statistics for admin dashboard
   */
  async getCommissionStatistics(filters?: { startDate?: Date; endDate?: Date }) {
    const dateFilter =
      filters?.startDate && filters?.endDate
        ? { createdAt: { gte: filters.startDate, lte: filters.endDate } }
        : {};

    const [total, pending, confirmed, paid, cancelled] = await Promise.all([
      this.prisma.commission.aggregate({
        where: dateFilter,
        _sum: { commissionAmount: true, orderAmount: true },
        _count: true,
      }),
      this.prisma.commission.aggregate({
        where: { ...dateFilter, status: CommissionStatus.PENDING },
        _sum: { commissionAmount: true },
        _count: true,
      }),
      this.prisma.commission.aggregate({
        where: { ...dateFilter, status: CommissionStatus.CONFIRMED },
        _sum: { commissionAmount: true },
        _count: true,
      }),
      this.prisma.commission.aggregate({
        where: { ...dateFilter, status: CommissionStatus.PAID },
        _sum: { commissionAmount: true },
        _count: true,
      }),
      this.prisma.commission.aggregate({
        where: { ...dateFilter, status: CommissionStatus.CANCELLED },
        _sum: { commissionAmount: true },
        _count: true,
      }),
    ]);

    return {
      totalCommissions: total._count,
      totalCommissionAmount: total._sum.commissionAmount || 0,
      totalOrderAmount: total._sum.orderAmount || 0,
      pendingCount: pending._count,
      pendingAmount: pending._sum.commissionAmount || 0,
      confirmedCount: confirmed._count,
      confirmedAmount: confirmed._sum.commissionAmount || 0,
      paidCount: paid._count,
      paidAmount: paid._sum.commissionAmount || 0,
      cancelledCount: cancelled._count,
      cancelledAmount: cancelled._sum.commissionAmount || 0,
    };
  }

  /**
   * Get top sellers by commission earned
   */
  async getTopSellersByCommission(filters?: { startDate?: Date; endDate?: Date; limit?: number }) {
    const dateFilter =
      filters?.startDate && filters?.endDate
        ? { createdAt: { gte: filters.startDate, lte: filters.endDate } }
        : {};

    const topSellers = await this.prisma.commission.groupBy({
      by: ['sellerId'],
      where: {
        ...dateFilter,
        status: { in: [CommissionStatus.CONFIRMED, CommissionStatus.PAID] },
      },
      _sum: { commissionAmount: true, orderAmount: true },
      _count: true,
      orderBy: { _sum: { commissionAmount: 'desc' } },
      take: filters?.limit || 10,
    });

    // Get seller details
    const sellerIds = topSellers.map((s) => s.sellerId);
    const sellers = await this.prisma.user.findMany({
      where: { id: { in: sellerIds } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        store: {
          select: { name: true },
        },
      },
    });

    const sellerMap = new Map(sellers.map((s) => [s.id, s]));

    return topSellers.map((s) => ({
      sellerId: s.sellerId,
      seller: sellerMap.get(s.sellerId),
      totalCommission: s._sum.commissionAmount || 0,
      totalOrderAmount: s._sum.orderAmount || 0,
      transactionCount: s._count,
    }));
  }

  /**
   * Get recent commissions
   */
  async getRecentCommissions(limit: number = 10) {
    return this.prisma.commission.findMany({
      include: {
        seller: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
          },
        },
        store: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get all commissions with filters (Admin only)
   */
  async getAllCommissions(filters?: {
    status?: CommissionStatus;
    sellerId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CommissionWhereInput = {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.sellerId && { sellerId: filters.sellerId }),
      ...(filters?.startDate &&
        filters?.endDate && {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
    };

    const [commissions, total] = await Promise.all([
      this.prisma.commission.findMany({
        where,
        include: {
          seller: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          order: {
            select: {
              orderNumber: true,
              createdAt: true,
            },
          },
          store: {
            select: {
              name: true,
            },
          },
          rule: {
            select: {
              name: true,
              type: true,
              value: true,
            },
          },
          payout: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.commission.count({ where }),
    ]);

    return {
      data: commissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
