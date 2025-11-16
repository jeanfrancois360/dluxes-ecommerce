import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';

/**
 * Wishlist Service
 * Handles all business logic for wishlist operations
 */
@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user's wishlist
   */
  async getWishlist(userId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            images: {
              orderBy: { displayOrder: 'asc' },
              take: 2,
            },
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return items;
  }

  /**
   * Add item to wishlist
   */
  async addItem(userId: string, addWishlistItemDto: AddWishlistItemDto) {
    const { productId, notes, priority } = addWishlistItemDto;

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if already in wishlist
    const existingItem = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingItem) {
      throw new ConflictException('Product already in wishlist');
    }

    // Add to wishlist
    const item = await this.prisma.wishlistItem.create({
      data: {
        userId,
        productId,
        notes,
        priority: priority || 0,
      },
      include: {
        product: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            images: {
              orderBy: { displayOrder: 'asc' },
              take: 2,
            },
          },
        },
      },
    });

    // Increment product like count
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        likeCount: {
          increment: 1,
        },
      },
    });

    return item;
  }

  /**
   * Remove item from wishlist
   */
  async removeItem(userId: string, productId: string) {
    const item = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found in wishlist');
    }

    await this.prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    // Decrement product like count
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        likeCount: {
          decrement: 1,
        },
      },
    });
  }

  /**
   * Clear wishlist
   */
  async clearWishlist(userId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      select: { productId: true },
    });

    // Delete all items
    await this.prisma.wishlistItem.deleteMany({
      where: { userId },
    });

    // Decrement like counts
    for (const item of items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
      });
    }
  }

  /**
   * Update wishlist item
   */
  async updateItem(
    userId: string,
    productId: string,
    updates: { notes?: string; priority?: number }
  ) {
    const item = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found in wishlist');
    }

    return this.prisma.wishlistItem.update({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      data: updates,
      include: {
        product: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            images: {
              orderBy: { displayOrder: 'asc' },
              take: 2,
            },
          },
        },
      },
    });
  }
}
