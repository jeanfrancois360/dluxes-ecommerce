import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { InventoryTransactionType, ProductStatus } from '@prisma/client';

/**
 * Inventory Management Service
 * Handles inventory tracking, transactions, and low-stock alerts with concurrency control
 */
@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  private readonly LOW_STOCK_THRESHOLD = 10;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record inventory transaction with concurrency-safe update
   */
  async recordTransaction(data: {
    productId: string;
    variantId?: string;
    type: InventoryTransactionType;
    quantity: number;
    orderId?: string;
    userId?: string;
    reason?: string;
    notes?: string;
  }) {
    return this.prisma.$transaction(async (prisma) => {
      // Get current inventory with row lock to prevent race conditions
      let previousQuantity: number;

      if (data.variantId) {
        // Lock variant row
        const locked = await prisma.$queryRaw<Array<{ inventory: number; previousStock: number }>>`
          SELECT inventory, "previousStock" FROM product_variants WHERE id = ${data.variantId} FOR UPDATE
        `;
        if (!locked || locked.length === 0) {
          throw new BadRequestException('Product variant not found');
        }
        previousQuantity = locked[0].inventory;
      } else {
        // Lock product row
        const locked = await prisma.$queryRaw<Array<{ inventory: number; previousStock: number }>>`
          SELECT inventory, "previousStock" FROM products WHERE id = ${data.productId} FOR UPDATE
        `;
        if (!locked || locked.length === 0) {
          throw new BadRequestException('Product not found');
        }
        previousQuantity = locked[0].inventory;
      }
      const newQuantity = previousQuantity + data.quantity;

      // Prevent negative inventory
      if (newQuantity < 0) {
        throw new BadRequestException(
          `Insufficient inventory. Available: ${previousQuantity}, Required: ${Math.abs(data.quantity)}`
        );
      }

      // Update inventory
      if (data.variantId) {
        await prisma.productVariant.update({
          where: { id: data.variantId },
          data: {
            inventory: newQuantity,
            previousStock: previousQuantity,
          },
        });
      } else {
        await prisma.product.update({
          where: { id: data.productId },
          data: {
            inventory: newQuantity,
            previousStock: previousQuantity,
            // Update product status if out of stock
            status: newQuantity === 0 ? ProductStatus.OUT_OF_STOCK : undefined,
          },
        });
      }

      // Create inventory transaction record
      const transaction = await prisma.inventoryTransaction.create({
        data: {
          productId: data.productId,
          variantId: data.variantId,
          type: data.type,
          quantity: data.quantity,
          previousQuantity,
          newQuantity,
          orderId: data.orderId,
          userId: data.userId,
          reason: data.reason,
          notes: data.notes,
        },
      });

      this.logger.log(
        `Inventory transaction: ${data.type} ${data.quantity} for product ${data.productId} (${previousQuantity} -> ${newQuantity})`
      );

      // Check for low stock and trigger alert
      if (newQuantity > 0 && newQuantity <= this.LOW_STOCK_THRESHOLD) {
        this.logger.warn(
          `LOW STOCK ALERT: Product ${data.productId} has ${newQuantity} items remaining`
        );
        // TODO: Send low stock notification to admin/seller
      }

      return transaction;
    });
  }

  /**
   * Bulk update inventory (for restocking)
   */
  async bulkRestock(
    items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      notes?: string;
    }>,
    userId: string
  ) {
    const results = [];

    for (const item of items) {
      try {
        const transaction = await this.recordTransaction({
          productId: item.productId,
          variantId: item.variantId,
          type: InventoryTransactionType.RESTOCK,
          quantity: item.quantity,
          userId,
          reason: 'bulk_restock',
          notes: item.notes,
        });
        results.push({ success: true, transaction });
      } catch (error) {
        this.logger.error(`Error restocking product ${item.productId}:`, error);
        results.push({
          success: false,
          productId: item.productId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * Get inventory status for a product or variant
   */
  async getInventoryStatus(productId: string, variantId?: string) {
    if (variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: variantId },
        select: {
          inventory: true,
          lowStockThreshold: true,
          isAvailable: true,
        },
      });

      if (!variant) {
        throw new BadRequestException('Variant not found');
      }

      return {
        quantity: variant.inventory,
        isLowStock: variant.inventory <= variant.lowStockThreshold,
        isOutOfStock: variant.inventory === 0,
        isAvailable: variant.isAvailable,
      };
    } else {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: {
          inventory: true,
          status: true,
          fulfillmentType: true,
        },
      });

      if (!product) {
        throw new BadRequestException('Product not found');
      }

      // Print-on-demand products have unlimited inventory — never block checkout
      if (product.fulfillmentType === 'GELATO_POD') {
        return {
          quantity: 999999,
          isLowStock: false,
          isOutOfStock: false,
          isUnlimited: true,
          status: product.status,
        };
      }

      return {
        quantity: product.inventory,
        isLowStock: product.inventory <= this.LOW_STOCK_THRESHOLD,
        isOutOfStock: product.inventory === 0,
        isUnlimited: false,
        status: product.status,
      };
    }
  }

  /**
   * Get low stock products (for admin dashboard)
   */
  async getLowStockProducts(filters?: {
    storeId?: string;
    categoryId?: string;
    threshold?: number;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;
    // Read threshold from system settings; fall back to the class constant if unavailable
    let settingThreshold = this.LOW_STOCK_THRESHOLD;
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'inventory.low_stock_threshold' },
      });
      if (
        setting?.value !== null &&
        setting?.value !== undefined &&
        typeof setting.value === 'number'
      ) {
        settingThreshold = setting.value as number;
      }
    } catch {
      // Use fallback silently
    }
    const threshold = filters?.threshold !== undefined ? filters.threshold : settingThreshold;

    const where: any = {
      inventory: { lte: threshold, gt: 0 },
      status: { not: ProductStatus.ARCHIVED },
      ...(filters?.storeId && { storeId: filters.storeId }),
      ...(filters?.categoryId && { categoryId: filters.categoryId }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          store: {
            select: {
              name: true,
              userId: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { inventory: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get out of stock products
   */
  async getOutOfStockProducts(filters?: {
    storeId?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      inventory: 0,
      status: { not: ProductStatus.ARCHIVED },
      ...(filters?.storeId && { storeId: filters.storeId }),
      ...(filters?.categoryId && { categoryId: filters.categoryId }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          store: {
            select: {
              name: true,
              userId: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get inventory transaction history
   */
  async getTransactionHistory(filters?: {
    productId?: string;
    variantId?: string;
    type?: InventoryTransactionType;
    orderId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(filters?.productId && { productId: filters.productId }),
      ...(filters?.variantId && { variantId: filters.variantId }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.orderId && { orderId: filters.orderId }),
      ...(filters?.startDate &&
        filters?.endDate && {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
    };

    const [transactions, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where,
        include: {
          product: {
            select: {
              name: true,
              slug: true,
            },
          },
          variant: {
            select: {
              name: true,
              sku: true,
            },
          },
          order: {
            select: {
              orderNumber: true,
            },
          },
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inventoryTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get inventory statistics for dashboard
   */
  async getInventoryStatistics(filters?: { storeId?: string; categoryId?: string }) {
    const where: any = {
      status: { not: ProductStatus.ARCHIVED },
      ...(filters?.storeId && { storeId: filters.storeId }),
      ...(filters?.categoryId && { categoryId: filters.categoryId }),
    };

    const [total, lowStock, outOfStock, totalValue] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.count({
        where: {
          ...where,
          inventory: { lte: this.LOW_STOCK_THRESHOLD, gt: 0 },
        },
      }),
      this.prisma.product.count({
        where: {
          ...where,
          inventory: 0,
        },
      }),
      this.prisma.product.aggregate({
        where,
        _sum: {
          inventory: true,
        },
      }),
    ]);

    return {
      total,
      lowStock,
      outOfStock,
      inStock: total - outOfStock,
      totalItems: totalValue._sum.inventory || 0,
    };
  }
}
