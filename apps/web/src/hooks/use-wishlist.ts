'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Type definitions (should be in @luxury/shared)
interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  heroImage: string;
  isAvailable?: boolean;
  inventory?: number;
  rating?: number;
  reviewCount?: number;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product: WishlistProduct;
  createdAt: string;
}

interface WishlistResponse {
  items: WishlistItem[];
  total: number;
}

interface WishlistFilters {
  sortBy?: 'recent' | 'priceAsc' | 'priceDesc';
  availability?: 'all' | 'inStock' | 'outOfStock';
}

// Helper to get auth token
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

// Helper to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }

      const responseData = await response.json();

      // Handle API response format: { success, data } or { items, total }
      let wishlistItems: WishlistItem[] = [];

      if (responseData.data) {
        // API returns { success: true, data: [...] }
        wishlistItems = Array.isArray(responseData.data) ? responseData.data : [];
      } else if (responseData.items) {
        // API returns { items: [...], total: number }
        wishlistItems = responseData.items;
      }

      // Transform items to match expected format
      const transformedItems = wishlistItems.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        createdAt: item.createdAt,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          compareAtPrice: item.product.compareAtPrice,
          heroImage: item.product.images?.[0]?.url || item.product.heroImage || '',
          isAvailable: item.product.isAvailable ?? item.product.inventory > 0,
          inventory: item.product.inventory,
          rating: item.product.averageRating || item.product.rating,
          reviewCount: item.product.reviewCount,
        },
      }));

      setItems(transformedItems);
      setTotal(responseData.total ?? transformedItems.length);
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
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
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
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to remove from wishlist');
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return { success: true };
      }

      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
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
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to clear wishlist');
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return { success: true };
      }

      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
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
          headers: getAuthHeaders(),
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
