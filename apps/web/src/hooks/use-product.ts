'use client';

import { useState, useEffect } from 'react';
import { productsAPI } from '@/lib/api/products';
import { Product } from '@/lib/api/types';
import { APIError } from '@/lib/api/client';

interface UseProductReturn {
  product: Product | null;
  isLoading: boolean;
  error: APIError | null;
  refetch: () => Promise<void>;
}

export function useProduct(slugOrId: string, bySlug: boolean = true): UseProductReturn {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  const fetchProduct = async () => {
    if (!slugOrId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = bySlug
        ? await productsAPI.getBySlug(slugOrId)
        : await productsAPI.getById(slugOrId);
      setProduct(response);
    } catch (err) {
      const apiError = err instanceof APIError ? err : new APIError('Failed to fetch product', 500);
      setError(apiError);
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [slugOrId, bySlug]);

  return {
    product,
    isLoading,
    error,
    refetch: fetchProduct,
  };
}

// Hook for related products
interface UseRelatedProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: APIError | null;
}

export function useRelatedProducts(productId: string, limit: number = 4): UseRelatedProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!productId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await productsAPI.getRelated(productId, limit);
        setProducts(response);
      } catch (err) {
        const apiError = err instanceof APIError ? err : new APIError('Failed to fetch related products', 500);
        setError(apiError);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelated();
  }, [productId, limit]);

  return { products, isLoading, error };
}
