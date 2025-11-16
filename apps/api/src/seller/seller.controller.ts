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
    return this.sellerService.getDashboardSummary(req.user.id);
  }

  // ============================================================================
  // Products Management
  // ============================================================================

  /**
   * Get seller's products
   */
  @Get('products')
  getMyProducts(@Req() req: any, @Query() query: any) {
    return this.sellerService.getMyProducts(req.user.id, query);
  }

  /**
   * Get seller's product statistics
   */
  @Get('products/stats')
  getProductStats(@Req() req: any) {
    return this.sellerService.getProductStats(req.user.id);
  }

  /**
   * Get single product by ID
   */
  @Get('products/:id')
  getProduct(@Req() req: any, @Param('id') id: string) {
    return this.sellerService.getProduct(req.user.id, id);
  }

  /**
   * Create new product
   */
  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  createProduct(@Req() req: any, @Body() data: any) {
    return this.sellerService.createProduct(req.user.id, data);
  }

  /**
   * Update product
   */
  @Patch('products/:id')
  updateProduct(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.sellerService.updateProduct(req.user.id, id, data);
  }

  /**
   * Delete product
   */
  @Delete('products/:id')
  deleteProduct(@Req() req: any, @Param('id') id: string) {
    return this.sellerService.deleteProduct(req.user.id, id);
  }

  /**
   * Bulk update product status
   */
  @Patch('products/bulk/status')
  bulkUpdateStatus(
    @Req() req: any,
    @Body() data: { productIds: string[]; status: string },
  ) {
    return this.sellerService.bulkUpdateStatus(req.user.id, data.productIds, data.status);
  }

  /**
   * Bulk delete products
   */
  @Delete('products/bulk/delete')
  bulkDelete(@Req() req: any, @Body() data: { productIds: string[] }) {
    return this.sellerService.bulkDelete(req.user.id, data.productIds);
  }

  // ============================================================================
  // Orders Management
  // ============================================================================

  /**
   * Get seller's orders
   */
  @Get('orders')
  getMyOrders(@Req() req: any, @Query() query: any) {
    return this.sellerService.getMyOrders(req.user.id, query);
  }

  /**
   * Get seller's order statistics
   */
  @Get('orders/stats')
  getOrderStats(@Req() req: any) {
    return this.sellerService.getOrderStats(req.user.id);
  }
}
