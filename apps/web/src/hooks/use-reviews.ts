'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Review, ReviewFilters, ReviewListResponse, CreateReviewInput } from '@nextpik/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface UseReviewsOptions extends Omit<ReviewFilters, 'productId'> {}

export function useReviews(productId: string, options: UseReviewsOptions = {}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(options.page || 1);
  const [pageSize] = useState(options.pageSize || 10);
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Omit<ReviewFilters, 'productId'>>({
    sortBy: options.sortBy || 'recent',
    rating: options.rating,
    page,
    pageSize,
  });

  const fetchReviews = useCallback(async () => {
    if (!productId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        productId,
        page: filters.page?.toString() || '1',
        pageSize: pageSize.toString(),
      });

      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.rating) params.append('rating', filters.rating.toString());

      const response = await fetch(`${API_BASE_URL}/reviews?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const result = await response.json();
      // Backend wraps response in { success, data } format
      const data: ReviewListResponse = result.data || result;
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
      setSummary(
        data.summary || {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setIsLoading(false);
    }
  }, [productId, filters, pageSize]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const updateFilters = useCallback((newFilters: Partial<Omit<ReviewFilters, 'productId'>>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const refetch = useCallback(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    total,
    page: filters.page || 1,
    pageSize,
    summary,
    isLoading,
    error,
    updateFilters,
    refetch,
  };
}

export function useCreateReview() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReview = useCallback(async (data: CreateReviewInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      // Step 1: Upload images if any
      let imageUrls: string[] = [];
      if (data.images && data.images.length > 0) {
        const imageFormData = new FormData();
        data.images.forEach((image) => {
          imageFormData.append('images', image);
        });
        imageFormData.append('folder', 'reviews');

        const uploadHeaders: HeadersInit = {};
        if (token) {
          uploadHeaders['Authorization'] = `Bearer ${token}`;
        }

        const uploadResponse = await fetch(`${API_BASE_URL}/upload/images`, {
          method: 'POST',
          credentials: 'include',
          headers: uploadHeaders,
          body: imageFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload images');
        }

        const uploadResult = await uploadResponse.json();
        imageUrls = uploadResult.data.map((file: any) => file.url);
      }

      // Step 2: Create review with image URLs
      const reviewData = {
        productId: data.productId,
        rating: data.rating,
        comment: data.comment,
        ...(data.title && { title: data.title }),
        ...(imageUrls.length > 0 && { images: imageUrls }),
      };

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create review');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create review';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createReview,
    isLoading,
    error,
  };
}

export function useMarkHelpful() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markHelpful = useCallback(async (reviewId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to mark review as helpful');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark review as helpful';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    markHelpful,
    isLoading,
    error,
  };
}

export function useReportReview() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportReview = useCallback(async (reviewId: string, reason?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/report`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to report review');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to report review';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    reportReview,
    isLoading,
    error,
  };
}
