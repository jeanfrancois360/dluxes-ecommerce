'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { Category } from '@/lib/api/types';
import { APIError } from '@/lib/api/client';

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
      const apiError = err instanceof APIError ? err : new APIError('Failed to fetch categories', 500);
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
        const apiError = err instanceof APIError ? err : new APIError('Failed to fetch category', 500);
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
