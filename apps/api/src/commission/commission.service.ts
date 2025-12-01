import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CommissionRuleType,
  CommissionStatus,
  PaymentTransactionStatus,
  Prisma
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Commission Service
 * Handles commission calculation, rules engine, and payout management
 */
@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  constructor(private readonly prisma: PrismaService) {}

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

    // Calculate commission per order item
    for (const item of transaction.order.items) {
      if (!item.product.store) {
        this.logger.warn(`Product ${item.productId} has no store, skipping commission`);
        continue;
      }

      const itemTotal = new Decimal(item.total);
      const rule = await this.findApplicableRule(
        item.product.store.userId,
        item.product.categoryId,
        itemTotal
      );

      const commissionAmount = this.calculateAmount(itemTotal, rule);

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
          ruleValue: rule?.value || new Decimal(10), // Default 10%
          orderAmount: itemTotal,
          commissionAmount,
          currency: transaction.currency,
          status: CommissionStatus.CONFIRMED,
        },
      });

      this.logger.log(
        `Commission created: ${commissionAmount} ${transaction.currency} for seller ${item.product.store.userId}`
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

    // 1. Check for seller-specific override (HIGHEST PRIORITY)
    const sellerOverride = await this.prisma.sellerCommissionOverride.findFirst({
      where: {
        sellerId,
        isActive: true,
        OR: [
          { categoryId },
          { categoryId: null }, // Global override for seller
        ],
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
          {
            OR: [
              { minOrderValue: null },
              { minOrderValue: { lte: orderAmountNumber } },
            ],
          },
          {
            OR: [
              { maxOrderValue: null },
              { maxOrderValue: { gte: orderAmountNumber } },
            ],
          },
        ],
      },
      orderBy: { priority: 'desc' },
    });

    if (sellerOverride) {
      this.logger.log(
        `Using seller override for ${sellerId}: ${sellerOverride.commissionRate}%`
      );
      // Convert override to rule format
      return {
        id: sellerOverride.id,
        type: sellerOverride.commissionType,
        value: sellerOverride.commissionRate,
      };
    }

    // 2. Fall back to standard commission rules (category/global rules)
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
            OR: [
              { minOrderValue: null },
              { minOrderValue: { lte: orderAmountNumber } },
            ],
          },
          {
            OR: [
              { maxOrderValue: null },
              { maxOrderValue: { gte: orderAmountNumber } },
            ],
          },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 1,
    });

    return rules[0] || null;
  }

  /**
   * Calculate commission amount based on rule
   */
  private calculateAmount(orderAmount: Decimal, rule: any | null): Decimal {
    if (!rule) {
      // Default 10% commission
      return orderAmount.mul(0.1);
    }

    if (rule.type === CommissionRuleType.PERCENTAGE) {
      return orderAmount.mul(rule.value.toNumber() / 100);
    } else {
      // Fixed amount
      return new Decimal(rule.value);
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
  async updateRule(id: string, data: Partial<{
    name: string;
    description: string;
    type: CommissionRuleType;
    value: number;
    isActive: boolean;
    priority: number;
    validFrom: Date;
    validUntil: Date;
  }>) {
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
    const dateFilter = filters?.startDate && filters?.endDate
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
    const dateFilter = filters?.startDate && filters?.endDate
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
    const sellerIds = topSellers.map(s => s.sellerId);
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

    const sellerMap = new Map(sellers.map(s => [s.id, s]));

    return topSellers.map(s => ({
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
      ...(filters?.startDate && filters?.endDate && {
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
