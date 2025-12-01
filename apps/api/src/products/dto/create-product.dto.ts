import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum, Min, IsObject, ValidateNested, Validate } from 'class-validator';
import { ProductStatus, ProductType, PurchaseType } from '@prisma/client';
import { Type } from 'class-transformer';
import { RequiresPriceForInstantConstraint, RequiresInventoryForInstantConstraint } from './validators/product-validation';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional() // Optional for INQUIRY purchase type
  @Validate(RequiresPriceForInstantConstraint)
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  compareAtPrice?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional() // Optional for INQUIRY purchase type
  @Validate(RequiresInventoryForInstantConstraint)
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  inventory?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weight?: number;

  // Product Type & Purchase Model
  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;

  @IsOptional()
  @IsEnum(PurchaseType)
  purchaseType?: PurchaseType;

  @IsOptional()
  @IsBoolean()
  isPreOrder?: boolean;

  @IsOptional()
  @IsBoolean()
  contactRequired?: boolean;

  @IsOptional()
  @IsString()
  heroImage?: string;

  @IsOptional()
  @IsObject()
  gallery?: any; // Array of {type: 'image'|'video'|'360', url: string, thumbnail?: string}

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  badges?: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  displayOrder?: number;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoKeywords?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materials?: string[];
}
