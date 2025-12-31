import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus, ProductType, PurchaseType } from '@prisma/client';

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  brands?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  featured?: boolean;

  @IsOptional()
  @IsString()
  colors?: string;

  @IsOptional()
  @IsString()
  sizes?: string;

  @IsOptional()
  @IsString()
  materials?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  inStock?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  onSale?: boolean;

  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;

  @IsOptional()
  @IsEnum(PurchaseType)
  purchaseType?: PurchaseType;

  @IsOptional()
  @IsString()
  storeId?: string;
}
