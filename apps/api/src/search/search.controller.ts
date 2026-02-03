import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

/**
 * Search Controller
 * Handles search-related HTTP requests
 */
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * Search products
   * @route GET /search
   */
  @Get()
  async search(
    @Query('q') query: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
    @Query('featured') featured?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    try {
      const filters: any = {};

      if (categoryId) filters.categoryId = categoryId;
      if (status) filters.status = status;
      if (featured !== undefined) filters.featured = featured === 'true';
      if (minPrice) filters.minPrice = parseFloat(minPrice);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
      if (sortBy) filters.sortBy = sortBy;
      if (sortOrder) filters.sortOrder = sortOrder;
      if (limit) filters.limit = parseInt(limit);
      if (offset) filters.offset = parseInt(offset);

      const data = await this.searchService.search(query || '', filters);
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
   * Autocomplete search
   * @route GET /search/autocomplete
   */
  @Get('autocomplete')
  async autocomplete(
    @Query('q') query: string,
    @Query('limit') limit?: string
  ) {
    try {
      const limitNum = limit ? parseInt(limit) : 8;
      const data = await this.searchService.autocomplete(query || '', limitNum);
      return {
        success: true,
        data,
        total: data.length,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
        data: [],
        total: 0,
      };
    }
  }

  /**
   * Index all products (Admin only)
   * @route POST /search/index
   */
  @Post('index')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async indexAllProducts() {
    try {
      const data = await this.searchService.indexAllProducts();
      return {
        success: true,
        data,
        message: 'Indexing started successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Index single product (Admin only)
   * @route POST /search/index/:productId
   */
  @Post('index/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async indexProduct(@Param('productId') productId: string) {
    try {
      const data = await this.searchService.indexProduct(productId);
      return {
        success: true,
        data,
        message: 'Product indexed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Get search stats (Admin only)
   * @route GET /search/stats
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStats() {
    try {
      const data = await this.searchService.getStats();
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
