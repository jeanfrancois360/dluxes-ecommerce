import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * Categories Controller
 * Handles all category-related HTTP requests
 */
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Get all categories with hierarchical structure
   * @route GET /categories
   */
  @Get()
  async findAll() {
    try {
      const data = await this.categoriesService.findAll();
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
   * Get category by slug
   * @route GET /categories/:slug
   */
  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    try {
      const data = await this.categoriesService.findBySlug(slug);
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
   * Create new category (Admin only)
   * @route POST /categories
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    try {
      const data = await this.categoriesService.create(createCategoryDto);
      return {
        success: true,
        data,
        message: 'Category created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Update category (Admin only)
   * @route PATCH /categories/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    try {
      const data = await this.categoriesService.update(id, updateCategoryDto);
      return {
        success: true,
        data,
        message: 'Category updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Delete category (Admin only)
   * @route DELETE /categories/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    try {
      await this.categoriesService.delete(id);
      return {
        success: true,
        message: 'Category deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }
}
