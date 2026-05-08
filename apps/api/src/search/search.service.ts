import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { MeiliSearch, MultiSearchQuery } from 'meilisearch';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SearchHit {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  heroImage: string;
  category?: string;
  categoryId?: string;
  storeName?: string;
  storeId?: string;
  rating?: number;
  reviewCount?: number;
  viewCount?: number;
  featured?: boolean;
  badges?: string[];
  tags?: string[];
  colors?: string[];
  sizes?: string[];
  materials?: string[];
  inventory?: number;
  isOnSale?: boolean;
  createdAt?: string;
  _rankingScore?: number;
  _formatted?: {
    name?: string;
    shortDescription?: string;
    description?: string;
  };
  _matchesPosition?: Record<string, Array<{ start: number; length: number }>>;
}

export interface FacetHit {
  value: string;
  count: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class SearchService implements OnModuleInit, OnModuleDestroy {
  private client: MeiliSearch;
  private readonly PRODUCTS_INDEX = 'products';

  /**
   * Default facets computed on every search — drives dynamic filter counts
   * in the sidebar (showing e.g. "Electronics (12)" for the current query).
   */
  private readonly DEFAULT_FACETS = [
    'category',
    'categoryId',
    'tags',
    'colors',
    'sizes',
    'materials',
    'storeName',
    'featured',
    'isOnSale',
  ];

  /** In-memory trending analytics — resets every 24 hours */
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
      await this.client.getIndex(this.PRODUCTS_INDEX).catch(async () => {
        await this.client.createIndex(this.PRODUCTS_INDEX, { primaryKey: 'id' });
      });

      await this.client.index(this.PRODUCTS_INDEX).updateSettings({
        // ── Searchable fields (order = weight: name > shortDescription > ...) ──
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

        // ── Filterable (enables WHERE-like filtering + facet distribution) ──
        filterableAttributes: [
          'categoryId',
          'category', // needed for faceting by category name
          'storeId',
          'storeName', // needed for faceting + filtering by store
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
          'rating',
        ],

        // ── Sortable fields ──────────────────────────────────────────────────
        sortableAttributes: [
          'price',
          'createdAt',
          'rating',
          'viewCount',
          'reviewCount',
          'storeName',
        ],

        /**
         * Ranking rules applied in order.
         * Built-ins: words → typo → proximity → attribute → sort → exactness
         * Custom attribute rules after exactness break remaining ties:
         *   - higher-rated products rank first
         *   - then more popular (view count)
         * Both attributes must be in sortableAttributes.
         */
        rankingRules: [
          'words',
          'typo',
          'proximity',
          'attribute',
          'sort',
          'exactness',
          'rating:desc',
          'viewCount:desc',
        ],

        // ── Typo tolerance ───────────────────────────────────────────────────
        typoTolerance: {
          enabled: true,
          minWordSizeForTypos: {
            oneTypo: 4, // "watc" → "watch"  (was 5)
            twoTypos: 8, // "handbab" → "handbag"  (was 9)
          },
          // Preserve exact spelling for luxury brand abbreviations
          disableOnWords: [
            'LV',
            'YSL',
            'MK',
            'CC',
            'GG',
            'Dior',
            'Chanel',
            'Gucci',
            'Prada',
            'Fendi',
            'Rolex',
            'Omega',
            'Breitling',
            'IWC',
            'TAG',
          ],
          // Never typo-correct slugs
          disableOnAttributes: ['slug'],
        },

        // ── Synonyms (bidirectional luxury vocabulary) ────────────────────────
        synonyms: {
          // Bags
          bag: ['handbag', 'purse', 'tote', 'satchel', 'clutch'],
          handbag: ['bag', 'purse', 'tote'],
          purse: ['bag', 'handbag', 'wallet'],
          clutch: ['bag', 'evening bag'],
          tote: ['bag', 'shopper'],
          // Shoes
          shoes: ['footwear', 'heels', 'sneakers', 'boots', 'loafers', 'pumps'],
          heels: ['shoes', 'pumps', 'stilettos'],
          sneakers: ['trainers', 'athletic shoes', 'runners', 'kicks'],
          boots: ['shoes', 'ankle boots', 'chelsea boots'],
          // Watches
          watch: ['timepiece', 'wristwatch', 'chronograph'],
          timepiece: ['watch', 'wristwatch'],
          // Jewelry
          jewelry: ['jewellery', 'accessories', 'gems', 'fine jewelry'],
          jewellery: ['jewelry', 'accessories', 'gems'],
          necklace: ['chain', 'pendant', 'choker', 'collar'],
          bracelet: ['bangle', 'cuff', 'wristband', 'armband'],
          earrings: ['studs', 'hoops', 'drops', 'ear jewelry'],
          ring: ['band', 'signet', 'engagement ring'],
          // Eyewear
          sunglasses: ['shades', 'eyewear', 'glasses', 'sunnies'],
          eyewear: ['sunglasses', 'glasses', 'spectacles'],
          // Fragrance
          perfume: ['fragrance', 'cologne', 'scent', 'eau de parfum', 'edp', 'edt'],
          fragrance: ['perfume', 'cologne', 'scent'],
          cologne: ['perfume', 'fragrance', 'eau de toilette'],
          // Outerwear
          coat: ['jacket', 'blazer', 'outerwear', 'overcoat'],
          jacket: ['coat', 'blazer', 'bomber'],
          blazer: ['jacket', 'suit jacket'],
          // Clothing
          dress: ['gown', 'frock', 'midi', 'maxi'],
          gown: ['dress', 'evening gown', 'ball gown'],
          scarf: ['shawl', 'wrap', 'stole', 'pashmina'],
          hat: ['cap', 'fedora', 'beanie', 'headwear', 'beret'],
          belt: ['strap', 'waistband', 'cinch'],
          trousers: ['pants', 'slacks', 'chinos'],
          shirt: ['top', 'blouse', 'button-up'],
          // Accessories
          wallet: ['cardholder', 'billfold', 'card wallet'],
          luggage: ['suitcase', 'trolley', 'travel bag', 'carry-on'],
          gloves: ['mittens', 'hand wear'],
        },

        // ── Stop words ───────────────────────────────────────────────────────
        stopWords: [
          'the',
          'a',
          'an',
          'and',
          'or',
          'but',
          'in',
          'on',
          'at',
          'to',
          'for',
          'of',
          'with',
          'by',
          'from',
        ],

        /**
         * nonSeparatorTokens: treat these characters as part of a word token
         * so "Dolce&Gabbana", "Yves-Saint-Laurent", "L'Oréal" are not split.
         */
        nonSeparatorTokens: ['-', '&', "'", '.'],

        /**
         * separatorTokens: always split on these even mid-word
         * (useful for SKU-style identifiers like "BAG_001")
         */
        separatorTokens: ['_', '/'],

        // ── Displayed attributes (returned in hits) ──────────────────────────
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
          'seoKeywords',
          'createdAt',
        ],

        /**
         * Pagination: raise the ceiling so deep pages are reachable.
         * Default is 1000; 10 000 allows thorough browsing without offset tricks.
         */
        pagination: {
          maxTotalHits: 10000,
        },
      });

