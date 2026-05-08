import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /** GET /search — full product search */
  @Get()
  async search(
    @Query('q') query: string,
    @Query('category') category?: string, // category slug (human-readable)
    @Query('categoryId') categoryId?: string, // category ID (direct)
    @Query('storeId') storeId?: string,
    @Query('status') status?: string,
    @Query('featured') featured?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sortBy') sortBy?: string, // accepts "price-asc", "newest", "popular", etc.
    @Query('sortOrder') sortOrder?: string,
    @Query('tags') tags?: string | string[],
    @Query('inStock') inStock?: string,
    @Query('onSale') onSale?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    try {
      const filters: any = {
        ...(categoryId && { categoryId }),
        ...(category && !categoryId && { categorySlug: category }),
        ...(storeId && { storeId }),
        ...(status && { status }),
        ...(featured !== undefined && { featured: featured === 'true' }),
        ...(minPrice && { minPrice: parseFloat(minPrice) }),
        ...(maxPrice && { maxPrice: parseFloat(maxPrice) }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(inStock && { inStock: inStock === 'true' }),
        ...(onSale && { onSale: onSale === 'true' }),
        ...(limit && { limit: parseInt(limit) }),
        ...(page && { page: parseInt(page) }),
        ...(offset && { offset: parseInt(offset) }),
      };

      if (tags) {
        filters.tags = Array.isArray(tags) ? tags : [tags];
      }

      const data = await this.searchService.search(query || '', filters);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /** GET /search/autocomplete — fast typeahead */
  @Get('autocomplete')
  async autocomplete(@Query('q') query: string, @Query('limit') limit?: string) {
    try {
      const data = await this.searchService.autocomplete(query || '', limit ? parseInt(limit) : 8);
      return { success: true, data, total: data.length };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
        data: [],
        total: 0,
      };
    }
  }

  /** GET /search/trending — top searched terms */
  @Get('trending')
  getTrending(@Query('limit') limit?: string) {
    const data = this.searchService.getTrending(limit ? parseInt(limit) : 10);
    return { success: true, data };
  }

  /** GET /search/suggestions — query prefix suggestions */
  @Get('suggestions')
  async getSuggestions(@Query('q') query: string, @Query('limit') limit?: string) {
    try {
      const data = await this.searchService.getSuggestions(
        query || '',
        limit ? parseInt(limit) : 5
      );
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /** POST /search/analytics — track search (fire-and-forget from frontend) */
  @Post('analytics')
  trackAnalytics(@Body() body: { query?: string; resultsCount?: number }) {
    if (body?.query) this.searchService.trackSearch(body.query);
    return { success: true };
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
        message: error instanceof Error ? error.message : 'An error occurred',
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
        message: error instanceof Error ? error.message : 'An error occurred',
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
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }
}
