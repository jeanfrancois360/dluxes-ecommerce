import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';

/**
 * Reviews Controller
 * Handles all review-related HTTP requests
 */
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * Get reviews for a product
   * @route GET /reviews
   */
  @Get()
  async findAll(@Query() query: ReviewQueryDto) {
    try {
      const data = await this.reviewsService.findAll(query);
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
   * Create review
   * @route POST /reviews
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Body() createReviewDto: CreateReviewDto) {
    try {
      const data = await this.reviewsService.create(
        req.user.userId,
        createReviewDto
      );
      return {
        success: true,
        data,
        message: 'Review created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Update review (owner only)
   * @route PATCH /reviews/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateReviewDto: UpdateReviewDto
  ) {
    try {
      const data = await this.reviewsService.update(
        id,
        req.user.userId,
        updateReviewDto
      );
      return {
        success: true,
        data,
        message: 'Review updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Delete review (owner or admin)
   * @route DELETE /reviews/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Request() req) {
    try {
      const isAdmin =
        req.user.role === UserRole.ADMIN ||
        req.user.role === UserRole.SUPER_ADMIN;
      await this.reviewsService.delete(id, req.user.userId, isAdmin);
      return {
        success: true,
        message: 'Review deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Mark review as helpful
   * @route POST /reviews/:id/helpful
   */
  @Post(':id/helpful')
  @UseGuards(JwtAuthGuard)
  async markHelpful(@Param('id') id: string) {
    try {
      const data = await this.reviewsService.markHelpful(id);
      return {
        success: true,
        data,
        message: 'Review marked as helpful',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Update review status (Admin only)
   * @route PATCH /reviews/:id/status
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { isApproved: boolean; isPinned?: boolean }
  ) {
    try {
      const data = await this.reviewsService.updateStatus(
        id,
        body.isApproved,
        body.isPinned
      );
      return {
        success: true,
        data,
        message: 'Review status updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }
}
