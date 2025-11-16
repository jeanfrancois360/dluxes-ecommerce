import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ProductQueryDto } from './dto/product-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

/**
 * Products Controller
 * Handles all product-related HTTP requests
 */
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Get all products with filtering, sorting, and pagination
   * @route GET /products
   */
  @Get()
  async findAll(@Query() query: ProductQueryDto) {
    try {
      const data = await this.productsService.findAll(query);
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
   * Get featured products
   * @route GET /products/featured
   */
  @Get('featured')
  async getFeatured(@Query('limit') limit?: string) {
    try {
      const data = await this.productsService.getFeatured(
        limit ? parseInt(limit) : 12
      );
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
   * Get new arrival products
   * @route GET /products/new-arrivals
   */
  @Get('new-arrivals')
  async getNewArrivals(@Query('limit') limit?: string) {
    try {
      const data = await this.productsService.getNewArrivals(
        limit ? parseInt(limit) : 12
      );
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
   * Get trending products
   * @route GET /products/trending
   */
  @Get('trending')
  async getTrending(@Query('limit') limit?: string) {
    try {
      const data = await this.productsService.getTrending(
        limit ? parseInt(limit) : 12
      );
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
   * Get products on sale
   * @route GET /products/sale
   */
  @Get('sale')
  async getOnSale(@Query('limit') limit?: string) {
    try {
      const data = await this.productsService.getOnSale(
        limit ? parseInt(limit) : 12
      );
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
   * Get related products
   * @route GET /products/:id/related
   */
  @Get(':id/related')
  async getRelated(@Param('id') id: string, @Query('limit') limit?: string) {
    try {
      const data = await this.productsService.getRelatedProducts(
        id,
        limit ? parseInt(limit) : 8
      );
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
   * Get single product by slug
   * @route GET /products/:slug
   * NOTE: This must be defined AFTER more specific routes (like :id/related) to avoid catching them
   */
  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    try {
      const data = await this.productsService.findBySlug(slug);
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
   * Create new product (Admin only)
   * @route POST /products
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() createProductDto: CreateProductDto) {
    try {
      const data = await this.productsService.create(createProductDto);
      return {
        success: true,
        data,
        message: 'Product created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Update product (Admin only)
   * @route PATCH /products/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto
  ) {
    try {
      const data = await this.productsService.update(id, updateProductDto);
      return {
        success: true,
        data,
        message: 'Product updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Delete product (Admin only)
   * @route DELETE /products/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    try {
      await this.productsService.delete(id);
      return {
        success: true,
        message: 'Product deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Upload product image (Admin only)
   * @route POST /products/upload-image
   */
  @Post('upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    try {
      const data = await this.productsService.uploadImage(file);
      return {
        success: true,
        data,
        message: 'Image uploaded successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }
}
