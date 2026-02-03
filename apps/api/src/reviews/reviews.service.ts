import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';

/**
 * Reviews Service
 * Handles all business logic for review operations
 */
@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get reviews with filtering and pagination
   */
  async findAll(query: ReviewQueryDto) {
    const { productId, rating, page = 1, pageSize = 20 } = query;

    const where: any = {
      isApproved: true,
    };

    if (productId) {
      where.productId = productId;
    }

    if (rating) {
      where.rating = rating;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get review by ID
   */
  async findById(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  /**
   * Create new review
   */
  async create(userId: string, createReviewDto: CreateReviewDto) {
    const { productId, rating, title, comment, images, videos } =
      createReviewDto;

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user already reviewed this product
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        productId,
      },
    });

    if (existingReview) {
      throw new ForbiddenException(
        'You have already reviewed this product. Please update your existing review.'
      );
    }

    // Create review
    const review = await this.prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        title,
        comment,
        images: images || [],
        videos: videos || [],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Update product rating
    await this.updateProductRating(productId);

    return review;
  }

  /**
   * Update review (owner only)
   */
  async update(id: string, userId: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.findById(id);

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const { images, videos, ...data } = updateReviewDto;

    const updateData: any = { ...data };

    if (images !== undefined) updateData.images = images;
    if (videos !== undefined) updateData.videos = videos;

    const updatedReview = await this.prisma.review.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Update product rating if rating changed
    if (updateReviewDto.rating !== undefined) {
      await this.updateProductRating(review.productId);
    }

    return updatedReview;
  }

  /**
   * Delete review (owner or admin)
   */
  async delete(id: string, userId: string, isAdmin: boolean = false) {
    const review = await this.findById(id);

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({
      where: { id },
    });

    // Update product rating
    await this.updateProductRating(review.productId);
  }

  /**
   * Mark review as helpful
   */
  async markHelpful(id: string) {
    const review = await this.findById(id);

    return this.prisma.review.update({
      where: { id },
      data: {
        helpfulCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Update review status (Admin only)
   */
  async updateStatus(id: string, isApproved: boolean, isPinned?: boolean) {
    const review = await this.findById(id);

    const updateData: any = { isApproved };

    if (isPinned !== undefined) {
      updateData.isPinned = isPinned;
    }

    return this.prisma.review.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  /**
   * Get all reviews by a specific user
   */
  async findByUser(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              take: 1,
              select: {
                url: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check if user can review a product (must have purchased it in a delivered order)
   */
  async canReviewProduct(userId: string, productId: string) {
    // Check if user already reviewed this product
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        productId,
      },
    });

    if (existingReview) {
      return { canReview: false, reason: 'already_reviewed', reviewId: existingReview.id };
    }

    // Check if user has a delivered order with this product
    const deliveredOrder = await this.prisma.order.findFirst({
      where: {
        userId,
        status: 'DELIVERED',
        items: {
          some: {
            productId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!deliveredOrder) {
      return { canReview: false, reason: 'not_purchased' };
    }

    return { canReview: true, orderId: deliveredOrder.id };
  }

  /**
   * Update product rating based on all reviews
   */
  private async updateProductRating(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: {
        productId,
        isApproved: true,
      },
      select: {
        rating: true,
      },
    });

    if (reviews.length === 0) {
      await this.prisma.product.update({
        where: { id: productId },
        data: {
          rating: null,
          reviewCount: 0,
        },
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = totalRating / reviews.length;

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        rating: avgRating,
        reviewCount: reviews.length,
      },
    });
  }
}
