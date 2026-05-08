'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  searchAPI,
  AutocompleteResult,
  TrendingSearch,
  FacetDistribution,
  FacetStats,
  FacetHit,
  SearchResultWithFacets,
} from '@/lib/api/search';
import { Product } from '@/lib/api/types';

// Local storage key for recent searches
const RECENT_SEARCHES_KEY = 'luxury_recent_searches';
const MAX_RECENT_SEARCHES = 5;

// ─── Main search hook ─────────────────────────────────────────────────────────

interface UseSearchOptions {
  enabled?: boolean;
}

interface UseSearchResult {
  data: SearchResultWithFacets<Product> | null;
  isLoading: boolean;
  error: Error | null;
  search: (params: any) => Promise<void>;
}

export function useSearch(initialParams?: any, options: UseSearchOptions = {}): UseSearchResult {
  const { enabled = true } = options;
  const [data, setData] = useState<SearchResultWithFacets<Product> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (params: any) => {
      if (!enabled || !params.q || params.q.length < 2) {
        setData(null);
        return;
      }

      if (abortControllerRef.current) abortControllerRef.current.abort();

      setIsLoading(true);
      setError(null);

      try {
        const result = await searchAPI.search(params);
        setData(result);
        if (result.products.length > 0) {
          searchAPI.trackSearch(params.q, result.total);
        }
        saveRecentSearch(params.q);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [enabled]
  );

  return { data, isLoading, error, search };
}

// ─── Autocomplete hook ────────────────────────────────────────────────────────

export function useAutocomplete(query: string, debounceMs = 300) {
  const [results, setResults] = useState<AutocompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!query || query.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await searchAPI.autocomplete(query, 8);
        setResults(response?.data || []);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err);
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query, debounceMs]);

  return { results, isLoading, error };
}

// ─── Trending searches hook ───────────────────────────────────────────────────

export function useTrendingSearches() {
  const [trending, setTrending] = useState<TrendingSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const result = await searchAPI.getTrending(10);
        // API client may unwrap { success, data } → direct array
        const items = Array.isArray(result) ? result : ((result as any)?.data ?? []);
        setTrending(items);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrending();
  }, []);

  return { trending, isLoading, error };
}

// ─── Facet distribution hook ──────────────────────────────────────────────────

/**
 * Fetches facet distribution for a given search query + filters.
 * Use this to show dynamic "(count)" labels next to each filter option in the sidebar.
 *
 * @example
 * const { facetDistribution, facetStats } = useFacets('watch', { minPrice: 100 });
 * // facetDistribution.category → { "Watches": 12, "Accessories": 3 }
 * // facetStats.price → { min: 150, max: 12000 }
 */
export function useFacets(
  query: string,
  filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    onSale?: boolean;
    tags?: string[];
    colors?: string[];
    sizes?: string[];
  },
  facets = 'category,tags,colors,sizes,materials,storeName,isOnSale,featured'
) {
  const [facetDistribution, setFacetDistribution] = useState<FacetDistribution>({});
  const [facetStats, setFacetStats] = useState<FacetStats>({});
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Debounce to avoid firing on every keystroke
    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const result = await searchAPI.search({
          q: query || '',
          ...filters,
          facets,
          limit: 1, // we only need facets, not the full hit list
        });
        setFacetDistribution(result.facetDistribution ?? {});
        setFacetStats(result.facetStats ?? {});
      } catch {
        // Non-critical — facet counts are a UX enhancement, not a requirement
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query, JSON.stringify(filters), facets]);

  return { facetDistribution, facetStats, isLoading };
}

// ─── Facet value search hook ──────────────────────────────────────────────────

/**
 * Search for values within a single facet attribute.
 * Powers "type to narrow" UX inside filter panels.
 *
 * @example
 * const { hits } = useFacetValueSearch('category', 'elec');
 * // hits → [{ value: 'Electronics', count: 42 }, ...]
 */
export function useFacetValueSearch(facetName: string, facetQuery: string) {
  const [hits, setHits] = useState<FacetHit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!facetName) {
      setHits([]);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchAPI.searchFacetValues(facetName, facetQuery);
        setHits(data);
      } catch {
        setHits([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [facetName, facetQuery]);

  return { hits, isLoading };
}

// ─── Recent searches hook ─────────────────────────────────────────────────────

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentSearches(Array.isArray(parsed) ? parsed : []);
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  const addRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const trimmed = query.trim();
      if (!trimmed) return prev;
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  const removeRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== query);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { recentSearches, addRecentSearch, clearRecentSearches, removeRecentSearch };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function saveRecentSearch(query: string) {
  if (typeof window === 'undefined') return;
  const trimmed = query.trim();
  if (!trimmed) return;
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    const current = stored ? JSON.parse(stored) : [];
    const filtered = current.filter((s: string) => s.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // noop
  }
}
