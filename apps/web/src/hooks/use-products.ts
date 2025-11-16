'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { productsAPI } from '@/lib/api/products';
import { Product, SearchFilters, SearchResult } from '@/lib/api/types';
import { APIError } from '@/lib/api/client';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  // Memoize filters to prevent infinite loops
  const memoizedFilters = useMemo(() => filters, [
    filters.query,
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.brands?.join(','),
    filters.tags?.join(','),
    filters.inStock,
    filters.onSale,
    filters.rating,
    filters.sortBy,
    filters.page,
    filters.limit,
  ]);

  const fetchProducts = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await productsAPI.getAll(memoizedFilters);
      setProducts(response);
      setMeta({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (err) {
      const apiError = err instanceof APIError ? err : new APIError('Failed to fetch products', 500);
      setError(apiError);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, memoizedFilters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    total: meta.total,
    page: meta.page,
    limit: meta.limit,
    totalPages: meta.totalPages,
    isLoading,
    error,
    refetch: fetchProducts,
  };
}

// Hook for featured products
export function useFeaturedProducts(limit: number = 8) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await productsAPI.getFeatured(limit);
        setProducts(response);
      } catch (err) {
        const apiError = err instanceof APIError ? err : new APIError('Failed to fetch featured products', 500);
        setError(apiError);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatured();
  }, [limit]);

  return { products, isLoading, error };
}

// Hook for new arrivals
export function useNewArrivals(limit: number = 8) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await productsAPI.getNewArrivals(limit);
        setProducts(response);
      } catch (err) {
        const apiError = err instanceof APIError ? err : new APIError('Failed to fetch new arrivals', 500);
        setError(apiError);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNewArrivals();
  }, [limit]);

  return { products, isLoading, error };
}

// Hook for trending products
export function useTrendingProducts(limit: number = 8) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await productsAPI.getTrending(limit);
        setProducts(response);
      } catch (err) {
        const apiError = err instanceof APIError ? err : new APIError('Failed to fetch trending products', 500);
        setError(apiError);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrending();
  }, [limit]);

  return { products, isLoading, error };
}

// Hook for products on sale
export function useOnSaleProducts(limit: number = 8) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  useEffect(() => {
    const fetchOnSale = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await productsAPI.getOnSale(limit);
        setProducts(response);
      } catch (err) {
        const apiError = err instanceof APIError ? err : new APIError('Failed to fetch sale products', 500);
        setError(apiError);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnSale();
  }, [limit]);

  return { products, isLoading, error };
}
