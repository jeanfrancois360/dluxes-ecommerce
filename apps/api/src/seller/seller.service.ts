import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class SellerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get seller's products
   */
  async getMyProducts(userId: string, query: any) {
    const { page = 1, limit = 20, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    // Get seller's store
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found. Please create a store first.');
    }

    const where: any = {
      storeId: store.id,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            orderBy: {
              displayOrder: 'asc',
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get seller's product statistics
   */
  async getProductStats(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const products = await this.prisma.product.findMany({
      where: { storeId: store.id },
      select: {
        status: true,
        inventory: true,
        viewCount: true,
        likeCount: true,
      },
    });

    const total = products.length;
    const active = products.filter((p) => p.status === 'ACTIVE').length;
    const draft = products.filter((p) => p.status === 'DRAFT').length;
    const outOfStock = products.filter((p) => p.inventory === 0).length;
    const lowStock = products.filter((p) => p.inventory > 0 && p.inventory <= 10).length;
    const totalViews = products.reduce((sum, p) => sum + p.viewCount, 0);
    const totalLikes = products.reduce((sum, p) => sum + p.likeCount, 0);

    return {
      total,
      active,
      draft,
      outOfStock,
      lowStock,
      totalViews,
      totalLikes,
    };
  }

  /**
   * Get seller's orders
   */
  async getMyOrders(userId: string, query: any) {
    const { page = 1, limit = 20, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const where: any = {
      items: {
        some: {
          product: {
            storeId: store.id,
          },
        },
      },
    };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          items: {
            where: {
              product: {
                storeId: store.id,
              },
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  heroImage: true,
                },
              },
            },
          },
          shippingAddress: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get seller's order statistics
   */
  async getOrderStats(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const orders = await this.prisma.order.findMany({
      where: {
        items: {
          some: {
            product: {
              storeId: store.id,
            },
          },
        },
      },
      include: {
        items: {
          where: {
            product: {
              storeId: store.id,
            },
          },
        },
      },
    });

    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
    const processing = orders.filter((o) => o.status === 'PROCESSING').length;
    const shipped = orders.filter((o) => o.status === 'SHIPPED').length;
    const delivered = orders.filter((o) => o.status === 'DELIVERED').length;
    const cancelled = orders.filter((o) => o.status === 'CANCELLED').length;

    const totalRevenue = orders.reduce((sum, order) => {
      const orderItemsTotal = order.items.reduce((itemSum, item) => {
        return itemSum + Number(item.total);
      }, 0);
      return sum + orderItemsTotal;
    }, 0);

    return {
      total,
      pending,
      processing,
      shipped,
      delivered,
      cancelled,
      totalRevenue,
      averageOrderValue: total > 0 ? totalRevenue / total : 0,
    };
  }

  /**
   * Get seller's dashboard summary
   */
  async getDashboardSummary(userId: string) {
    const [productStats, orderStats, store] = await Promise.all([
      this.getProductStats(userId),
      this.getOrderStats(userId),
      this.prisma.store.findUnique({
        where: { userId },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          verified: true,
          rating: true,
          totalSales: true,
          totalOrders: true,
          totalProducts: true,
          createdAt: true,
        },
      }),
    ]);

    if (!store) {
      throw new NotFoundException('Store not found. Please create a store first.');
    }

    return {
      store,
      products: productStats,
      orders: orderStats,
    };
  }

  /**
   * Create product for seller's store
   */
  async createProduct(userId: string, data: any) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found. Please create a store first.');
    }

    if (store.status !== 'ACTIVE') {
      throw new ForbiddenException('Your store must be approved before you can add products.');
    }

    // Create product with seller's store ID
    const product = await this.prisma.product.create({
      data: {
        ...data,
        storeId: store.id,
        status: data.status || 'DRAFT',
      },
      include: {
        category: true,
        images: true,
      },
    });

    // Update store product count
    await this.prisma.store.update({
      where: { id: store.id },
      data: {
        totalProducts: {
          increment: 1,
        },
      },
    });

    return product;
  }

  /**
   * Update seller's product
   */
  async updateProduct(userId: string, productId: string, data: any) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Verify product belongs to seller's store
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        storeId: store.id,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found or does not belong to your store');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data,
      include: {
        category: true,
        images: true,
      },
    });
  }

  /**
   * Delete seller's product
   */
  async deleteProduct(userId: string, productId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Verify product belongs to seller's store
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        storeId: store.id,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found or does not belong to your store');
    }

    await this.prisma.product.delete({
      where: { id: productId },
    });

    // Update store product count
    await this.prisma.store.update({
      where: { id: store.id },
      data: {
        totalProducts: {
          decrement: 1,
        },
      },
    });

    return { message: 'Product deleted successfully' };
  }

  /**
   * Get single product by ID (seller's product)
   */
  async getProduct(userId: string, productId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        storeId: store.id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
        variants: true,
        tags: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Bulk update product status
   */
  async bulkUpdateStatus(userId: string, productIds: string[], status: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Update only products that belong to seller's store
    const result = await this.prisma.product.updateMany({
      where: {
        id: { in: productIds },
        storeId: store.id,
      },
      data: { status: status as ProductStatus },
    });

    return {
      message: `${result.count} products updated successfully`,
      count: result.count,
    };
  }

  /**
   * Bulk delete products
   */
  async bulkDelete(userId: string, productIds: string[]) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Delete only products that belong to seller's store
    const result = await this.prisma.product.deleteMany({
      where: {
        id: { in: productIds },
        storeId: store.id,
      },
    });

    // Update store product count
    await this.prisma.store.update({
      where: { id: store.id },
      data: {
        totalProducts: {
          decrement: result.count,
        },
      },
    });

    return {
      message: `${result.count} products deleted successfully`,
      count: result.count,
    };
  }
}
