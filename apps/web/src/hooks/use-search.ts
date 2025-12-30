'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchAPI, AutocompleteResult, TrendingSearch } from '@/lib/api/search';
import { Product, SearchResult } from '@/lib/api/types';

// Local storage key for recent searches
const RECENT_SEARCHES_KEY = 'luxury_recent_searches';
const MAX_RECENT_SEARCHES = 5;

interface UseSearchOptions {
  enabled?: boolean;
  debounceMs?: number;
}

interface UseSearchResult {
  data: SearchResult<Product> | null;
  isLoading: boolean;
  error: Error | null;
  search: (params: any) => Promise<void>;
}

// Main search hook with filters and pagination
export function useSearch(initialParams?: any, options: UseSearchOptions = {}): UseSearchResult {
  const { enabled = true, debounceMs = 0 } = options;
  const [data, setData] = useState<SearchResult<Product> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(async (params: any) => {
    if (!enabled || !params.q || params.q.length < 2) {
      setData(null);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await searchAPI.search(params);
      setData(result);

      // Track search analytics
      if (result.products.length > 0) {
        searchAPI.trackSearch(params.q, result.total);
      }

      // Save to recent searches
      saveRecentSearch(params.q);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  return { data, isLoading, error, search };
}

// Autocomplete hook with debouncing
export function useAutocomplete(query: string, debounceMs: number = 300) {
  const [results, setResults] = useState<AutocompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset if query is too short
    if (!query || query.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // Set loading state immediately for better UX
    setIsLoading(true);

    // Debounce the API call
    timeoutRef.current = setTimeout(async () => {
      try {
        abortControllerRef.current = new AbortController();
        const { data } = await searchAPI.autocomplete(query, 8);
        setResults(data);
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, debounceMs]);

  return { results, isLoading, error };
}

// Trending searches hook
export function useTrendingSearches() {
  const [trending, setTrending] = useState<TrendingSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const { data } = await searchAPI.getTrending(10);
        setTrending(data);
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

// Recent searches hook (localStorage-based)
export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    // Load from localStorage on mount
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

      // Remove if already exists
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());

      // Add to beginning and limit to MAX_RECENT_SEARCHES
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);

      // Save to localStorage
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

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  };
}

// Helper function to save recent search
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
  } catch (error) {
    console.error('Failed to save recent search:', error);
  }
}
