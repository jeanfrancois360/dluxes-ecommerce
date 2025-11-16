import { api } from './client';
import { Product, SearchFilters, SearchResult } from './types';

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
  brand?: string;
}

export interface TrendingSearch {
  term: string;
  count: number;
}

export interface SearchSuggestion {
  query: string;
  category?: string;
}

export const searchAPI = {
  // Full search with Meilisearch
  search: async (params: {
    q: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    brands?: string[];
    tags?: string[];
    inStock?: boolean;
    onSale?: boolean;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();

    if (params.q) queryParams.append('q', params.q);
    if (params.category) queryParams.append('category', params.category);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params.brands) params.brands.forEach(b => queryParams.append('brands', b));
    if (params.tags) params.tags.forEach(t => queryParams.append('tags', t));
    if (params.inStock !== undefined) queryParams.append('inStock', params.inStock.toString());
    if (params.onSale !== undefined) queryParams.append('onSale', params.onSale.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    return api.get<SearchResult<Product>>(`/search?${queryParams.toString()}`);
  },

  // Fast autocomplete endpoint for real-time suggestions
  autocomplete: async (query: string, limit: number = 8) => {
    if (!query || query.length < 2) {
      return { data: [], total: 0 };
    }

    return api.get<{ data: AutocompleteResult[]; total: number }>(
      `/search/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  },

  // Get trending searches
  getTrending: async (limit: number = 10) => {
    return api.get<{ data: TrendingSearch[] }>(`/search/trending?limit=${limit}`);
  },

  // Get search suggestions based on partial query
  getSuggestions: async (query: string, limit: number = 5) => {
    if (!query || query.length < 2) {
      return { data: [] };
    }

    return api.get<{ data: SearchSuggestion[] }>(
      `/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  },

  // Track search analytics (fire and forget)
  trackSearch: async (query: string, resultsCount: number) => {
    try {
      await api.post('/search/analytics', {
        query,
        resultsCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
      console.error('Failed to track search:', error);
    }
  },
};
