'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { WishlistItem, WishlistResponse, WishlistFilters } from '@luxury/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function useWishlist(options: WishlistFilters = {}) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<WishlistFilters>(options);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.availability) params.append('availability', filters.availability);

      const response = await fetch(`${API_BASE_URL}/wishlist?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }

      const data: WishlistResponse = await response.json();
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch wishlist');
    } finally {
      setIsLoading(false);
    }
  }, [user, filters]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const updateFilters = useCallback((newFilters: Partial<WishlistFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const refetch = useCallback(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  return {
    items,
    total,
    isLoading,
    error,
    updateFilters,
    refetch,
  };
}

export function useAddToWishlist() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToWishlist = useCallback(async (productId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/wishlist`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add to wishlist');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to wishlist';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    addToWishlist,
    isLoading,
    error,
  };
}

export function useRemoveFromWishlist() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeFromWishlist = useCallback(async (productId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to remove from wishlist');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove from wishlist';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    removeFromWishlist,
    isLoading,
    error,
  };
}

export function useClearWishlist() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearWishlist = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/wishlist/clear`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to clear wishlist');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear wishlist';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    clearWishlist,
    isLoading,
    error,
  };
}

export function useIsInWishlist(productId: string) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkWishlist = async () => {
      if (!user || !productId) {
        setIsInWishlist(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/wishlist/check/${productId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setIsInWishlist(data.isInWishlist);
        }
      } catch (err) {
        console.error('Failed to check wishlist:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkWishlist();
  }, [user, productId]);

  return {
    isInWishlist,
    isLoading,
  };
}

export function useToggleWishlist() {
  const { addToWishlist, isLoading: isAdding } = useAddToWishlist();
  const { removeFromWishlist, isLoading: isRemoving } = useRemoveFromWishlist();

  const toggleWishlist = useCallback(
    async (productId: string, isCurrentlyInWishlist: boolean) => {
      if (isCurrentlyInWishlist) {
        return await removeFromWishlist(productId);
      } else {
        return await addToWishlist(productId);
      }
    },
    [addToWishlist, removeFromWishlist]
  );

  return {
    toggleWishlist,
    isLoading: isAdding || isRemoving,
  };
}
