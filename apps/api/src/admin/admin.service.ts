import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '@prisma/client';

/**
 * Admin Service
 * Handles all business logic for admin operations
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get dashboard statistics
   */
  async getStats() {
    const [
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      recentOrders,
    ] = await Promise.all([
      // Total revenue
      this.prisma.order.aggregate({
        where: {
          status: {
            not: 'CANCELLED',
          },
        },
        _sum: {
          total: true,
        },
      }),
      // Total orders
      this.prisma.order.count(),
      // Total customers
      this.prisma.user.count({
        where: {
          role: UserRole.CUSTOMER,
        },
      }),
      // Total products
      this.prisma.product.count(),
      // Pending orders
      this.prisma.order.count({
        where: {
          status: 'PENDING',
        },
      }),
      // Recent orders
      this.prisma.order.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      revenue: totalRevenue._sum.total || 0,
      orders: totalOrders,
      customers: totalCustomers,
      products: totalProducts,
      pendingOrders,
      recentOrders,
    };
  }

  /**
   * Get analytics data
   */
  async getAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Revenue over time
    const revenueData = await this.prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
        },
        status: {
          not: 'CANCELLED',
        },
      },
      _sum: {
        total: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Orders by status
    const ordersByStatus = await this.prisma.order.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    // Top selling products
    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    });

    // Fetch product details for top products
    const productIds = topProducts.map((p) => p.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        heroImage: true,
        price: true,
      },
    });

    const topProductsWithDetails = topProducts.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        ...item,
        product,
      };
    });

    return {
      revenueData,
      ordersByStatus,
      topProducts: topProductsWithDetails,
    };
  }

  /**
   * Get all orders with filters (Admin)
   */
  async getAllOrders(filters?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { status, page = 1, pageSize = 20 } = filters || {};

    const where: any = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          shippingAddress: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get all users with filters (Admin)
   */
  async getAllUsers(filters?: {
    role?: UserRole;
    page?: number;
    pageSize?: number;
  }) {
    const { role, page = 1, pageSize = 20 } = filters || {};

    const where: any = {};
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isSuspended: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Update user role (Admin)
   */
  async updateUserRole(userId: string, role: UserRole) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
  }

  /**
   * Delete user (Admin)
   */
  async deleteUser(userId: string) {
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Get all products for management (Admin)
   */
  async getAllProducts(filters?: {
    status?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { status, category, page = 1, pageSize = 20 } = filters || {};

    const where: any = {};
    if (status) where.status = status;
    if (category) where.categoryId = category;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            take: 1,
            orderBy: { displayOrder: 'asc' },
          },
          _count: {
            select: {
              variants: true,
              reviews: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Transform Decimal values to numbers for JSON serialization
    const transformedProducts = products.map(product => ({
      ...product,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    }));

    return {
      products: transformedProducts,
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get all reviews for moderation (Admin)
   */
  async getAllReviews(filters?: {
    isApproved?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const { isApproved, page = 1, pageSize = 20 } = filters || {};

    const where: any = {};
    if (isApproved !== undefined) where.isApproved = isApproved;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              heroImage: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews,
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }
}
