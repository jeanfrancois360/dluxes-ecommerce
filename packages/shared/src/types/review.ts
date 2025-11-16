import { z } from 'zod';

/**
 * Review-related types and schemas
 */

export const ReviewSchema = z.object({
  id: z.string(),
  productId: z.string(),
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().url().optional(),
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().min(10).max(2000),
  images: z.array(z.string().url()).max(5).default([]),
  isVerifiedPurchase: z.boolean().default(false),
  helpfulCount: z.number().int().nonnegative().default(0),
  isHelpful: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Review = z.infer<typeof ReviewSchema>;

export const CreateReviewSchema = z.object({
  productId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(2000, 'Review must be less than 2000 characters'),
  images: z.array(z.instanceof(File)).max(5, 'Maximum 5 images allowed').optional(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

export const ReviewSummarySchema = z.object({
  averageRating: z.number().min(0).max(5),
  totalReviews: z.number().int().nonnegative(),
  ratingDistribution: z.object({
    5: z.number().int().nonnegative(),
    4: z.number().int().nonnegative(),
    3: z.number().int().nonnegative(),
    2: z.number().int().nonnegative(),
    1: z.number().int().nonnegative(),
  }),
});

export type ReviewSummary = z.infer<typeof ReviewSummarySchema>;

export interface ReviewFilters {
  productId: string;
  rating?: number;
  sortBy?: 'recent' | 'highest' | 'lowest' | 'helpful';
  page?: number;
  pageSize?: number;
}

export interface ReviewListResponse {
  reviews: Review[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: ReviewSummary;
}