      // Reset trending counts every 24 hours
      this.trendingResetTimer = setInterval(
        () => {
          this.trendingMap.clear();
        },
        24 * 60 * 60 * 1000
      );

      console.log('[Meilisearch] Index settings applied successfully');

      // Auto-index all products if the index is empty (first boot / fresh install)
      const stats = await this.client.index(this.PRODUCTS_INDEX).getStats();
      if (stats.numberOfDocuments === 0) {
        console.log('[Meilisearch] Index is empty — triggering initial product indexing…');
        this.indexAllProducts().catch((err) =>
          console.error(
            '[Meilisearch] Auto-indexing failed:',
            err instanceof Error ? err.message : String(err)
          )
        );
      }
    } catch (error) {
      console.error(
        '[Meilisearch] Init failed:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  onModuleDestroy() {
    if (this.trendingResetTimer) clearInterval(this.trendingResetTimer);
  }

  // ─── Trending ────────────────────────────────────────────────────────────

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

  // ─── Suggestions ─────────────────────────────────────────────────────────

  async getSuggestions(query: string, limit = 5): Promise<{ query: string }[]> {
    try {
      const results = await this.client.index(this.PRODUCTS_INDEX).search(query, {
        limit: limit * 3,
        attributesToRetrieve: ['name'],
        filter: ['status = "ACTIVE"'],
        // All words must appear — keeps suggestions precise
        matchingStrategy: 'all',
        searchCutoffMs: 80,
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

  // ─── Autocomplete ─────────────────────────────────────────────────────────

  /**
   * Fast typeahead with server-side name highlighting via `_formatted`.
   * Frontend can render `_formatted.name` with `dangerouslySetInnerHTML`
   * (safe: only `<mark>` tags injected by Meilisearch, content is from DB).
   */
  async autocomplete(query: string, limit = 8) {
    try {
      const results = await this.client.index(this.PRODUCTS_INDEX).search(query, {
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
          'shortDescription',
        ],
        // Highlight the query match inside the product name
        attributesToHighlight: ['name', 'shortDescription'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
        // Crop description so the autocomplete item shows a relevant snippet
        attributesToCrop: ['shortDescription'],
        cropLength: 12,
        cropMarker: '…',
        // frequency: rank by how often query words appear in the doc
        matchingStrategy: 'frequency',
        searchCutoffMs: 100,
      });

      const mapped = (results.hits as any[]).map((hit) => ({
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
        // _formatted contains <mark>-wrapped matches — use in frontend
        _formatted: hit._formatted,
      }));

      // Fall back to Prisma when index is empty (not yet indexed)
      if (mapped.length === 0) return this.autocompleteFromPrisma(query, limit);
      return mapped;
    } catch (error) {
      console.error(
        '[Meilisearch] Autocomplete error:',
        error instanceof Error ? error.message : String(error)
      );
      return this.autocompleteFromPrisma(query, limit);
    }
  }

  private async autocompleteFromPrisma(query: string, limit: number) {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { shortDescription: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          store: { select: { name: true } },
        },
        orderBy: { viewCount: 'desc' },
      });
      return products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
        heroImage: p.heroImage || '',
        category: p.category ? { id: p.categoryId!, name: p.category.name, slug: '' } : undefined,
        storeName: (p as any).store?.name,
        rating: p.rating ? Number(p.rating) : undefined,
        badges: (p as any).badges,
        _formatted: undefined,
      }));
    } catch {
      return [];
    }
  }

  // ─── Full Search ──────────────────────────────────────────────────────────

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
      colors?: string[];
      sizes?: string[];
      materials?: string[];
      inStock?: boolean;
      onSale?: boolean;
      limit?: number;
      page?: number;
      offset?: number;
      // Meilisearch advanced options
      facets?: string[];
      matchingStrategy?: 'last' | 'all' | 'frequency';
      showRankingScore?: boolean;
      distinct?: string;
    }
  ) {
    const pageSize = filters?.limit || 20;
    const page = filters?.page || 1;
    const offset = filters?.offset ?? (page - 1) * pageSize;

    try {
      // Resolve category slug → ID if provided without ID
      let categoryId = filters?.categoryId;
      if (!categoryId && filters?.categorySlug) {
        const cat = await this.prisma.category.findFirst({
          where: { slug: filters.categorySlug },
          select: { id: true },
        });
        categoryId = cat?.id;
      }

      // Parse compound sort strings: "price-asc", "price-desc", "newest", "popular"
      let sortBy = filters?.sortBy;
      let sortOrder = filters?.sortOrder || 'asc';
      if (sortBy?.includes('-')) {
        const parts = sortBy.split('-');
        sortBy = parts[0];
        sortOrder = parts[1] || 'asc';
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

      // Build filter array (Meilisearch filter expression)
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
      if (filters?.colors?.length) {
        filterArray.push(`(${filters.colors.map((c) => `colors = "${c}"`).join(' OR ')})`);
      }
      if (filters?.sizes?.length) {
        filterArray.push(`(${filters.sizes.map((s) => `sizes = "${s}"`).join(' OR ')})`);
      }
      if (filters?.materials?.length) {
        filterArray.push(`(${filters.materials.map((m) => `materials = "${m}"`).join(' OR ')})`);
      }

      const searchParams: any = {
        limit: pageSize,
        offset,
        filter: filterArray,

        /**
         * Facets: Meilisearch returns the distribution of values for each
         * facet attribute in the current result set, plus numeric stats (min/max).
         * This powers dynamic filter counts in the sidebar.
         */
        facets: filters?.facets ?? this.DEFAULT_FACETS,

        /**
         * Highlight: Meilisearch wraps query matches in <mark> tags inside
         * hit._formatted. Useful for bolding matched text in results.
         */
        attributesToHighlight: ['name', 'shortDescription'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',

        /**
         * Crop: returns a short snippet of the description centred on the
         * match rather than the full (potentially huge) text.
         */
        attributesToCrop: ['shortDescription', 'description'],
        cropLength: 20,
        cropMarker: '…',

        /**
         * matchingStrategy:
         *   'last'      — drop least-significant words progressively (default)
         *   'all'       — all words must appear (strict)
         *   'frequency' — weight by how often query words appear in corpus
         * 'frequency' generally ranks e-commerce results most intuitively.
         */
        matchingStrategy: filters?.matchingStrategy ?? 'frequency',

        /**
         * searchCutoffMs: abort the search and return partial results if
         * Meilisearch hasn't finished within this window. Keeps p99 latency low.
         */
        searchCutoffMs: 150,

        /**
         * showRankingScore: attach a normalised [0,1] relevance score to each
         * hit (_rankingScore). Useful for debugging ranking and A/B testing.
         */
        showRankingScore: filters?.showRankingScore ?? false,
      };

      if (sortBy) searchParams.sort = [`${sortBy}:${sortOrder}`];

      /**
       * distinct: deduplicate results by a field value.
       * e.g., distinct='storeId' returns at most one product per store.
       */
      if (filters?.distinct) searchParams.distinct = filters.distinct;

      const results = await this.client
        .index(this.PRODUCTS_INDEX)
        .search(query || '', searchParams);
      const total = results.estimatedTotalHits ?? 0;

      if (query?.trim().length >= 2) this.trackSearch(query.trim());

      return {
        products: results.hits,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
        processingTimeMs: results.processingTimeMs,
        query: results.query,
        /**
         * facetDistribution: { category: { "Watches": 12, "Bags": 7 }, tags: { "luxury": 9 } }
         * Use this to show "(12)" counts next to each filter option in the sidebar.
         */
        facetDistribution: (results as any).facetDistribution ?? {},
        /**
         * facetStats: { price: { min: 50, max: 15000 } }
         * Use this to render the price range slider with real data bounds.
         */
        facetStats: (results as any).facetStats ?? {},
      };
    } catch (error) {
      console.error(
        '[Meilisearch] Search error, falling back to Prisma:',
        error instanceof Error ? error.message : String(error)
      );
      return this.prismaFallback(query, { ...filters, pageSize, page, offset });
    }
  }

  // ─── Multi-Search ─────────────────────────────────────────────────────────

  /**
   * Execute multiple independent searches in a single HTTP round trip.
   * Useful for pages that need e.g. "related products" + "same-category" in one call.
   */
  async multiSearch(
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
    }>
  ) {
    try {
      const multiQueries: MultiSearchQuery[] = queries.map((q) => ({
        indexUid: q.indexUid ?? this.PRODUCTS_INDEX,
        q: q.query,
        limit: q.limit ?? 8,
        filter: q.filter ?? ['status = "ACTIVE"'],
        facets: q.facets,
        attributesToHighlight: q.attributesToHighlight ?? ['name'],
        highlightPreTag: q.highlightPreTag ?? '<mark>',
        highlightPostTag: q.highlightPostTag ?? '</mark>',
        matchingStrategy: q.matchingStrategy ?? 'frequency',
        searchCutoffMs: 150,
      }));

      const response = await this.client.multiSearch({ queries: multiQueries });
      return response.results;
    } catch (error) {
      console.error(
        '[Meilisearch] Multi-search error:',
        error instanceof Error ? error.message : String(error)
      );
      throw new Error('Multi-search failed');
    }
  }

  // ─── Facet Value Search ───────────────────────────────────────────────────

  /**
   * Search for values within a specific facet attribute.
   * e.g., searchFacetValues('category', 'elec') → [{ value: 'Electronics', count: 42 }]
   *
   * Powers "search within filter" UX — users can type to narrow down filter options
   * when there are many (50+ categories, hundreds of tags).
   */
  async searchFacetValues(
    facetName: string,
    facetQuery: string,
    filterContext?: string
  ): Promise<FacetHit[]> {
    try {
      const result = await (this.client.index(this.PRODUCTS_INDEX) as any).searchForFacetValues({
        facetName,
        facetQuery,
        filter: filterContext ?? 'status = "ACTIVE"',
      });
      return (result.facetHits as FacetHit[]) ?? [];
    } catch (error) {
      console.error(
        '[Meilisearch] Facet search error:',
        error instanceof Error ? error.message : String(error)
      );
      return [];
    }
  }

  // ─── Task Monitoring ──────────────────────────────────────────────────────

  /** Get the status of a specific indexing task by UID */
  async getTask(taskUid: number) {
    return (this.client as any).getTask(taskUid);
  }

  /** List recent tasks (indexing jobs, settings updates, etc.) */
  async getTasks(limit = 20) {
    return (this.client as any).getTasks({ limit });
  }

  // ─── Health & Info ────────────────────────────────────────────────────────

  async getHealth() {
    return this.client.health();
  }

  async getVersion() {
    return this.client.getVersion();
  }

  async getCurrentSettings() {
    return this.client.index(this.PRODUCTS_INDEX).getSettings();
  }

  // ─── Prisma Fallback ──────────────────────────────────────────────────────

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
      facetDistribution: {},
      facetStats: {},
    };
  }

  // ─── Indexing ─────────────────────────────────────────────────────────────

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
      const task = await this.client.index(this.PRODUCTS_INDEX).addDocuments(documents);
      return {
        taskUid: task.taskUid,
        indexedCount: documents.length,
        message: 'Products indexing started',
      };
    } catch (error) {
      console.error(
        '[Meilisearch] Indexing error:',
        error instanceof Error ? error.message : String(error)
      );
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
        .index(this.PRODUCTS_INDEX)
        .addDocuments([this.toDocument(product)]);
      return { taskUid: task.taskUid, message: 'Product indexed successfully' };
    } catch (error) {
      console.error(
        '[Meilisearch] Product indexing error:',
        error instanceof Error ? error.message : String(error)
      );
      throw new Error('Failed to index product');
    }
  }

  async deleteProduct(productId: string) {
    try {
      const task = await this.client.index(this.PRODUCTS_INDEX).deleteDocument(productId);
      return { taskUid: task.taskUid, message: 'Product removed from index' };
    } catch (error) {
      console.error(
        '[Meilisearch] Delete error:',
        error instanceof Error ? error.message : String(error)
      );
      throw new Error('Failed to delete product from index');
    }
  }

  async getStats() {
    try {
      return await this.client.index(this.PRODUCTS_INDEX).getStats();
    } catch (error) {
      console.error(
        '[Meilisearch] Stats error:',
        error instanceof Error ? error.message : String(error)
      );
      throw new Error('Failed to get search stats');
    }
  }
}
