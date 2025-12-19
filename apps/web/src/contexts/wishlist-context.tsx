'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Type definitions
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

interface WishlistContextType {
  items: WishlistItem[];
  total: number;
  isLoading: boolean;
  error: string | null;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

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

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch wishlist from API
  const refreshWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/wishlist`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }

      const responseData = await response.json();

      // Handle API response format
      let wishlistItems: WishlistItem[] = [];

      if (responseData.data) {
        wishlistItems = Array.isArray(responseData.data) ? responseData.data : [];
      } else if (responseData.items) {
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
      setTotal(transformedItems.length);

      // Sync to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('wishlist_items', JSON.stringify(transformedItems));
        localStorage.setItem('wishlist_total', transformedItems.length.toString());
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch wishlist');

      // Load from localStorage as fallback
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('wishlist_items');
        if (stored) {
          try {
            const parsedItems = JSON.parse(stored);
            setItems(parsedItems);
            setTotal(parsedItems.length);
          } catch (e) {
            console.error('Error parsing stored wishlist:', e);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Add to wishlist with optimistic update
  const addToWishlist = useCallback(async (productId: string) => {
    if (!user) {
      throw new Error('Please log in to add items to your wishlist');
    }

    try {
      setIsLoading(true);
      setError(null);

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

      // Refresh to get the updated wishlist with full product data
      await refreshWishlist();
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to add to wishlist');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, refreshWishlist]);

  // Remove from wishlist with optimistic update
  const removeFromWishlist = useCallback(async (productId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Optimistic update
      setItems((prev) => {
        const updated = prev.filter((item) => item.productId !== productId);
        setTotal(updated.length);

        // Sync to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('wishlist_items', JSON.stringify(updated));
          localStorage.setItem('wishlist_total', updated.length.toString());
        }

        return updated;
      });

      const response = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to remove from wishlist');
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove from wishlist');
      // Revert optimistic update by refreshing
      await refreshWishlist();
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshWishlist]);

  // Clear wishlist
  const clearWishlist = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Optimistic update
      setItems([]);
      setTotal(0);

      const response = await fetch(`${API_BASE_URL}/wishlist/clear`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to clear wishlist');
      }

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wishlist_items');
        localStorage.removeItem('wishlist_total');
      }
    } catch (err) {
      console.error('Error clearing wishlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear wishlist');
      // Revert optimistic update
      await refreshWishlist();
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshWishlist]);

  // Check if product is in wishlist
  const isInWishlist = useCallback((productId: string) => {
    return items.some((item) => item.productId === productId);
  }, [items]);

  // Load wishlist on mount and when user changes
  useEffect(() => {
    // Load from localStorage immediately for instant display
    if (typeof window !== 'undefined' && user) {
      const stored = localStorage.getItem('wishlist_items');
      const storedTotal = localStorage.getItem('wishlist_total');
      if (stored) {
        try {
          setItems(JSON.parse(stored));
          setTotal(storedTotal ? parseInt(storedTotal) : JSON.parse(stored).length);
        } catch (e) {
          console.error('Error parsing stored wishlist:', e);
        }
      }
    }

    // Then fetch fresh data from API
    refreshWishlist();
  }, [user, refreshWishlist]);

  const value: WishlistContextType = {
    items,
    total,
    isLoading,
    error,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
    refreshWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
