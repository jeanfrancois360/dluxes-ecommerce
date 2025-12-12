'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { productsAPI } from '@/lib/api/products';
import { Product, SearchFilters, SearchResult } from '@/lib/api/types';
import { APIError } from '@/lib/api/client';

// SWR configuration for optimal caching
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000, // Dedupe requests within 1 minute
  keepPreviousData: true,
  revalidateIfStale: false,
  revalidateOnMount: true,
  focusThrottleInterval: 5000,
};

interface UseProductsOptions extends SearchFilters {
  enabled?: boolean;
}

interface UseProductsReturn {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  error: APIError | null;
  refetch: () => Promise<void>;
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const { enabled = true, ...filters } = options;

  // Create a stable cache key from filters
  const cacheKey = useMemo(() => {
    if (!enabled) return null;
    return ['products', JSON.stringify(filters)];
  }, [enabled, filters]);

  const { data, error, isLoading, mutate } = useSWR(
    cacheKey,
    async () => {
      const response = await productsAPI.getAll(filters);
      return response;
    },
    {
      ...swrConfig,
      revalidateIfStale: true,
    }
  );

  return {
    products: data?.products || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.pageSize || filters.limit || 12,
    totalPages: data?.totalPages || 0,
    isLoading,
    error: error instanceof APIError ? error : error ? new APIError('Failed to fetch products', 500) : null,
    refetch: async () => { await mutate(); },
  };
}

// Hook for featured products with SWR caching
export function useFeaturedProducts(limit: number = 8) {
  const { data, error, isLoading } = useSWR(
    ['products', 'featured', limit],
    () => productsAPI.getFeatured(limit),
    swrConfig
  );

  return {
    products: data || [],
    isLoading,
    error: error instanceof APIError ? error : error ? new APIError('Failed to fetch featured products', 500) : null,
  };
}

// Hook for new arrivals with SWR caching
export function useNewArrivals(limit: number = 8) {
  const { data, error, isLoading } = useSWR(
    ['products', 'new-arrivals', limit],
    () => productsAPI.getNewArrivals(limit),
    swrConfig
  );

  return {
    products: data || [],
    isLoading,
    error: error instanceof APIError ? error : error ? new APIError('Failed to fetch new arrivals', 500) : null,
  };
}

// Hook for trending products with SWR caching
export function useTrendingProducts(limit: number = 8) {
  const { data, error, isLoading } = useSWR(
    ['products', 'trending', limit],
    () => productsAPI.getTrending(limit),
    swrConfig
  );

  return {
    products: data || [],
    isLoading,
    error: error instanceof APIError ? error : error ? new APIError('Failed to fetch trending products', 500) : null,
  };
}

// Hook for products on sale with SWR caching
export function useOnSaleProducts(limit: number = 8) {
  const { data, error, isLoading } = useSWR(
    ['products', 'sale', limit],
    () => productsAPI.getOnSale(limit),
    swrConfig
  );

  return {
    products: data || [],
    isLoading,
    error: error instanceof APIError ? error : error ? new APIError('Failed to fetch sale products', 500) : null,
  };
}

// Combined hook for homepage - fetches all sections in parallel with shared cache
export function useHomepageProducts(limit: number = 8) {
  const featured = useFeaturedProducts(limit);
  const newArrivals = useNewArrivals(limit);
  const trending = useTrendingProducts(limit);
  const onSale = useOnSaleProducts(limit);

  return {
    featured,
    newArrivals,
    trending,
    onSale,
    isLoading: featured.isLoading || newArrivals.isLoading || trending.isLoading || onSale.isLoading,
  };
}
