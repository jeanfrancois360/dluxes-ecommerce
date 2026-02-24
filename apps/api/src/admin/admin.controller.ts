import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

/**
 * Admin Controller
 * Handles all admin-related HTTP requests
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Get dashboard statistics
   * @route GET /admin/stats
   */
  @Get('stats')
  async getStats() {
    try {
      const data = await this.adminService.getStats();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get analytics data
   * @route GET /admin/analytics
   */
  @Get('analytics')
  async getAnalytics(@Query('days') days?: string) {
    try {
      const data = await this.adminService.getAnalytics(days ? parseInt(days) : 30);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get all orders
   * @route GET /admin/orders
   */
  @Get('orders')
  async getAllOrders(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    try {
      const data = await this.adminService.getAllOrders({
        status,
        page: page ? parseInt(page) : undefined,
        pageSize: pageSize ? parseInt(pageSize) : undefined,
      });
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get all users
   * @route GET /admin/users
   */
  @Get('users')
  async getAllUsers(
    @Query('role') role?: UserRole,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    try {
      const data = await this.adminService.getAllUsers({
        role,
        page: page ? parseInt(page) : undefined,
        pageSize: pageSize ? parseInt(pageSize) : undefined,
        search,
        status,
      });
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get customer stats
   * @route GET /admin/customers/stats
   */
  @Get('customers/stats')
  async getCustomerStats() {
    try {
      const data = await this.adminService.getCustomerStats();
      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get single user by ID
   * @route GET /admin/users/:id
   */
  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    try {
      const data = await this.adminService.getUserById(id);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get user orders
   * @route GET /admin/users/:id/orders
   */
  @Get('users/:id/orders')
  async getUserOrders(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string
  ) {
    try {
      const data = await this.adminService.getUserOrders(id, {
        limit: limit ? parseInt(limit) : 10,
        page: page ? parseInt(page) : 1,
      });
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Update user details
   * @route PATCH /admin/users/:id
   */
  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      role?: UserRole;
      isActive?: boolean;
    }
  ) {
    try {
      const data = await this.adminService.updateUser(id, body);
      return {
        success: true,
        data,
        message: 'User updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Update user status
   * @route PATCH /admin/users/:id/status
   */
  @Patch('users/:id/status')
  async updateUserStatus(@Param('id') id: string, @Body() body: { status: string }) {
    try {
      const data = await this.adminService.updateUserStatus(id, body.status);
      return {
        success: true,
        data,
        message: 'User status updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Suspend user
   * @route PATCH /admin/users/:id/suspend
   */
  @Patch('users/:id/suspend')
  async suspendUser(@Param('id') id: string) {
    try {
      const data = await this.adminService.suspendUser(id);
      return {
        success: true,
        data,
        message: 'User suspended successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Activate user
   * @route PATCH /admin/users/:id/activate
   */
  @Patch('users/:id/activate')
  async activateUser(@Param('id') id: string) {
    try {
      const data = await this.adminService.activateUser(id);
      return {
        success: true,
        data,
        message: 'User activated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Reset user password (admin)
   * @route PATCH /admin/users/:id/reset-password
   */
  @Patch('users/:id/reset-password')
  async resetUserPassword(@Param('id') id: string, @Body() body: { newPassword: string }) {
    try {
      const data = await this.adminService.resetUserPassword(id, body.newPassword);
      return {
        success: true,
        data,
        message: 'Password reset successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Toggle 2FA for user
   * @route PATCH /admin/users/:id/toggle-2fa
   */
  @Patch('users/:id/toggle-2fa')
  async toggle2FA(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    try {
      const data = await this.adminService.toggle2FA(id, body.enabled);
      return {
        success: true,
        data,
        message: `2FA ${body.enabled ? 'enabled' : 'disabled'} successfully`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Manually verify user email
   * @route PATCH /admin/users/:id/verify-email
   */
  @Patch('users/:id/verify-email')
  async verifyUserEmail(@Param('id') id: string) {
    try {
      const data = await this.adminService.verifyUserEmail(id);
      return {
        success: true,
        data,
        message: 'Email verified successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Manually verify user phone
   * @route PATCH /admin/users/:id/verify-phone
   */
  @Patch('users/:id/verify-phone')
  async verifyUserPhone(@Param('id') id: string) {
    try {
      const data = await this.adminService.verifyUserPhone(id);
      return {
        success: true,
        data,
        message: 'Phone verified successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Update user role
   * @route PATCH /admin/users/:id/role
   */
  @Patch('users/:id/role')
  async updateUserRole(@Param('id') id: string, @Body() body: { role: UserRole }) {
    try {
      const data = await this.adminService.updateUserRole(id, body.role);
      return {
        success: true,
        data,
        message: 'User role updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Delete user
   * @route DELETE /admin/users/:id
   */
  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    try {
      await this.adminService.deleteUser(id);
      return {
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get all products
   * @route GET /admin/products
   */
  @Get('products')
  async getAllProducts(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    try {
      const data = await this.adminService.getAllProducts({
        status,
        category,
        page: page ? parseInt(page) : undefined,
        pageSize: pageSize ? parseInt(pageSize) : undefined,
      });
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get all reviews for moderation
   * @route GET /admin/reviews
   */
  @Get('reviews')
  async getAllReviews(
    @Query('isApproved') isApproved?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    try {
      const data = await this.adminService.getAllReviews({
        isApproved: isApproved ? isApproved === 'true' : undefined,
        page: page ? parseInt(page) : undefined,
        pageSize: pageSize ? parseInt(pageSize) : undefined,
      });
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Update review status
   * @route PATCH /admin/reviews/:id/status
   */
  @Patch('reviews/:id/status')
  async updateReviewStatus(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected' }
  ) {
    try {
      const isApproved = body.status === 'approved';
      const data = await this.adminService.updateReviewStatus(id, isApproved);
      return {
        success: true,
        data,
        message: `Review ${body.status} successfully`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Bulk update review status
   * @route POST /admin/reviews/bulk-update-status
   */
  @Post('reviews/bulk-update-status')
  async bulkUpdateReviewStatus(@Body() body: { ids: string[]; status: 'approved' | 'rejected' }) {
    try {
      const isApproved = body.status === 'approved';
      await this.adminService.bulkUpdateReviewStatus(body.ids, isApproved);
      return {
        success: true,
        message: `${body.ids.length} review(s) ${body.status} successfully`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Delete review
   * @route DELETE /admin/reviews/:id
   */
  @Delete('reviews/:id')
  @HttpCode(HttpStatus.OK)
  async deleteReview(@Param('id') id: string) {
    try {
      await this.adminService.deleteReview(id);
      return {
        success: true,
        message: 'Review deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  // ============================================================================
  // Dashboard Routes (Frontend Compatibility)
  // ============================================================================

  /**
   * Get dashboard statistics
   * @route GET /admin/dashboard/stats
   */
  @Get('dashboard/stats')
  async getDashboardStats() {
    try {
      const stats = await this.adminService.getStats();
      return {
        totalRevenue: stats.revenue,
        totalOrders: stats.orders,
        totalCustomers: stats.customers,
        totalProducts: stats.products,
        // Mock change percentages - can be calculated from historical data
        revenueChange: 0,
        ordersChange: 0,
        customersChange: 0,
        productsChange: 0,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get revenue data for chart
   * @route GET /admin/dashboard/revenue
   */
  @Get('dashboard/revenue')
  async getDashboardRevenue(@Query('days') days?: string) {
    try {
      const analytics = await this.adminService.getAnalytics(days ? parseInt(days) : 30);

      // Transform revenue data to expected format
      const revenueData = analytics.revenueData.map((item: any) => ({
        date: item.createdAt.toISOString().split('T')[0],
        revenue: Number(item._sum.total || 0),
      }));

      return revenueData;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get orders by status for donut chart
   * @route GET /admin/dashboard/orders-by-status
   */
  @Get('dashboard/orders-by-status')
  async getDashboardOrdersByStatus() {
    try {
      const analytics = await this.adminService.getAnalytics(30);

      // Transform to expected format
      const ordersByStatus = analytics.ordersByStatus.map((item: any) => ({
        status: item.status,
        count: item._count._all,
        value: item._count._all, // Simplified - can be actual value if needed
      }));

      return ordersByStatus;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get top products for dashboard
   * @route GET /admin/dashboard/top-products
   */
  @Get('dashboard/top-products')
  async getDashboardTopProducts(@Query('limit') limit?: string) {
    try {
      const analytics = await this.adminService.getAnalytics(30);

      const limitNum = limit ? parseInt(limit) : 5;
      const topProducts = analytics.topProducts.slice(0, limitNum).map((item: any) => ({
        id: item.product?.id || item.productId,
        name: item.product?.name || 'Unknown Product',
        revenue: Number(item._sum.total || 0),
        orders: item._sum.quantity || 0,
        image: item.product?.heroImage,
      }));

      return topProducts;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get customer growth data
   * @route GET /admin/dashboard/customer-growth
   */
  @Get('dashboard/customer-growth')
  async getDashboardCustomerGrowth(@Query('days') days?: string) {
    try {
      const daysNum = days ? parseInt(days) : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      // Get customer registration data
      const customerData = await this.prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate,
          },
          role: 'BUYER',
        },
        _count: {
          _all: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const growthData = customerData.map((item: any) => ({
        date: item.createdAt.toISOString().split('T')[0],
        customers: item._count._all,
      }));

      return growthData;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get recent orders for dashboard
   * @route GET /admin/dashboard/recent-orders
   */
  @Get('dashboard/recent-orders')
  async getDashboardRecentOrders(@Query('limit') limit?: string) {
    try {
      const limitNum = limit ? parseInt(limit) : 10;

      const orders = await this.prisma.order.findMany({
        take: limitNum,
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
      });

      const recentOrders = orders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: {
          name: `${order.user.firstName} ${order.user.lastName}`,
          email: order.user.email,
        },
        total: Number(order.total),
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      }));

      return recentOrders;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  // === ADMIN NOTES ===

  /**
   * Get all notes for a customer
   */
  @Get('customers/:id/notes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getCustomerNotes(@Param('id') id: string) {
    return this.adminService.getCustomerNotes(id);
  }

  /**
   * Add a new note for a customer
   */
  @Post('customers/:id/notes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async addCustomerNote(@Param('id') id: string, @Body() body: { content: string }, @Req() req) {
    return this.adminService.addCustomerNote(id, body.content, req.user.id);
  }

  /**
   * Delete a customer note
   */
  @Delete('customers/:id/notes/:noteId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteCustomerNote(
    @Param('id') customerId: string,
    @Param('noteId') noteId: string,
    @Req() req
  ) {
    return this.adminService.deleteCustomerNote(noteId, req.user.id);
  }

  /**
   * Get all stores for product assignment
   * @route GET /admin/stores
   */
  @Get('stores')
  async getAllStores(@Query('status') status?: string, @Query('search') search?: string) {
    const where: any = {};

    if (status) {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const stores = await this.prisma.store.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        verified: true,
        user: {
          select: {
            email: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
        gelatoSettings: {
          select: {
            isEnabled: true,
            isVerified: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      success: true,
      data: stores,
    };
  }
}

// Note: For admin product management (POST, PUT, DELETE),
// admins should use the /products endpoint with proper admin authentication.
// The admin controller provides read-only access for overview purposes.
