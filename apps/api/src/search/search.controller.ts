import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // ─── Public endpoints ──────────────────────────────────────────────────────

  /**
   * GET /search
   * Full product search with filters, facets, highlighting and sorting.
   *
   * Key params:
   *   q           — search query
   *   facets      — comma-separated facet attributes (returns distribution + stats)
   *   colors      — filter by color (multi-value: ?colors=Red&colors=Blue)
   *   sizes       — filter by size
   *   materials   — filter by material
   *   matchingStrategy — "last" | "all" | "frequency"
   *   showRankingScore — true to include _rankingScore on each hit
   *   distinct    — deduplicate hits by this field (e.g. storeId)
   */
  @Get()
  async search(
    @Query('q') query: string,
    @Query('category') category?: string,
    @Query('categoryId') categoryId?: string,
    @Query('storeId') storeId?: string,
    @Query('status') status?: string,
    @Query('featured') featured?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('tags') tags?: string | string[],
    @Query('colors') colors?: string | string[],
    @Query('sizes') sizes?: string | string[],
    @Query('materials') materials?: string | string[],
    @Query('inStock') inStock?: string,
    @Query('onSale') onSale?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('facets') facets?: string,
    @Query('matchingStrategy') matchingStrategy?: string,
    @Query('showRankingScore') showRankingScore?: string,
    @Query('distinct') distinct?: string
  ) {
    try {
      const facetList = facets
        ? facets
            .split(',')
            .map((f) => f.trim())
            .filter(Boolean)
        : undefined;

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
        ...(facetList && { facets: facetList }),
        ...(matchingStrategy && { matchingStrategy }),
        ...(showRankingScore === 'true' && { showRankingScore: true }),
        ...(distinct && { distinct }),
      };

      if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
      if (colors) filters.colors = Array.isArray(colors) ? colors : [colors];
      if (sizes) filters.sizes = Array.isArray(sizes) ? sizes : [sizes];
      if (materials) filters.materials = Array.isArray(materials) ? materials : [materials];

      const data = await this.searchService.search(query || '', filters);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * GET /search/autocomplete
   * Fast typeahead — returns hits with `_formatted.name` containing <mark> tags.
   */
  @Get('autocomplete')
  async autocomplete(@Query('q') query: string, @Query('limit') limit?: string) {
    try {
      const data = await this.searchService.autocomplete(query || '', limit ? parseInt(limit) : 8);
      return { success: true, data, total: data.length };
    } catch (error) {
      return {
        success: false,
        data: [],
        total: 0,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /** GET /search/trending — top searched terms (in-memory, 24h window) */
  @Get('trending')
  getTrending(@Query('limit') limit?: string) {
    const data = this.searchService.getTrending(limit ? parseInt(limit) : 10);
    return { success: true, data };
  }

  /** GET /search/suggestions — prefix-based query suggestions */
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

  /**
   * GET /search/facet-values
   * Search for values within a specific facet attribute.
   * Enables "type to filter" UX inside filter panels (e.g. search for a category).
   *
   * @param facet   — attribute name, e.g. "category", "tags", "storeName"
   * @param q       — query to match against facet values
   * @param filter  — optional extra filter context (URL-encoded Meilisearch filter)
   */
  @Get('facet-values')
  async searchFacetValues(
    @Query('facet') facet: string,
    @Query('q') q: string,
    @Query('filter') filter?: string
  ) {
    if (!facet) return { success: false, data: [], message: 'facet param required' };
    try {
      const data = await this.searchService.searchFacetValues(facet, q || '', filter);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * POST /search/multi
   * Batch multiple search queries in a single HTTP round trip.
   * Each query object mirrors the /search params (query, limit, filter, facets, etc.).
   */
  @Post('multi')
  async multiSearch(
    @Body()
    body: {
      queries: Array<{
        query: string;
        indexUid?: string;
        limit?: number;
        filter?: string | string[];
        facets?: string[];
        attributesToHighlight?: string[];
        highlightPreTag?: string;
        highlightPostTag?: string;
        matchingStrategy?: 'last' | 'all' | 'frequency';
      }>;
    }
  ) {
    if (!Array.isArray(body?.queries) || body.queries.length === 0) {
      return { success: false, message: 'queries array required' };
    }
    try {
      const data = await this.searchService.multiSearch(body.queries);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /** POST /search/analytics — fire-and-forget search event tracking */
  @Post('analytics')
  trackAnalytics(@Body() body: { query?: string; resultsCount?: number }) {
    if (body?.query) this.searchService.trackSearch(body.query);
    return { success: true };
  }

  /** GET /search/health — Meilisearch instance health check */
  @Get('health')
  async getHealth() {
    try {
      const data = await this.searchService.getHealth();
      return { success: true, data };
    } catch (error) {
      return { success: false, message: 'Meilisearch is unavailable' };
    }
  }

  // ─── Admin-only endpoints ──────────────────────────────────────────────────

  /**
   * POST /search/index — re-index all products
   * Triggers a full re-index from the Postgres database.
   */
  @Post('index')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async indexAllProducts() {
    try {
      const data = await this.searchService.indexAllProducts();
      return { success: true, data, message: 'Indexing started successfully' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * POST /search/index/:productId — index a single product
   */
  @Post('index/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async indexProduct(@Param('productId') productId: string) {
    try {
      const data = await this.searchService.indexProduct(productId);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * DELETE /search/index/:productId — remove product from index
   */
  @Delete('index/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deleteFromIndex(@Param('productId') productId: string) {
    try {
      const data = await this.searchService.deleteProduct(productId);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * GET /search/stats — Meilisearch index statistics
   * Returns document count, field distribution, indexing state.
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStats() {
    try {
      const data = await this.searchService.getStats();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * GET /search/settings — current index settings
   * Useful for debugging what configuration is active in production.
   */
  @Get('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getSettings() {
    try {
      const data = await this.searchService.getCurrentSettings();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * GET /search/version — Meilisearch version info
   */
  @Get('version')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getVersion() {
    try {
      const data = await this.searchService.getVersion();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * GET /search/tasks — list recent indexing tasks
   */
  @Get('tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getTasks(@Query('limit') limit?: string) {
    try {
      const data = await this.searchService.getTasks(limit ? parseInt(limit) : 20);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * GET /search/tasks/:taskUid — get status of a specific task
   * Returns task status: enqueued | processing | succeeded | failed | canceled
   */
  @Get('tasks/:taskUid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getTask(@Param('taskUid', ParseIntPipe) taskUid: number) {
    try {
      const data = await this.searchService.getTask(taskUid);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }
}
