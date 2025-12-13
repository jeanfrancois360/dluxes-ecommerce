import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { InventoryTransactionType } from '@prisma/client';
import { INVENTORY_DEFAULTS } from '../common/constants/inventory.constants';

/**
 * Inventory Management Service
 *
 * Handles all inventory-related operations including:
 * - Stock adjustments
 * - Inventory transactions
 * - Low stock alerts
 * - Bulk operations
 */
@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Adjust product inventory
   */
  async adjustProductInventory(
    productId: string,
    quantity: number,
    type: InventoryTransactionType,
    userId?: string,
    reason?: string,
    notes?: string,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const previousQuantity = product.inventory;
    const newQuantity = previousQuantity + quantity;

    if (newQuantity < 0) {
      throw new BadRequestException('Insufficient inventory');
    }

    // Update product inventory
    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: {
        previousStock: previousQuantity,
        inventory: newQuantity,
      },
    });

    // Create inventory transaction
    await this.prisma.inventoryTransaction.create({
      data: {
        productId,
        type,
        quantity,
        previousQuantity,
        newQuantity,
        userId,
        reason,
        notes,
      },
    });

    return updatedProduct;
  }

  /**
   * Adjust variant inventory
   */
  async adjustVariantInventory(
    variantId: string,
    quantity: number,
    type: InventoryTransactionType,
    userId?: string,
    reason?: string,
    notes?: string,
  ) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    const previousQuantity = variant.inventory;
    const newQuantity = previousQuantity + quantity;

    if (newQuantity < 0) {
      throw new BadRequestException('Insufficient inventory');
    }

    // Update variant inventory
    const updatedVariant = await this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        previousStock: previousQuantity,
        inventory: newQuantity,
      },
    });

    // Create inventory transaction
    await this.prisma.inventoryTransaction.create({
      data: {
        productId: variant.productId,
        variantId,
        type,
        quantity,
        previousQuantity,
        newQuantity,
        userId,
        reason,
        notes,
      },
    });

    return updatedVariant;
  }

  /**
   * Get inventory transactions for a product
   */
  async getProductTransactions(
    productId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const transactions = await this.prisma.inventoryTransaction.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.inventoryTransaction.count({
      where: { productId },
    });

    return {
      transactions,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold: number = INVENTORY_DEFAULTS.LOW_STOCK_THRESHOLD) {
    const products = await this.prisma.product.findMany({
      where: {
        inventory: {
          lte: threshold,
          gt: 0,
        },
        status: 'ACTIVE',
      },
      include: {
        category: true,
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { inventory: 'asc' },
    });

    return products;
  }

  /**
   * Get out of stock products
   */
  async getOutOfStockProducts() {
    const products = await this.prisma.product.findMany({
      where: {
        inventory: 0,
        status: 'ACTIVE',
      },
      include: {
        category: true,
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return products;
  }

  /**
   * Bulk update product inventory
   */
  async bulkUpdateInventory(
    updates: Array<{
      productId?: string;
      variantId?: string;
      quantity: number;
      type: InventoryTransactionType;
      reason?: string;
    }>,
    userId?: string,
  ) {
    const results = [];

    for (const update of updates) {
      try {
        if (update.variantId) {
          const result = await this.adjustVariantInventory(
            update.variantId,
            update.quantity,
            update.type,
            userId,
            update.reason,
          );
          results.push({ success: true, variantId: update.variantId, result });
        } else if (update.productId) {
          const result = await this.adjustProductInventory(
            update.productId,
            update.quantity,
            update.type,
            userId,
            update.reason,
          );
          results.push({ success: true, productId: update.productId, result });
        }
      } catch (error) {
        results.push({
          success: false,
          productId: update.productId,
          variantId: update.variantId,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Get inventory summary/statistics
   */
  async getInventorySummary() {
    const [
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalInventoryValue,
      recentTransactions,
    ] = await Promise.all([
      this.prisma.product.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.product.count({
        where: {
          status: 'ACTIVE',
          inventory: {
            lte: INVENTORY_DEFAULTS.LOW_STOCK_THRESHOLD,
            gt: 0,
          },
        },
      }),
      this.prisma.product.count({
        where: {
          status: 'ACTIVE',
          inventory: 0,
        },
      }),
      this.prisma.product.aggregate({
        where: { status: 'ACTIVE' },
        _sum: {
          inventory: true,
        },
      }),
      this.prisma.inventoryTransaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalInventoryUnits: totalInventoryValue._sum.inventory || 0,
      recentTransactions,
    };
  }

  /**
   * Sync product inventory with variants
   * Calculates total inventory based on all variant inventories
   */
  async syncProductInventoryFromVariants(productId: string) {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
    });

    const totalInventory = variants.reduce((sum, variant) => sum + variant.inventory, 0);

    const product = await this.prisma.product.update({
      where: { id: productId },
      data: { inventory: totalInventory },
      include: {
        variants: true,
      },
    });

    return product;
  }
}
