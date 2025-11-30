import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, InventoryTransactionType } from '@prisma/client';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('status/:productId')
  async getInventoryStatus(
    @Param('productId') productId: string,
    @Query('variantId') variantId?: string,
  ) {
    return this.inventoryService.getInventoryStatus(productId, variantId);
  }

  @Get('low-stock')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async getLowStockProducts(
    @Query('storeId') storeId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('threshold') threshold?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getLowStockProducts({
      storeId,
      categoryId,
      threshold: threshold ? parseInt(threshold) : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('out-of-stock')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async getOutOfStockProducts(
    @Query('storeId') storeId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getOutOfStockProducts({
      storeId,
      categoryId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('transactions')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async getTransactionHistory(
    @Query('productId') productId?: string,
    @Query('variantId') variantId?: string,
    @Query('type') type?: InventoryTransactionType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getTransactionHistory({
      productId,
      variantId,
      type,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async getStatistics(
    @Query('storeId') storeId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.inventoryService.getInventoryStatistics({
      storeId,
      categoryId,
    });
  }

  @Post('restock')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async bulkRestock(
    @Request() req: any,
    @Body() data: {
      items: Array<{
        productId: string;
        variantId?: string;
        quantity: number;
        notes?: string;
      }>;
    },
  ) {
    return this.inventoryService.bulkRestock(data.items, req.user.id);
  }

  /**
   * Get comprehensive dashboard overview for inventory management
   */
  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async getDashboard(
    @Query('storeId') storeId?: string,
  ) {
    const filters = { storeId };

    // Get all stats in parallel for performance
    const [statistics, lowStock, outOfStock, recentTransactions] = await Promise.all([
      this.inventoryService.getInventoryStatistics(filters),
      this.inventoryService.getLowStockProducts({ ...filters, limit: 10 }),
      this.inventoryService.getOutOfStockProducts({ ...filters, limit: 10 }),
      this.inventoryService.getTransactionHistory({ limit: 20 }),
    ]);

    return {
      statistics,
      lowStockProducts: lowStock.data,
      outOfStockProducts: outOfStock.data,
      recentTransactions: recentTransactions.data,
      alerts: {
        lowStockCount: lowStock.pagination.total,
        outOfStockCount: outOfStock.pagination.total,
        needsAttention: lowStock.pagination.total + outOfStock.pagination.total,
      },
    };
  }
}
