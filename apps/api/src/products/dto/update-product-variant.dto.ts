import { PartialType } from '@nestjs/mapped-types';
import { CreateProductVariantDto } from './create-product-variant.dto';

/**
 * Update Product Variant DTO
 * Note: SKU cannot be updated as it's system-generated and read-only
 */
export class UpdateProductVariantDto extends PartialType(CreateProductVariantDto) {}
