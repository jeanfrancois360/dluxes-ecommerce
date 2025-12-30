/**
 * Reviews API Client
 *
 * API methods for managing product reviews
 */

import { api } from './client';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment: string;
  images: string[];
  videos: string[];
  isVerified: boolean;
  isApproved: boolean;
  isPinned: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
    images?: Array<{ url: string }>;
  };
}

export interface ReviewsListResponse {
  success: boolean;
  data: {
    reviews: Review[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface MyReviewsResponse {
  success: boolean;
  data: Review[];
}

export interface CreateReviewData {
  productId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}

export interface UpdateReviewData {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface ReviewQueryParams {
  productId?: string;
  rating?: number;
  page?: number;
  pageSize?: number;
}

export const reviewsApi = {
  /**
   * Get reviews for a product
   */
  getProductReviews: (params: ReviewQueryParams) => {
    const queryString = new URLSearchParams();
    if (params.productId) queryString.append('productId', params.productId);
    if (params.rating) queryString.append('rating', params.rating.toString());
    if (params.page) queryString.append('page', params.page.toString());
    if (params.pageSize) queryString.append('pageSize', params.pageSize.toString());

    return api.get<ReviewsListResponse>(`/reviews?${queryString.toString()}`);
  },

  /**
   * Get current user's reviews
   */
  getMyReviews: () => api.get<MyReviewsResponse>('/reviews/my-reviews'),

  /**
   * Create a new review
   */
  createReview: (data: CreateReviewData) =>
    api.post<{ success: boolean; data: Review; message: string }>('/reviews', data),

  /**
   * Update an existing review
   */
  updateReview: (id: string, data: UpdateReviewData) =>
    api.patch<{ success: boolean; data: Review; message: string }>(`/reviews/${id}`, data),

  /**
   * Delete a review
   */
  deleteReview: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/reviews/${id}`),

  /**
   * Mark a review as helpful
   */
  markHelpful: (id: string) =>
    api.post<{ success: boolean; data: Review; message: string }>(`/reviews/${id}/helpful`),

  /**
   * Check if user can review a product (has purchased it)
   */
  canReviewProduct: (productId: string) =>
    api.get<{ success: boolean; data: { canReview: boolean; orderId?: string } }>(
      `/reviews/can-review/${productId}`
    ),
};

export default reviewsApi;
