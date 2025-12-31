import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SellerService } from './seller.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class SellerController {
  constructor(private sellerService: SellerService) {}

  // ============================================================================
  // Dashboard
  // ============================================================================

  /**
   * Get seller dashboard summary
   */
  @Get('dashboard')
  getDashboardSummary(@Req() req: any) {
    return this.sellerService.getDashboardSummary(req.user.userId);
  }

  // ============================================================================
  // Products Management
  // ============================================================================

  /**
   * Get seller's products
   */
  @Get('products')
  getMyProducts(@Req() req: any, @Query() query: any) {
    return this.sellerService.getMyProducts(req.user.userId, query);
  }

  /**
   * Get seller's product statistics
   */
  @Get('products/stats')
  getProductStats(@Req() req: any) {
    return this.sellerService.getProductStats(req.user.userId);
  }

  /**
   * Get products with low stock
   */
  @Get('products/low-stock')
  getLowStockProducts(
    @Req() req: any,
    @Query('threshold') threshold?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sellerService.getLowStockProducts(
      req.user.userId,
      threshold ? parseInt(threshold) : 10,
      limit ? parseInt(limit) : 10,
    );
  }

  /**
   * Get single product by ID
   */
  @Get('products/:id')
  getProduct(@Req() req: any, @Param('id') id: string) {
    return this.sellerService.getProduct(req.user.userId, id);
  }

  /**
   * Create new product
   */
  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  createProduct(@Req() req: any, @Body() data: any) {
    return this.sellerService.createProduct(req.user.userId, data);
  }

  /**
   * Update product
   */
  @Patch('products/:id')
  updateProduct(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.sellerService.updateProduct(req.user.userId, id, data);
  }

  /**
   * Delete product
   */
  @Delete('products/:id')
  deleteProduct(@Req() req: any, @Param('id') id: string) {
    return this.sellerService.deleteProduct(req.user.userId, id);
  }

  /**
   * Bulk update product status
   */
  @Patch('products/bulk/status')
  bulkUpdateStatus(
    @Req() req: any,
    @Body() data: { productIds: string[]; status: string },
  ) {
    return this.sellerService.bulkUpdateStatus(req.user.userId, data.productIds, data.status);
  }

  /**
   * Bulk delete products
   */
  @Delete('products/bulk/delete')
  bulkDelete(@Req() req: any, @Body() data: { productIds: string[] }) {
    return this.sellerService.bulkDelete(req.user.userId, data.productIds);
  }

  // ============================================================================
  // Orders Management
  // ============================================================================

  /**
   * Get seller's orders
   */
  @Get('orders')
  getMyOrders(@Req() req: any, @Query() query: any) {
    return this.sellerService.getMyOrders(req.user.userId, query);
  }

  /**
   * Get seller's order statistics
   */
  @Get('orders/stats')
  getOrderStats(@Req() req: any) {
    return this.sellerService.getOrderStats(req.user.userId);
  }

  /**
   * Get single order details
   */
  @Get('orders/:id')
  getOrder(@Req() req: any, @Param('id') id: string) {
    return this.sellerService.getOrder(req.user.userId, id);
  }

  /**
   * Update order status (seller can only update to specific statuses)
   */
  @Patch('orders/:id/status')
  updateOrderStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: { status: string; notes?: string },
  ) {
    return this.sellerService.updateOrderStatus(req.user.userId, id, data.status, data.notes);
  }

  /**
   * Update shipping information
   */
  @Patch('orders/:id/shipping')
  updateShippingInfo(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: { trackingNumber?: string; carrier?: string; notes?: string },
  ) {
    return this.sellerService.updateShippingInfo(req.user.userId, id, data);
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  /**
   * Get revenue analytics with trend data
   */
  @Get('analytics/revenue')
  getRevenueAnalytics(@Req() req: any, @Query('period') period?: 'daily' | 'weekly' | 'monthly') {
    return this.sellerService.getRevenueAnalytics(req.user.userId, period || 'monthly');
  }

  /**
   * Get order status breakdown
   */
  @Get('analytics/orders')
  getOrderStatusBreakdown(@Req() req: any) {
    return this.sellerService.getOrderStatusBreakdown(req.user.userId);
  }

  /**
   * Get top performing products
   */
  @Get('analytics/top-products')
  getTopProducts(@Req() req: any, @Query('limit') limit?: string) {
    return this.sellerService.getTopProducts(req.user.userId, limit ? parseInt(limit) : 5);
  }

  /**
   * Get recent activity feed
   */
  @Get('analytics/recent-activity')
  getRecentActivity(@Req() req: any, @Query('limit') limit?: string) {
    return this.sellerService.getRecentActivity(req.user.userId, limit ? parseInt(limit) : 10);
  }

  // ============================================================================
  // Reviews
  // ============================================================================

  /**
   * Get reviews for seller's products
   */
  @Get('reviews')
  getMyReviews(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('rating') rating?: string,
    @Query('productId') productId?: string,
  ) {
    return this.sellerService.getMyReviews(req.user.userId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      rating: rating ? parseInt(rating) : undefined,
      productId,
    });
  }

  /**
   * Get review statistics for seller's products
   */
  @Get('reviews/stats')
  getReviewStats(@Req() req: any) {
    return this.sellerService.getReviewStats(req.user.userId);
  }
}
