import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';

/**
 * Wishlist Controller
 * Handles all wishlist-related HTTP requests
 */
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  /**
   * Get user's wishlist
   * @route GET /wishlist
   */
  @Get()
  async getWishlist(@Request() req) {
    try {
      const data = await this.wishlistService.getWishlist(req.user.userId);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Add item to wishlist
   * @route POST /wishlist
   */
  @Post()
  async addItem(@Request() req, @Body() addWishlistItemDto: AddWishlistItemDto) {
    try {
      const data = await this.wishlistService.addItem(
        req.user.userId,
        addWishlistItemDto
      );
      return {
        success: true,
        data,
        message: 'Item added to wishlist',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Remove item from wishlist
   * @route DELETE /wishlist/:productId
   */
  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItem(@Request() req, @Param('productId') productId: string) {
    try {
      await this.wishlistService.removeItem(req.user.userId, productId);
      return {
        success: true,
        message: 'Item removed from wishlist',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Clear wishlist
   * @route DELETE /wishlist
   */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearWishlist(@Request() req) {
    try {
      await this.wishlistService.clearWishlist(req.user.userId);
      return {
        success: true,
        message: 'Wishlist cleared',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }
}
