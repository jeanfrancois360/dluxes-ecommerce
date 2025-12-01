import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CommissionService } from './commission.service';
import { CommissionRuleType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Enhanced Commission Service - Extends existing commission logic
 * WITHOUT modifying the original CommissionService
 */
@Injectable()
export class EnhancedCommissionService {
  private readonly logger = new Logger(EnhancedCommissionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly baseCommissionService: CommissionService,
  ) {}

  /**
   * Find applicable commission rule with seller-specific override support
   * Priority: Seller Override > Category Rule > Global Rule
   */
  async findApplicableRuleWithOverride(
    sellerId: string,
    categoryId: string | null,
    orderAmount: Decimal
  ) {
    const now = new Date();

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
              { minOrderValue: { lte: orderAmount.toNumber() } },
            ],
          },
          {
            OR: [
              { maxOrderValue: null },
              { maxOrderValue: { gte: orderAmount.toNumber() } },
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
      return {
        type: sellerOverride.commissionType,
        value: sellerOverride.commissionRate,
        source: 'SELLER_OVERRIDE',
        id: sellerOverride.id,
      };
    }

    // 2. Fall back to original commission service logic (category/global rules)
    return null;
  }

  /**
   * Create seller-specific commission override (Admin only)
   */
  async createSellerOverride(data: {
    sellerId: string;
    commissionType: CommissionRuleType;
    commissionRate: number;
    categoryId?: string;
    minOrderValue?: number;
    maxOrderValue?: number;
    validFrom?: Date;
    validUntil?: Date;
    notes?: string;
    approvedBy: string;
  }) {
    const override = await this.prisma.sellerCommissionOverride.create({
      data: {
        sellerId: data.sellerId,
        commissionType: data.commissionType,
        commissionRate: new Decimal(data.commissionRate),
        categoryId: data.categoryId,
        minOrderValue: data.minOrderValue
          ? new Decimal(data.minOrderValue)
          : undefined,
        maxOrderValue: data.maxOrderValue
          ? new Decimal(data.maxOrderValue)
          : undefined,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        notes: data.notes,
        approvedBy: data.approvedBy,
        approvedAt: new Date(),
        priority: 100, // Higher than standard rules
        isActive: true,
      },
    });

    this.logger.log(
      `Created commission override for seller ${data.sellerId}: ${data.commissionRate}%`
    );

    return override;
  }

  /**
   * Get seller's commission override
   */
  async getSellerOverride(sellerId: string) {
    return this.prisma.sellerCommissionOverride.findUnique({
      where: { sellerId },
      include: {
        seller: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  /**
   * Get all seller overrides (Admin)
   */
  async getAllSellerOverrides(filters?: {
    isActive?: boolean;
    categoryId?: string;
  }) {
    return this.prisma.sellerCommissionOverride.findMany({
      where: {
        ...(filters?.isActive !== undefined && {
          isActive: filters.isActive,
        }),
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
      },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update seller override
   */
  async updateSellerOverride(
    sellerId: string,
    data: Partial<{
      commissionRate: number;
      isActive: boolean;
      validFrom: Date;
      validUntil: Date;
      notes: string;
    }>
  ) {
    const updateData: any = { ...data };
    if (data.commissionRate !== undefined) {
      updateData.commissionRate = new Decimal(data.commissionRate);
    }

    return this.prisma.sellerCommissionOverride.update({
      where: { sellerId },
      data: updateData,
    });
  }

  /**
   * Delete seller override
   */
  async deleteSellerOverride(sellerId: string) {
    return this.prisma.sellerCommissionOverride.delete({
      where: { sellerId },
    });
  }
}
