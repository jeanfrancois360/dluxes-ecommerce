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
          role: UserRole.BUYER,
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
    search?: string;
    status?: string;
  }) {
    const { role, page = 1, pageSize = 20, search, status } = filters || {};

    const where: any = {};

    // Role filter
    if (role) where.role = role;

    // Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Status filter
    if (status === 'active') {
      where.isActive = true;
      where.isSuspended = false;
    } else if (status === 'inactive') {
      where.isActive = false;
    } else if (status === 'suspended') {
      where.isSuspended = true;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
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

    // Calculate totalSpent for each user from their orders
    const userIds = users.map(u => u.id);
    const orderTotals = await this.prisma.order.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        status: { not: 'CANCELLED' },
      },
      _sum: {
        total: true,
      },
    });

    const totalSpentMap = new Map(
      orderTotals.map(ot => [ot.userId, Number(ot._sum.total || 0)])
    );

    const transformedUsers = users.map(user => ({
      ...user,
      totalSpent: totalSpentMap.get(user.id) || 0,
    }));

    return {
      users: transformedUsers,
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [total, newThisMonth, newLastMonth, totalRevenueResult] = await Promise.all([
      this.prisma.user.count({
        where: { role: UserRole.BUYER }
      }),
      this.prisma.user.count({
        where: {
          role: UserRole.BUYER,
          createdAt: { gte: startOfMonth }
        },
      }),
      this.prisma.user.count({
        where: {
          role: UserRole.BUYER,
          createdAt: { gte: startOfLastMonth, lt: startOfMonth }
        },
      }),
      // Total revenue from all customer orders
      this.prisma.order.aggregate({
        where: {
          user: { role: UserRole.BUYER },
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
      }),
    ]);

    // Calculate VIP count (customers with $1000+ total spend)
    const userOrderTotals = await this.prisma.order.groupBy({
      by: ['userId'],
      where: {
        user: { role: UserRole.BUYER },
        status: { not: 'CANCELLED' },
      },
      _sum: {
        total: true,
      },
      having: {
        total: {
          _sum: {
            gte: 1000,
          },
        },
      },
    });

    const growthPercent = newLastMonth > 0
      ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
      : 100;

    return {
      total,
      newThisMonth,
      growthPercent,
      vipCount: userOrderTotals.length,
      totalRevenue: totalRevenueResult._sum.total ? Number(totalRevenueResult._sum.total) : 0,
    };
  }

  /**
   * Get single user by ID
   */
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
        addresses: true,
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
            _count: {
              select: {
                items: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate total spent from orders
    const totalSpentResult = await this.prisma.order.aggregate({
      where: {
        userId: userId,
        status: { not: 'CANCELLED' },
      },
      _sum: {
        total: true,
      },
    });

    // Transform Decimal fields to numbers
    return {
      ...user,
      totalSpent: totalSpentResult._sum.total ? Number(totalSpentResult._sum.total) : 0,
      orders: user.orders.map(order => ({
        ...order,
        total: Number(order.total),
      })),
    };
  }

  /**
   * Update user details
   */
  async updateUser(userId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: UserRole;
    isActive?: boolean;
  }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isSuspended: true,
      },
    });
  }

  /**
   * Suspend user
   */
  async suspendUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: true,
        isActive: false
      },
    });
  }

  /**
   * Activate user
   */
  async activateUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: false,
        isActive: true
      },
    });
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

  /**
   * Get all admin notes for a customer
   */
  async getCustomerNotes(userId: string) {
    const notes = await this.prisma.adminNote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return notes;
  }

  /**
   * Add a new admin note for a customer
   */
  async addCustomerNote(userId: string, content: string, createdBy: string) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('Customer not found');
    }

    const note = await this.prisma.adminNote.create({
      data: {
        userId,
        content,
        createdBy,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return note;
  }

  /**
   * Delete an admin note
   */
  async deleteCustomerNote(noteId: string, requesterId: string) {
    const note = await this.prisma.adminNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new Error('Note not found');
    }

    // Optional: Only allow the author or SUPER_ADMIN to delete
    // For now, any admin can delete any note

    await this.prisma.adminNote.delete({
      where: { id: noteId },
    });

    return { success: true, message: 'Note deleted' };
  }
}
