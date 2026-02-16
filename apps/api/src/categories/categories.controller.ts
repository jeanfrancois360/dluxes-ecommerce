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
   * Get all categories (flat list including subcategories)
   * @route GET /categories
   */
  @Get()
  async findAll() {
    try {
      const categories = await this.categoriesService.findAllFlat();

      // Transform _count.products to productCount for frontend compatibility
      const data = categories.map((category) => ({
        ...category,
        productCount: category._count?.products || 0,
      }));

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get navbar categories
   * @route GET /categories/navbar
   */
  @Get('navbar')
  async getNavCategories() {
    const data = await this.categoriesService.findNavCategories();
    return { success: true, data };
  }

  /**
   * Get footer categories
   * @route GET /categories/footer
   */
  @Get('footer')
  async getFooterCategories() {
    const data = await this.categoriesService.findFooterCategories();
    return { success: true, data };
  }

  /**
   * Get homepage categories
   * @route GET /categories/homepage
   */
  @Get('homepage')
  async getHomepageCategories() {
    const data = await this.categoriesService.findHomepageCategories();
    return { success: true, data };
  }

  /**
   * Get featured categories
   * @route GET /categories/featured
   */
  @Get('featured')
  async getFeaturedCategories() {
    const data = await this.categoriesService.findFeatured();
    return { success: true, data };
  }

  /**
   * Get top bar categories
   * @route GET /categories/topbar
   */
  @Get('topbar')
  async getTopBarCategories() {
    const data = await this.categoriesService.findTopBarCategories();
    return { success: true, data };
  }

  /**
   * Get sidebar categories
   * @route GET /categories/sidebar
   */
  @Get('sidebar')
  async getSidebarCategories() {
    const data = await this.categoriesService.findSidebarCategories();
    return { success: true, data };
  }

  /**
   * Get all categories with unlimited depth recursive tree structure
   * @route GET /categories/tree
   */
  @Get('tree')
  async getCategoryTree() {
    try {
      const data = await this.categoriesService.findAllRecursive();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
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
        message: error instanceof Error ? error.message : 'An error occurred',
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
        message: error instanceof Error ? error.message : 'An error occurred',
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
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
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
        message: error instanceof Error ? error.message : 'An error occurred',
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
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Update category visibility (Admin only)
   * @route PATCH /categories/:id/visibility
   */
  @Patch(':id/visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateVisibility(
    @Param('id') id: string,
    @Body()
    dto: {
      showInNavbar?: boolean;
      showInTopBar?: boolean;
      showInSidebar?: boolean;
      showInFooter?: boolean;
      showOnHomepage?: boolean;
      isFeatured?: boolean;
    }
  ) {
    try {
      const data = await this.categoriesService.updateVisibility(id, dto);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Update category priority (Admin only)
   * @route PATCH /categories/:id/priority
   */
  @Patch(':id/priority')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updatePriority(@Param('id') id: string, @Body() body: { priority: number }) {
    try {
      const data = await this.categoriesService.updatePriority(id, body.priority);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Bulk update categories visibility (Admin only)
   * @route PATCH /categories/bulk-visibility
   */
  @Patch('bulk-visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async bulkUpdateVisibility(
    @Body()
    body: {
      updates: Array<{
        id: string;
        visibility: {
          showInNavbar?: boolean;
          showInTopBar?: boolean;
          showInSidebar?: boolean;
          showInFooter?: boolean;
          showOnHomepage?: boolean;
          isFeatured?: boolean;
        };
      }>;
    }
  ) {
    try {
      const data = await this.categoriesService.bulkUpdateVisibility(body.updates);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Reorder categories (Admin only)
   * @route PATCH /categories/reorder
   */
  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async reorder(@Body() body: { categoryIds: string[] }) {
    try {
      const data = await this.categoriesService.reorder(body.categoryIds);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }
}
