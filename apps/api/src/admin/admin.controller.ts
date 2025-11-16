import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
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
  constructor(private readonly adminService: AdminService) {}

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
        message: error instanceof Error ? error.message : "An error occurred",
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
      const data = await this.adminService.getAnalytics(
        days ? parseInt(days) : 30
      );
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
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
        message: error instanceof Error ? error.message : "An error occurred",
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
    @Query('pageSize') pageSize?: string
  ) {
    try {
      const data = await this.adminService.getAllUsers({
        role,
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
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Update user role
   * @route PATCH /admin/users/:id/role
   */
  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: UserRole }
  ) {
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
        message: error instanceof Error ? error.message : "An error occurred",
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
        message: error instanceof Error ? error.message : "An error occurred",
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
        message: error instanceof Error ? error.message : "An error occurred",
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
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }
}

// Note: For admin product management (POST, PUT, DELETE),
// admins should use the /products endpoint with proper admin authentication.
// The admin controller provides read-only access for overview purposes.
