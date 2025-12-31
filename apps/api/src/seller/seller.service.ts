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
   * Get products with low stock (inventory <= threshold)
   */
  async getLowStockProducts(userId: string, threshold: number = 10, limit: number = 10) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const products = await this.prisma.product.findMany({
      where: {
        storeId: store.id,
        inventory: {
          gt: 0,
          lte: threshold,
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        heroImage: true,
        inventory: true,
        price: true,
      },
      orderBy: {
        inventory: 'asc',
      },
      take: limit,
    });

    return products;
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
   * Get single order details for seller
   */
  async getOrder(userId: string, orderId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        items: {
          some: {
            product: {
              storeId: store.id,
            },
          },
        },
      },
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
        delivery: {
          include: {
            deliveryPartner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            provider: {
              select: {
                id: true,
                name: true,
                contactPhone: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found or does not belong to your store');
    }

    return order;
  }

  /**
   * Update order status
   * Sellers can only update to: PROCESSING, SHIPPED, DELIVERED
   */
  async updateOrderStatus(userId: string, orderId: string, status: string, notes?: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Verify order belongs to seller's store
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        items: {
          some: {
            product: {
              storeId: store.id,
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found or does not belong to your store');
    }

    // Validate allowed status transitions
    const allowedStatuses = ['PROCESSING', 'SHIPPED', 'DELIVERED'];
    if (!allowedStatuses.includes(status)) {
      throw new ForbiddenException(`Sellers can only update order status to: ${allowedStatuses.join(', ')}`);
    }

    // Validate status transition logic
    if (status === 'SHIPPED' && !['PROCESSING', 'CONFIRMED'].includes(order.status)) {
      throw new ForbiddenException('Order must be in PROCESSING or CONFIRMED status to mark as SHIPPED');
    }

    if (status === 'DELIVERED' && order.status !== 'SHIPPED') {
      throw new ForbiddenException('Order must be SHIPPED before marking as DELIVERED');
    }

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as any, // Cast to satisfy Prisma type
        notes: notes ? `${order.notes || ''}\n[${new Date().toISOString()}] ${notes}` : order.notes,
      },
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
            product: true,
          },
        },
      },
    });

    return {
      message: `Order status updated to ${status}`,
      order: updatedOrder,
    };
  }

  /**
   * Update shipping information
   */
  async updateShippingInfo(userId: string, orderId: string, data: { trackingNumber?: string; carrier?: string; notes?: string }) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Verify order belongs to seller's store
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        items: {
          some: {
            product: {
              storeId: store.id,
            },
          },
        },
      },
      include: {
        delivery: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found or does not belong to your store');
    }

    // Update delivery tracking information if delivery exists
    if (order.delivery && data.trackingNumber) {
      await this.prisma.delivery.update({
        where: { id: order.delivery.id },
        data: {
          trackingNumber: data.trackingNumber,
          trackingUrl: data.carrier ? `https://${data.carrier}.com/track/${data.trackingNumber}` : undefined,
        },
      });
    }

    // Update order notes if provided
    if (data.notes) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          notes: `${order.notes || ''}\n[${new Date().toISOString()}] ${data.notes}`,
        },
      });
    }

    // Fetch updated order with delivery
    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        delivery: true,
      },
    });

    return {
      message: 'Shipping information updated successfully',
      order: updatedOrder,
    };
  }

  /**
   * Get seller's dashboard summary
   */
  async getDashboardSummary(userId: string) {
    console.log('[DASHBOARD] Starting getDashboardSummary for userId:', userId);

    try {
      // First check if store exists
      console.log('[DASHBOARD] Step 1: Fetching store...');
      const store = await this.prisma.store.findUnique({
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
      });
      console.log('[DASHBOARD] Store fetched:', store ? 'Found' : 'Not found');

      if (!store) {
        throw new NotFoundException('Store not found. Please create a store first.');
      }

      // Now get all stats in parallel (store exists, safe to proceed)
      console.log('[DASHBOARD] Step 2: Fetching product and order stats...');
      let productStats, orderStats;
      try {
        productStats = await this.getProductStats(userId);
        console.log('[DASHBOARD] Product stats fetched successfully');
      } catch (error) {
        console.error('[DASHBOARD] ERROR in getProductStats:', error.message);
        throw error;
      }

      try {
        orderStats = await this.getOrderStats(userId);
        console.log('[DASHBOARD] Order stats fetched successfully');
      } catch (error) {
        console.error('[DASHBOARD] ERROR in getOrderStats:', error.message);
        throw error;
      }
      console.log('[DASHBOARD] Stats fetched successfully');

      // Get recent activity (might be empty for new stores)
      console.log('[DASHBOARD] Step 3: Fetching recent activity...');
      let recentActivity = [];
      try {
        recentActivity = await this.getRecentActivity(userId, 5);
        console.log('[DASHBOARD] Activity fetched:', recentActivity.length, 'items');
      } catch (activityError) {
        console.warn('[DASHBOARD] Failed to fetch recent activity:', activityError);
        recentActivity = [];
      }

      // Calculate payouts data
      console.log('[DASHBOARD] Step 4: Calculating payouts...');
      const payouts = {
        totalEarnings: Number(orderStats.totalRevenue) || 0,
        pendingBalance: Number(orderStats.totalRevenue) * 0.3 || 0,
        availableBalance: Number(orderStats.totalRevenue) * 0.7 || 0,
        nextPayoutDate: null,
      };

      // Convert Decimal fields to numbers for JSON serialization
      console.log('[DASHBOARD] Step 5: Preparing response...');
      const response = {
        store: {
          ...store,
          rating: store.rating ? Number(store.rating) : null,
          totalSales: store.totalSales ? Number(store.totalSales) : 0,
        },
        products: productStats,
        orders: orderStats,
        payouts,
        recentActivity,
      };

      console.log('[DASHBOARD] Response prepared successfully');
      console.log('[DASHBOARD] Full response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('[DASHBOARD] ERROR in getDashboardSummary:', error.message);
      console.error('[DASHBOARD] Error stack:', error.stack);
      throw error;
    }
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

  // ============================================================================
  // Analytics
  // ============================================================================

  /**
   * Get revenue analytics with trend data
   */
  async getRevenueAnalytics(userId: string, period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    try {
      const store = await this.prisma.store.findUnique({
        where: { userId },
      });

      if (!store) {
        throw new NotFoundException('Store not found');
      }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let groupByFormat: string;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        groupByFormat = 'day';
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // Last 12 weeks
        groupByFormat = 'week';
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000); // Last 12 months
        groupByFormat = 'month';
        break;
    }

    // Get orders within date range
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        items: {
          some: {
            product: {
              storeId: store.id,
            },
          },
        },
        status: {
          notIn: ['CANCELLED'],
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group orders by period and calculate revenue
    const revenueMap = new Map<string, { amount: number; orders: number }>();

    orders.forEach((order) => {
      const orderRevenue = order.items.reduce((sum, item) => sum + Number(item.total), 0);
      const dateKey = this.formatDateForPeriod(order.createdAt, groupByFormat);

      const existing = revenueMap.get(dateKey) || { amount: 0, orders: 0 };
      revenueMap.set(dateKey, {
        amount: existing.amount + orderRevenue,
        orders: existing.orders + 1,
      });
    });

    // Convert to array and fill gaps
    const data = this.fillRevenueDateGaps(revenueMap, startDate, now, period);

      // Calculate total and trend
      const total = data.reduce((sum, item) => sum + item.amount, 0);
      const trend = this.calculateRevenueTrend(data, period);

      return {
        period,
        data,
        total,
        trend,
      };
    } catch (error) {
      console.error('Error in getRevenueAnalytics:', error);
      // Return empty data instead of throwing
      return {
        period,
        data: [],
        total: 0,
        trend: { value: 0, isPositive: true },
      };
    }
  }

  /**
   * Get top performing products
   */
  async getTopProducts(userId: string, limit: number = 5) {
    try {
      const store = await this.prisma.store.findUnique({
        where: { userId },
      });

      if (!store) {
        throw new NotFoundException('Store not found');
      }

      // Get all order items for this store's products
      const orderItems = await this.prisma.orderItem.findMany({
        where: {
          product: {
            storeId: store.id,
          },
          order: {
            status: {
              notIn: ['CANCELLED'],
            },
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              heroImage: true,
              viewCount: true,
            },
          },
        },
      });

      // Group by product and calculate metrics
      const productMetrics = new Map<string, any>();

      orderItems.forEach((item) => {
        const productId = item.product.id;
        const existing = productMetrics.get(productId);

        if (existing) {
          existing.sales += item.quantity;
          existing.revenue += Number(item.total);
        } else {
          productMetrics.set(productId, {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            image: item.product.heroImage,
            sales: item.quantity,
            revenue: Number(item.total),
            views: item.product.viewCount,
          });
        }
      });

      // Convert to array, sort by revenue, and return top N
      const topProducts = Array.from(productMetrics.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);

      return topProducts;
    } catch (error) {
      console.error('Error in getTopProducts:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Get recent activity feed
   */
  async getRecentActivity(userId: string, limit: number = 10) {
    try {
      const store = await this.prisma.store.findUnique({
        where: { userId },
      });

      if (!store) {
        throw new NotFoundException('Store not found');
      }

      const activities: any[] = [];

      // Get recent orders
      const recentOrders = await this.prisma.order.findMany({
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
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      });

      recentOrders.forEach((order) => {
        activities.push({
          id: `order-${order.id}`,
          type: 'order',
          title: 'New Order',
          description: `Order #${order.orderNumber} from ${order.user.firstName} ${order.user.lastName}`,
          timestamp: order.createdAt.toISOString(),
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
          },
        });
      });

      // Get recent products
      const recentProducts = await this.prisma.product.findMany({
        where: {
          storeId: store.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      });

      recentProducts.forEach((product) => {
        activities.push({
          id: `product-${product.id}`,
          type: 'product',
          title: 'Product Created',
          description: `${product.name} was added to your store`,
          timestamp: product.createdAt.toISOString(),
          metadata: {
            productId: product.id,
            productName: product.name,
            status: product.status,
          },
        });
      });

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error in getRecentActivity:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Get order status breakdown for analytics
   */
  async getOrderStatusBreakdown(userId: string) {
    try {
      const orderStats = await this.getOrderStats(userId);

      return {
        pending: orderStats.pending,
        processing: orderStats.processing,
        shipped: orderStats.shipped,
        delivered: orderStats.delivered,
        cancelled: orderStats.cancelled,
        total: orderStats.total,
      };
    } catch (error) {
      console.error('Error in getOrderStatusBreakdown:', error);
      // Return empty breakdown on error
      return {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        total: 0,
      };
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Format date based on period
   */
  private formatDateForPeriod(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (format) {
      case 'day':
        return `${year}-${month}-${day}`;
      case 'week':
        const weekNumber = this.getWeekNumber(date);
        return `${year}-W${String(weekNumber).padStart(2, '0')}`;
      case 'month':
        return `${year}-${month}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }

  /**
   * Get ISO week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Fill gaps in revenue data
   */
  private fillRevenueDateGaps(
    revenueMap: Map<string, { amount: number; orders: number }>,
    startDate: Date,
    endDate: Date,
    period: string,
  ) {
    const data: Array<{ date: string; amount: number; orders: number }> = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateKey = this.formatDateForPeriod(current, period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month');
      const revenueData = revenueMap.get(dateKey) || { amount: 0, orders: 0 };

      data.push({
        date: dateKey,
        amount: revenueData.amount,
        orders: revenueData.orders,
      });

      // Increment date based on period
      if (period === 'daily') {
        current.setDate(current.getDate() + 1);
      } else if (period === 'weekly') {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return data;
  }

  /**
   * Calculate revenue trend
   */
  private calculateRevenueTrend(data: Array<{ amount: number }>, period: string) {
    if (data.length < 2) {
      return { value: 0, isPositive: true };
    }

    const halfPoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, halfPoint);
    const secondHalf = data.slice(halfPoint);

    const firstHalfTotal = firstHalf.reduce((sum, item) => sum + item.amount, 0);
    const secondHalfTotal = secondHalf.reduce((sum, item) => sum + item.amount, 0);

    if (firstHalfTotal === 0) {
      return { value: 0, isPositive: true };
    }

    const percentChange = ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100;

    return {
      value: Math.abs(Math.round(percentChange * 10) / 10),
      isPositive: percentChange >= 0,
    };
  }
}
