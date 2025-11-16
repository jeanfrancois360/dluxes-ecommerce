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
import { CollectionsService } from './collections.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

/**
 * Collections Controller
 * Handles all collection-related HTTP requests
 */
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  /**
   * Get all collections
   * @route GET /collections
   */
  @Get()
  async findAll() {
    try {
      const data = await this.collectionsService.findAll();
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
   * Get collection by slug
   * @route GET /collections/:slug
   */
  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    try {
      const data = await this.collectionsService.findBySlug(slug);
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
   * Create new collection (Admin only)
   * @route POST /collections
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() createCollectionDto: CreateCollectionDto) {
    try {
      const data = await this.collectionsService.create(createCollectionDto);
      return {
        success: true,
        data,
        message: 'Collection created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Update collection (Admin only)
   * @route PATCH /collections/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateCollectionDto: UpdateCollectionDto
  ) {
    try {
      const data = await this.collectionsService.update(id, updateCollectionDto);
      return {
        success: true,
        data,
        message: 'Collection updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Delete collection (Admin only)
   * @route DELETE /collections/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    try {
      await this.collectionsService.delete(id);
      return {
        success: true,
        message: 'Collection deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }
}
