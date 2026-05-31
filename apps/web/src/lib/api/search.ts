import { api } from './client';
import { Product, SearchResult } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AutocompleteResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  heroImage: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  storeName?: string;
  rating?: number;
  badges?: string[];
  /** Server-side highlighted fields — name/shortDescription contain <mark> tags */
  _formatted?: {
    name?: string;
    shortDescription?: string;
  };
}

export interface TrendingSearch {
  term: string;
  count: number;
}

export interface SearchSuggestion {
  query: string;
}

export interface FacetDistribution {
  [attribute: string]: Record<string, number>;
}

export interface FacetStats {
  [attribute: string]: { min: number; max: number };
}

export interface FacetHit {
  value: string;
  count: number;
}

export interface SearchResultWithFacets<T> extends SearchResult<T> {
  processingTimeMs?: number;
  facetDistribution: FacetDistribution;
  facetStats: FacetStats;
}

export interface MultiSearchQuery {
  query: string;
  limit?: number;
  filter?: string | string[];
  facets?: string[];
  attributesToHighlight?: string[];
  matchingStrategy?: 'last' | 'all' | 'frequency';
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const searchAPI = {
  /**
   * Full product search via Meilisearch.
   * Returns facetDistribution + facetStats alongside products so the
   * filter sidebar can show dynamic counts (e.g. "Watches (12)").
   */
  search: async (params: {
    q: string;
    category?: string;
    categoryId?: string;
    storeId?: string;
    minPrice?: number;
    maxPrice?: number;
    brands?: string[];
    tags?: string[];
    colors?: string[];
    sizes?: string[];
    materials?: string[];
    inStock?: boolean;
    onSale?: boolean;
    sortBy?: string;
    page?: number;
    limit?: number;
    facets?: string;
    matchingStrategy?: 'last' | 'all' | 'frequency';
    showRankingScore?: boolean;
    distinct?: string;
  }): Promise<SearchResultWithFacets<Product>> => {
    const qp = new URLSearchParams();

    if (params.q) qp.append('q', params.q);
    if (params.category) qp.append('category', params.category);
    if (params.categoryId) qp.append('categoryId', params.categoryId);
    if (params.storeId) qp.append('storeId', params.storeId);
    if (params.minPrice) qp.append('minPrice', params.minPrice.toString());
    if (params.maxPrice) qp.append('maxPrice', params.maxPrice.toString());
    if (params.inStock !== undefined) qp.append('inStock', params.inStock.toString());
    if (params.onSale !== undefined) qp.append('onSale', params.onSale.toString());
    if (params.sortBy) qp.append('sortBy', params.sortBy);
    if (params.page) qp.append('page', params.page.toString());
    if (params.limit) qp.append('limit', params.limit.toString());
    if (params.facets) qp.append('facets', params.facets);
    if (params.matchingStrategy) qp.append('matchingStrategy', params.matchingStrategy);
    if (params.showRankingScore) qp.append('showRankingScore', 'true');
    if (params.distinct) qp.append('distinct', params.distinct);

    params.brands?.forEach((b) => qp.append('brands', b));
    params.tags?.forEach((t) => qp.append('tags', t));
    params.colors?.forEach((c) => qp.append('colors', c));
    params.sizes?.forEach((s) => qp.append('sizes', s));
    params.materials?.forEach((m) => qp.append('materials', m));

    return api.get<SearchResultWithFacets<Product>>(`/search?${qp.toString()}`);
  },

  /**
   * Fast typeahead — returns up to `limit` products with `_formatted.name`
   * containing <mark> tags around matched characters.
   */
  autocomplete: async (
    query: string,
    limit = 8
  ): Promise<{ data: AutocompleteResult[]; total: number }> => {
    if (!query || query.length < 2) return { data: [], total: 0 };
    try {
      const url = `/search/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`;
      const result = await api.get<AutocompleteResult[]>(url);
      return {
        data: Array.isArray(result) ? result : [],
        total: Array.isArray(result) ? result.length : 0,
      };
    } catch {
      return { data: [], total: 0 };
    }
  },

  /** Trending search terms (24-hour in-memory window) */
  getTrending: async (limit = 10): Promise<TrendingSearch[]> => {
    try {
      return await api.get<TrendingSearch[]>(`/search/trending?limit=${limit}`);
    } catch {
      return [];
    }
  },

  /** Prefix-based query suggestions */
  getSuggestions: async (query: string, limit = 5): Promise<{ data: SearchSuggestion[] }> => {
    if (!query || query.length < 2) return { data: [] };
    try {
      return await api.get<{ data: SearchSuggestion[] }>(
        `/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`
      );
    } catch {
      return { data: [] };
    }
  },

  /**
   * Search for values within a specific facet attribute.
   * e.g., searchFacetValues('category', 'elec') → [{ value: 'Electronics', count: 42 }]
   *
   * Use this to power "type to narrow a filter" UX in the sidebar.
   */
  searchFacetValues: async (facet: string, q: string, filter?: string): Promise<FacetHit[]> => {
    if (!facet) return [];
    try {
      const qp = new URLSearchParams({ facet, q: q || '' });
      if (filter) qp.append('filter', filter);
      const result = await api.get<FacetHit[]>(`/search/facet-values?${qp.toString()}`);
      return Array.isArray(result) ? result : [];
    } catch {
      return [];
    }
  },

  /**
   * Execute multiple search queries in a single HTTP round trip.
   * Each query object can have its own q, limit, filter, facets, etc.
   */
  multiSearch: async (queries: MultiSearchQuery[]) => {
    try {
      return await api.post<any[]>('/search/multi', { queries });
    } catch {
      return [];
    }
  },

  /** Fire-and-forget search analytics event */
  trackSearch: async (query: string, resultsCount: number): Promise<void> => {
    try {
      await api.post('/search/analytics', {
        query,
        resultsCount,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Silently fail — analytics must never break the app
    }
  },

  /** Meilisearch health check */
  getHealth: async () => {
    try {
      return await api.get('/search/health');
    } catch {
      return null;
    }
  },
};
