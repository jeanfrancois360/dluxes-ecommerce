import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
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
    private readonly baseCommissionService: CommissionService
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
            OR: [{ minOrderValue: null }, { minOrderValue: { lte: orderAmount.toNumber() } }],
          },
          {
            OR: [{ maxOrderValue: null }, { maxOrderValue: { gte: orderAmount.toNumber() } }],
          },
        ],
      },
      orderBy: { priority: 'desc' },
    });

    if (sellerOverride) {
      this.logger.log(`Using seller override for ${sellerId}: ${sellerOverride.commissionRate}%`);
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
   * Create commission override (Admin only)
   * Supports: seller-only, category-only, or seller+category combinations
   */
  async createSellerOverride(data: {
    sellerId?: string;
    categoryId?: string;
    commissionType: CommissionRuleType;
    commissionRate: number;
    minOrderValue?: number;
    maxOrderValue?: number;
    validFrom?: Date;
    validUntil?: Date;
    notes?: string;
    approvedBy: string;
  }) {
    // Validation: At least one of sellerId or categoryId required
    if (!data.sellerId && !data.categoryId) {
      throw new BadRequestException('At least one of sellerId or categoryId must be provided');
    }

    // Check for duplicate (sellerId, categoryId) combination
    const existing = await this.prisma.sellerCommissionOverride.findFirst({
      where: {
        sellerId: data.sellerId || null,
        categoryId: data.categoryId || null,
      },
    });

    if (existing) {
      const scope =
        data.sellerId && data.categoryId
          ? 'seller + category'
          : data.sellerId
            ? 'seller'
            : 'category';
      throw new ConflictException(`Override already exists for this ${scope} combination`);
    }

    const override = await this.prisma.sellerCommissionOverride.create({
      data: {
        sellerId: data.sellerId || null,
        categoryId: data.categoryId || null,
        commissionType: data.commissionType,
        commissionRate: new Decimal(data.commissionRate),
        minOrderValue: data.minOrderValue ? new Decimal(data.minOrderValue) : undefined,
        maxOrderValue: data.maxOrderValue ? new Decimal(data.maxOrderValue) : undefined,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        notes: data.notes,
        approvedBy: data.approvedBy,
        approvedAt: new Date(),
        priority: 100, // Higher than standard rules
        isActive: true,
      },
    });

    const scope =
      data.sellerId && data.categoryId
        ? `seller ${data.sellerId} + category ${data.categoryId}`
        : data.sellerId
          ? `seller ${data.sellerId}`
          : `category ${data.categoryId}`;

    this.logger.log(`Created commission override for ${scope}: ${data.commissionRate}%`);

    return override;
  }

  /**
   * Get seller's commission overrides (can have multiple now)
   */
  async getSellerOverride(sellerId: string) {
    return this.prisma.sellerCommissionOverride.findMany({
      where: { sellerId },
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
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { priority: 'desc' },
    });
  }

  /**
   * Get category's commission overrides
   */
  async getCategoryOverride(categoryId: string) {
    return this.prisma.sellerCommissionOverride.findMany({
      where: { categoryId },
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
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { priority: 'desc' },
    });
  }

  /**
   * Get all seller overrides (Admin)
   */
  async getAllSellerOverrides(filters?: { isActive?: boolean; categoryId?: string }) {
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
   * Update override by ID
   */
  async updateSellerOverride(
    id: string,
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
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete override by ID
   */
  async deleteSellerOverride(id: string) {
    return this.prisma.sellerCommissionOverride.delete({
      where: { id },
    });
  }
}
