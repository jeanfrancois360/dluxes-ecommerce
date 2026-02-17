'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api/client';
import { categoriesAPI } from '@/lib/api/categories';
import type { Category } from '@/lib/api/categories';
import { APIError } from '@/lib/api/client';

// SWR configuration for optimal caching
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 300000, // 5 minutes - categories don't change often
  keepPreviousData: true,
  revalidateIfStale: false,
  revalidateOnMount: true,
};

interface UseCategoriesReturn {
  categories: Category[];
  isLoading: boolean;
  error: APIError | null;
  refetch: () => Promise<void>;
}

export function useCategories(includeInactive: boolean = false): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (!includeInactive) {
        params.append('isActive', 'true');
      }
      const response = await api.get<Category[]>(`/categories?${params.toString()}`);
      setCategories(response);
    } catch (err) {
      const apiError =
        err instanceof APIError ? err : new APIError('Failed to fetch categories', 500);
      setError(apiError);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [includeInactive]);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  };
}

// Hook for a single category
interface UseCategoryReturn {
  category: Category | null;
  isLoading: boolean;
  error: APIError | null;
}

export function useCategory(slugOrId: string, bySlug: boolean = true): UseCategoryReturn {
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  useEffect(() => {
    const fetchCategory = async () => {
      if (!slugOrId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const endpoint = bySlug ? `/categories/slug/${slugOrId}` : `/categories/${slugOrId}`;
        const response = await api.get<Category>(endpoint);
        setCategory(response);
      } catch (err) {
        const apiError =
          err instanceof APIError ? err : new APIError('Failed to fetch category', 500);
        setError(apiError);
        setCategory(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [slugOrId, bySlug]);

  return { category, isLoading, error };
}

// New SWR-based hooks for better performance

export function useTopBarCategories(): UseCategoriesReturn {
  const { data, error, isLoading, mutate } = useSWR(
    'categories-topbar',
    () => categoriesAPI.getTopBar(),
    swrConfig
  );

  return {
    categories: data || [],
    isLoading,
    error:
      error instanceof APIError
        ? error
        : error
          ? new APIError('Failed to fetch top bar categories', 500)
          : null,
    refetch: async () => {
      await mutate();
    },
  };
}

export function useSidebarCategories(): UseCategoriesReturn {
  const { data, error, isLoading, mutate } = useSWR(
    'categories-sidebar',
    () => categoriesAPI.getSidebar(),
    swrConfig
  );

  return {
    categories: data || [],
    isLoading,
    error:
      error instanceof APIError
        ? error
        : error
          ? new APIError('Failed to fetch sidebar categories', 500)
          : null,
    refetch: async () => {
      await mutate();
    },
  };
}

export function useNavbarCategories(): UseCategoriesReturn {
  const { data, error, isLoading, mutate } = useSWR(
    'categories-navbar',
    () => categoriesAPI.getNavbar(),
    swrConfig
  );

  return {
    categories: data || [],
    isLoading,
    error:
      error instanceof APIError
        ? error
        : error
          ? new APIError('Failed to fetch navbar categories', 500)
          : null,
    refetch: async () => {
      await mutate();
    },
  };
}

export function useHomepageCategories(): UseCategoriesReturn {
  const { data, error, isLoading, mutate } = useSWR(
    'categories-homepage',
    () => categoriesAPI.getHomepage(),
    swrConfig
  );

  return {
    categories: data || [],
    isLoading,
    error:
      error instanceof APIError
        ? error
        : error
          ? new APIError('Failed to fetch homepage categories', 500)
          : null,
    refetch: async () => {
      await mutate();
    },
  };
}

export function useFeaturedCategories(): UseCategoriesReturn {
  const { data, error, isLoading, mutate } = useSWR(
    'categories-featured',
    () => categoriesAPI.getFeatured(),
    swrConfig
  );

  return {
    categories: data || [],
    isLoading,
    error:
      error instanceof APIError
        ? error
        : error
          ? new APIError('Failed to fetch featured categories', 500)
          : null,
    refetch: async () => {
      await mutate();
    },
  };
}

export function useCategoryTree(): UseCategoriesReturn {
  const { data, error, isLoading, mutate } = useSWR(
    'categories-tree',
    () => categoriesAPI.getTree(),
    swrConfig
  );

  return {
    categories: data || [],
    isLoading,
    error:
      error instanceof APIError
        ? error
        : error
          ? new APIError('Failed to fetch category tree', 500)
          : null,
    refetch: async () => {
      await mutate();
    },
  };
}
