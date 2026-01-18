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
import { ProductInquiryDto } from './dto/product-inquiry.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { BulkCreateVariantsDto } from './dto/bulk-create-variants.dto';
import { BulkDeleteProductsDto } from './dto/bulk-delete-products.dto';
import { BulkUpdateStatusDto } from './dto/bulk-update-status.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { BulkInventoryUpdateDto } from './dto/bulk-inventory.dto';
import { InventoryService } from './inventory.service';

/**
 * Products Controller
 * Handles all product-related HTTP requests
 */
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly inventoryService: InventoryService,
  ) {}

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
   * Get product by ID (for admin use)
   * @route GET /products/id/:id
   * NOTE: This must come BEFORE :slug route to avoid being caught by it
   */
  @Get('id/:id')
  async findById(@Param('id') id: string) {
    const data = await this.productsService.findById(id);
    return {
      success: true,
      data,
    };
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
   * NOTE: This must be defined AFTER more specific routes (like id/:id and :id/related) to avoid catching them
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
   * Create new product (Admin, Seller)
   * @route POST /products
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SELLER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProductDto: CreateProductDto) {
    const data = await this.productsService.create(createProductDto);
    return {
      success: true,
      data,
      message: 'Product created successfully',
    };
  }

  /**
   * Update product (Admin, Seller)
   * @route PATCH /products/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SELLER)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto
  ) {
    const data = await this.productsService.update(id, updateProductDto);
    return {
      success: true,
      data,
      message: 'Product updated successfully',
    };
  }

  /**
   * Add images to product (Admin, Seller)
   * @route POST /products/:id/images
   */
  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SELLER)
  async addImages(
    @Param('id') id: string,
    @Body() body: { images: string[] }
  ) {
    const data = await this.productsService.addProductImages(id, body.images);
    return {
      success: true,
      data,
      message: 'Images added successfully',
    };
  }

  /**
   * Remove product image (Admin, Seller)
   * @route DELETE /products/:id/images/:imageId
   */
  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SELLER)
  async removeImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string
  ) {
    const data = await this.productsService.removeProductImage(id, imageId);
    return {
      success: true,
      data,
      message: 'Image removed successfully',
    };
  }

  /**
   * Reorder product images (Admin, Seller)
   * @route PATCH /products/:id/images/reorder
   */
  @Patch(':id/images/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SELLER)
  async reorderImages(
    @Param('id') id: string,
    @Body() body: { imageOrders: Array<{ id: string; order: number }> }
  ) {
    const data = await this.productsService.reorderProductImages(id, body.imageOrders);
    return {
      success: true,
      data,
      message: 'Images reordered successfully',
    };
  }

  /**
   * Delete product (Admin, Seller)
   * @route DELETE /products/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SELLER)
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
   * Bulk delete products (Admin only)
   * @route POST /products/bulk-delete
   */
  @Post('bulk-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async bulkDelete(@Body() dto: BulkDeleteProductsDto) {
    try {
      const result = await this.productsService.bulkDeleteProducts(dto.ids);
      return {
        success: result.success,
        data: result,
        message: result.success
          ? `${result.deleted} product(s) deleted successfully`
          : `${result.deleted} product(s) deleted, ${result.failed.length} failed`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Bulk update product status (Admin only)
   * @route POST /products/bulk-update-status
   */
  @Post('bulk-update-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async bulkUpdateStatus(@Body() dto: BulkUpdateStatusDto) {
    try {
      const result = await this.productsService.bulkUpdateStatus(dto.ids, dto.status);
      return {
        success: result.success,
        data: result,
        message: result.success
          ? `${result.updated} product(s) updated successfully`
          : `${result.updated} product(s) updated, ${result.failed.length} failed`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Upload product image (Admin, Seller)
   * @route POST /products/upload-image
   */
  @Post('upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SELLER)
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

  /**
   * Submit product inquiry (Public endpoint)
   * Allows customers to inquire about products (especially INQUIRY type products)
   * @route POST /products/:id/inquiry
   */
  @Post(':id/inquiry')
  @HttpCode(HttpStatus.OK)
  async submitInquiry(
    @Param('id') productId: string,
    @Body() inquiryDto: ProductInquiryDto,
  ) {
    try {
      const data = await this.productsService.submitInquiry(productId, inquiryDto);
      return {
        success: true,
        data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  // ==================== PRODUCT VARIANT ENDPOINTS ====================

  /**
   * Get all variants for a product
   * @route GET /products/:productId/variants
   */
  @Get(':productId/variants')
  async getProductVariants(@Param('productId') productId: string) {
    try {
      const data = await this.productsService.getProductVariants(productId);
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
   * Get a specific variant by ID
   * @route GET /products/variants/:variantId
   */
  @Get('variants/:variantId')
  async getVariantById(@Param('variantId') variantId: string) {
    try {
      const data = await this.productsService.getVariantById(variantId);
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
   * Create a new variant for a product (Admin/Seller only)
   * @route POST /products/:productId/variants
   */
  @Post(':productId/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SELLER)
  async createVariant(
    @Param('productId') productId: string,
    @Body() dto: CreateProductVariantDto,
  ) {
    try {
      const data = await this.productsService.createVariant(productId, dto);
      return {
        success: true,
        data,
        message: 'Variant created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Create multiple variants in bulk (Admin/Seller only)
   * @route POST /products/:productId/variants/bulk
   */
  @Post(':productId/variants/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SELLER)
  async bulkCreateVariants(
    @Param('productId') productId: string,
    @Body() dto: BulkCreateVariantsDto,
  ) {
    try {
      const data = await this.productsService.bulkCreateVariants(productId, dto.variants);
      return {
        success: true,
        data,
        message: `${data.length} variants created successfully`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Update a product variant (Admin/Seller only)
   * @route PATCH /products/variants/:variantId
   */
  @Patch('variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SELLER)
  async updateVariant(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    try {
      const data = await this.productsService.updateVariant(variantId, dto);
      return {
        success: true,
        data,
        message: 'Variant updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Delete a product variant (Admin/Seller only)
   * @route DELETE /products/variants/:variantId
   */
  @Delete('variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SELLER)
  @HttpCode(HttpStatus.OK)
  async deleteVariant(@Param('variantId') variantId: string) {
    try {
      const data = await this.productsService.deleteVariant(variantId);
      return {
        success: true,
        data,
        message: 'Variant deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Reorder product variants (Admin/Seller only)
   * @route PATCH /products/:productId/variants/reorder
   */
  @Patch(':productId/variants/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SELLER)
  async reorderVariants(
    @Param('productId') productId: string,
    @Body() body: { variantOrders: Array<{ id: string; order: number }> },
  ) {
    try {
      const data = await this.productsService.reorderVariants(productId, body.variantOrders);
      return {
        success: true,
        data,
        message: 'Variants reordered successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  // ============================================================================
  // INVENTORY MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * Adjust product inventory (Admin only)
   * @route PATCH /products/:id/inventory
   */
  @Patch(':id/inventory')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async adjustProductInventory(
    @Param('id') id: string,
    @Body() dto: AdjustInventoryDto,
  ) {
    const data = await this.inventoryService.adjustProductInventory(
      id,
      dto.quantity,
      dto.type,
      undefined, // userId can be extracted from request if needed
      dto.reason,
      dto.notes,
    );
    return {
      success: true,
      data,
      message: 'Inventory adjusted successfully',
    };
  }

  /**
   * Adjust variant inventory (Admin only)
   * @route PATCH /products/:productId/variants/:variantId/inventory
   */
  @Patch(':productId/variants/:variantId/inventory')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async adjustVariantInventory(
    @Param('variantId') variantId: string,
    @Body() dto: AdjustInventoryDto,
  ) {
    const data = await this.inventoryService.adjustVariantInventory(
      variantId,
      dto.quantity,
      dto.type,
      undefined,
      dto.reason,
      dto.notes,
    );
    return {
      success: true,
      data,
      message: 'Variant inventory adjusted successfully',
    };
  }

  /**
   * Get product inventory transactions (Admin only)
   * @route GET /products/:id/inventory/transactions
   */
  @Get(':id/inventory/transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getProductInventoryTransactions(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const data = await this.inventoryService.getProductTransactions(
      id,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
    return {
      success: true,
      data,
    };
  }

  /**
   * Get low stock products (Admin only)
   * @route GET /products/inventory/low-stock
   */
  @Get('inventory/low-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getLowStockProducts(@Query('threshold') threshold?: string) {
    const data = await this.inventoryService.getLowStockProducts(
      threshold ? parseInt(threshold) : 10,
    );
    return {
      success: true,
      data,
    };
  }

  /**
   * Get out of stock products (Admin only)
   * @route GET /products/inventory/out-of-stock
   */
  @Get('inventory/out-of-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getOutOfStockProducts() {
    const data = await this.inventoryService.getOutOfStockProducts();
    return {
      success: true,
      data,
    };
  }

  /**
   * Get inventory summary (Admin only)
   * @route GET /products/inventory/summary
   */
  @Get('inventory/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getInventorySummary() {
    const data = await this.inventoryService.getInventorySummary();
    return {
      success: true,
      data,
    };
  }

  /**
   * Bulk update inventory (Admin only)
   * @route POST /products/inventory/bulk-update
   */
  @Post('inventory/bulk-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async bulkUpdateInventory(@Body() dto: BulkInventoryUpdateDto) {
    const data = await this.inventoryService.bulkUpdateInventory(dto.updates);
    return {
      success: true,
      data,
      message: 'Bulk inventory update completed',
    };
  }

  /**
   * Sync product inventory from variants (Admin only)
   * @route POST /products/:id/inventory/sync
   */
  @Post(':id/inventory/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async syncProductInventory(@Param('id') id: string) {
    const data = await this.inventoryService.syncProductInventoryFromVariants(id);
    return {
      success: true,
      data,
      message: 'Product inventory synced with variants',
    };
  }
}
