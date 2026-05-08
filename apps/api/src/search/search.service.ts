import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { MeiliSearch } from 'meilisearch';

@Injectable()
export class SearchService implements OnModuleInit, OnModuleDestroy {
  private client: MeiliSearch;
  private readonly productsIndex = 'products';

  // In-memory trending analytics — resets every 24 hours
  private readonly trendingMap = new Map<string, number>();
  private trendingResetTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    const host = this.configService.get<string>('MEILISEARCH_HOST', 'http://localhost:7700');
    const apiKey = this.configService.get<string>('MEILISEARCH_API_KEY', '');
    this.client = new MeiliSearch({ host, apiKey });
  }

  async onModuleInit() {
    try {
      await this.client.getIndex(this.productsIndex).catch(async () => {
        await this.client.createIndex(this.productsIndex, { primaryKey: 'id' });
      });

      await this.client.index(this.productsIndex).updateSettings({
        searchableAttributes: [
          'name',
          'shortDescription',
          'description',
          'category',
          'storeName',
          'tags',
          'materials',
          'colors',
          'sizes',
          'seoKeywords',
        ],
        filterableAttributes: [
          'categoryId',
          'storeId',
          'status',
          'featured',
          'price',
          'compareAtPrice',
          'colors',
          'sizes',
          'materials',
          'tags',
          'inventory',
          'isOnSale',
        ],
        sortableAttributes: ['price', 'createdAt', 'rating', 'viewCount', 'reviewCount'],
        rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
        typoTolerance: {
          enabled: true,
          minWordSizeForTypos: { oneTypo: 5, twoTypos: 9 },
        },
        synonyms: {
          bag: ['handbag', 'purse', 'tote'],
          handbag: ['bag', 'purse', 'tote'],
          shoes: ['footwear', 'heels', 'sneakers', 'boots'],
          watch: ['timepiece', 'wristwatch'],
          jewelry: ['jewellery', 'accessories', 'gems'],
          jewellery: ['jewelry', 'accessories', 'gems'],
          sunglasses: ['shades', 'eyewear'],
          wallet: ['purse', 'cardholder'],
          perfume: ['fragrance', 'cologne', 'scent'],
          fragrance: ['perfume', 'cologne', 'scent'],
          coat: ['jacket', 'blazer', 'outerwear'],
          dress: ['gown', 'frock'],
          necklace: ['chain', 'pendant'],
          bracelet: ['bangle', 'cuff'],
          earrings: ['studs', 'hoops'],
          scarf: ['shawl', 'wrap'],
          hat: ['cap', 'fedora', 'beanie'],
        },
        stopWords: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of'],
        displayedAttributes: [
          'id',
          'name',
          'slug',
          'shortDescription',
          'price',
          'compareAtPrice',
          'isOnSale',
          'status',
          'featured',
          'heroImage',
          'category',
          'categoryId',
          'storeName',
          'storeId',
          'tags',
          'colors',
          'sizes',
          'materials',
          'inventory',
          'rating',
          'reviewCount',
          'viewCount',
          'badges',
          'createdAt',
        ],
      });

      this.trendingResetTimer = setInterval(
        () => {
          this.trendingMap.clear();
        },
        24 * 60 * 60 * 1000
      );
    } catch (error) {
      console.error(
        'Failed to initialize Meilisearch:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  onModuleDestroy() {
    if (this.trendingResetTimer) clearInterval(this.trendingResetTimer);
  }

  // ─── Trending ──────────────────────────────────────────────────────────────

  trackSearch(query: string): void {
    const key = query.toLowerCase().trim();
    if (!key || key.length < 2) return;
    this.trendingMap.set(key, (this.trendingMap.get(key) || 0) + 1);
  }

  getTrending(limit = 10): { term: string; count: number }[] {
    return [...this.trendingMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([term, count]) => ({ term, count }));
  }

  // ─── Suggestions ───────────────────────────────────────────────────────────

  async getSuggestions(query: string, limit = 5): Promise<{ query: string }[]> {
    try {
      const results = await this.client.index(this.productsIndex).search(query, {
        limit: limit * 3,
        attributesToRetrieve: ['name'],
        filter: ['status = "ACTIVE"'],
      });
      const seen = new Set<string>();
      const suggestions: { query: string }[] = [];
      for (const hit of results.hits as any[]) {
        const key = (hit.name as string).toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          suggestions.push({ query: hit.name });
          if (suggestions.length >= limit) break;
        }
      }
      return suggestions;
    } catch {
      return [];
    }
  }

  // ─── Autocomplete ──────────────────────────────────────────────────────────

  async autocomplete(query: string, limit = 8) {
    try {
      const results = await this.client.index(this.productsIndex).search(query, {
        limit,
        filter: ['status = "ACTIVE"'],
        attributesToRetrieve: [
          'id',
          'name',
          'slug',
          'price',
          'compareAtPrice',
          'heroImage',
          'category',
          'categoryId',
          'storeName',
          'rating',
          'badges',
        ],
      });

      return (results.hits as any[]).map((hit) => ({
        id: hit.id,
        name: hit.name,
        slug: hit.slug,
        price: hit.price,
        compareAtPrice: hit.compareAtPrice,
        heroImage: hit.heroImage,
        category:
          hit.category && hit.categoryId
            ? { id: hit.categoryId, name: hit.category, slug: '' }
            : undefined,
        storeName: hit.storeName,
        rating: hit.rating,
        badges: hit.badges,
      }));
    } catch (error) {
      console.error('Autocomplete error:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  // ─── Full Search ───────────────────────────────────────────────────────────

  async search(
    query: string,
    filters?: {
      categoryId?: string;
      categorySlug?: string;
      storeId?: string;
      status?: string;
      featured?: boolean;
      minPrice?: number;
      maxPrice?: number;
      sortBy?: string;
      sortOrder?: string;
      tags?: string[];
      inStock?: boolean;
      onSale?: boolean;
      limit?: number;
      page?: number;
      offset?: number;
    }
  ) {
    const pageSize = filters?.limit || 20;
    const page = filters?.page || 1;
    const offset = filters?.offset ?? (page - 1) * pageSize;

    try {
      // Resolve category slug → ID if needed
      let categoryId = filters?.categoryId;
      if (!categoryId && filters?.categorySlug) {
        const cat = await this.prisma.category.findFirst({
          where: { slug: filters.categorySlug },
          select: { id: true },
        });
        categoryId = cat?.id;
      }

      // Parse compound sort: "price-asc" → sortBy=price, sortOrder=asc
      let sortBy = filters?.sortBy;
      let sortOrder = filters?.sortOrder || 'asc';
      if (sortBy?.includes('-')) {
        const [field, dir] = sortBy.split('-');
        sortBy = field;
        sortOrder = dir || 'asc';
      }
      if (sortBy === 'newest') {
        sortBy = 'createdAt';
        sortOrder = 'desc';
      } else if (sortBy === 'popular') {
        sortBy = 'viewCount';
        sortOrder = 'desc';
      } else if (sortBy === 'rating') {
        sortOrder = 'desc';
      } else if (!sortBy || sortBy === 'relevance') {
        sortBy = undefined;
      }

      const filterArray: string[] = [];
      filterArray.push(`status = "${filters?.status || 'ACTIVE'}"`);

      if (categoryId) filterArray.push(`categoryId = "${categoryId}"`);
      if (filters?.storeId) filterArray.push(`storeId = "${filters.storeId}"`);
      if (filters?.featured !== undefined) filterArray.push(`featured = ${filters.featured}`);
      if (filters?.minPrice !== undefined) filterArray.push(`price >= ${filters.minPrice}`);
      if (filters?.maxPrice !== undefined) filterArray.push(`price <= ${filters.maxPrice}`);
      if (filters?.inStock) filterArray.push(`inventory > 0`);
      if (filters?.onSale) filterArray.push(`isOnSale = true`);
      if (filters?.tags?.length) {
        filterArray.push(`(${filters.tags.map((t) => `tags = "${t}"`).join(' OR ')})`);
      }

      const searchParams: any = { limit: pageSize, offset, filter: filterArray };
      if (sortBy) searchParams.sort = [`${sortBy}:${sortOrder}`];

      const results = await this.client.index(this.productsIndex).search(query || '', searchParams);

      const total = results.estimatedTotalHits || 0;

      // Track analytics fire-and-forget
      if (query?.trim().length >= 2) this.trackSearch(query.trim());

      return {
        products: results.hits,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
        processingTimeMs: results.processingTimeMs,
        query: results.query,
      };
    } catch (error) {
      console.error(
        'Meilisearch unavailable, falling back to Prisma:',
        error instanceof Error ? error.message : String(error)
      );
      return this.prismaFallback(query, { ...filters, pageSize, page, offset });
    }
  }

  private async prismaFallback(
    query: string,
    opts: {
      categoryId?: string;
      storeId?: string;
      status?: string;
      featured?: boolean;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      pageSize?: number;
      page?: number;
      offset?: number;
    }
  ) {
    const { pageSize = 20, page = 1, offset = 0 } = opts;
    const where: any = {
      status: opts.status || 'ACTIVE',
      ...(opts.categoryId && { categoryId: opts.categoryId }),
      ...(opts.storeId && { storeId: opts.storeId }),
      ...(opts.featured !== undefined && { featured: opts.featured }),
      ...(opts.inStock && { inventory: { gt: 0 } }),
      ...((opts.minPrice !== undefined || opts.maxPrice !== undefined) && {
        price: {
          ...(opts.minPrice !== undefined && { gte: opts.minPrice }),
          ...(opts.maxPrice !== undefined && { lte: opts.maxPrice }),
        },
      }),
    };
    if (query?.trim()) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } },
      ];
    }
    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        take: pageSize,
        skip: offset,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      products: rows.map((p) => ({
        ...p,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        rating: p.rating ? Number(p.rating) : null,
        category: p.category?.name,
        heroImage: p.heroImage || '',
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
      processingTimeMs: 0,
      query,
    };
  }

  // ─── Indexing ──────────────────────────────────────────────────────────────

  private toDocument(product: any) {
    const price = Number(product.price);
    const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      categoryId: product.categoryId,
      category: product.category?.name,
      storeId: product.storeId,
      storeName: product.store?.name,
      price,
      compareAtPrice,
      isOnSale: compareAtPrice !== null && compareAtPrice > price,
      status: product.status,
      featured: product.featured,
      inventory: product.inventory,
      heroImage: product.heroImage,
      colors: product.colors,
      sizes: product.sizes,
      materials: product.materials,
      badges: product.badges,
      seoKeywords: product.seoKeywords,
      tags: (product.tags || []).map((t: any) => t.name),
      rating: product.rating ? Number(product.rating) : null,
      reviewCount: product.reviewCount,
      viewCount: product.viewCount,
      createdAt:
        product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt,
    };
  }

  async indexAllProducts() {
    try {
      const products = await this.prisma.product.findMany({
        include: {
          category: { select: { id: true, name: true, slug: true } },
          tags: { select: { name: true } },
          store: { select: { id: true, name: true } },
        },
      });

      const documents = products.map((p) => this.toDocument(p));
      const task = await this.client.index(this.productsIndex).addDocuments(documents);
      return {
        taskUid: task.taskUid,
        indexedCount: documents.length,
        message: 'Products indexing started',
      };
    } catch (error) {
      console.error('Indexing error:', error instanceof Error ? error.message : String(error));
      throw new Error('Failed to index products');
    }
  }

  async indexProduct(productId: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          tags: { select: { name: true } },
          store: { select: { id: true, name: true } },
        },
      });
      if (!product) throw new Error('Product not found');
      const task = await this.client
        .index(this.productsIndex)
        .addDocuments([this.toDocument(product)]);
      return { taskUid: task.taskUid, message: 'Product indexed successfully' };
    } catch (error) {
      console.error(
        'Product indexing error:',
        error instanceof Error ? error.message : String(error)
      );
      throw new Error('Failed to index product');
    }
  }

  /**
   * Delete product from index
   */
  async deleteProduct(productId: string) {
    try {
      const task = await this.client.index(this.productsIndex).deleteDocument(productId);

      return {
        taskUid: task.taskUid,
        message: 'Product removed from index',
      };
    } catch (error) {
      console.error(
        'Delete from index error:',
        error instanceof Error ? error.message : String(error)
      );
      throw new Error('Failed to delete product from index');
    }
  }

  /**
   * Get index stats
   */
  async getStats() {
    try {
      const stats = await this.client.index(this.productsIndex).getStats();
      return stats;
    } catch (error) {
      console.error('Stats error:', error instanceof Error ? error.message : String(error));
      throw new Error('Failed to get search stats');
    }
  }
}
