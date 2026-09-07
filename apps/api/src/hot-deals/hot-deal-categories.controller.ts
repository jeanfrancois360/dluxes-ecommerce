import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HotDealCategoriesService } from './hot-deal-categories.service';
import { HotDealsService } from './hot-deals.service';
import {
  CreateHotDealCategoryDto,
  UpdateHotDealCategoryDto,
  ReorderCategoriesDto,
} from './dto/hot-deal-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('hot-deals/categories')
export class HotDealCategoriesController {
  constructor(
    private readonly categoriesService: HotDealCategoriesService,
    private readonly hotDealsService: HotDealsService
  ) {}

  /** Public — active categories for forms/filters */
  @Get()
  async getActiveCategories() {
    const data = await this.categoriesService.findActive();
    return { success: true, data };
  }

  /** Admin — all categories including inactive */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAllCategories() {
    const data = await this.categoriesService.findAll();
    return { success: true, data };
  }

  /** Public — category deal counts for filters */
  @Get('stats')
  async getCategoryStats() {
    const data = await this.hotDealsService.getCategoryStats();
    return { success: true, data };
  }

  /** Admin — create category */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateHotDealCategoryDto) {
    const data = await this.categoriesService.create(dto);
    return { success: true, data };
  }

  /** Admin — update category */
  @Patch(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(@Param('slug') slug: string, @Body() dto: UpdateHotDealCategoryDto) {
    const data = await this.categoriesService.update(slug, dto);
    return { success: true, data };
  }

  /** Admin — delete category (only if no hot deals use it) */
  @Delete(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async delete(@Param('slug') slug: string) {
    await this.categoriesService.delete(slug);
    return { success: true, message: 'Category deleted' };
  }

  /** Admin — bulk reorder */
  @Post('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async reorder(@Body() dto: ReorderCategoriesDto) {
    const data = await this.categoriesService.reorder(dto.slugs);
    return { success: true, data };
  }
}
