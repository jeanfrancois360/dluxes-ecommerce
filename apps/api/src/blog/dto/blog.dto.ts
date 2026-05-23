import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsArray,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BlogPostStatus, TranslationStatus } from '@prisma/client';

// ============================================================================
// POST DTOs
// ============================================================================

export class CreatePostDto {
  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class ListPostsQueryDto {
  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class AdminListPostsQueryDto extends ListPostsQueryDto {
  @IsOptional()
  @IsEnum(BlogPostStatus)
  status?: BlogPostStatus;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeDeleted?: boolean;
}

// ============================================================================
// FEATURED PRODUCTS DTOs
// ============================================================================

// ============================================================================
// ENGAGEMENT DTOs
// ============================================================================

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

// ============================================================================
// FEATURED PRODUCTS DTOs
// ============================================================================

export class AttachProductsDto {
  @IsArray()
  @IsString({ each: true })
  productIds!: string[];
}

export class ReorderProductsDto {
  @IsArray()
  @IsString({ each: true })
  productIds!: string[];
}

// ============================================================================
// TRANSLATION DTOs
// ============================================================================

export class UpsertTranslationDto {
  @IsString()
  @MaxLength(10)
  locale!: string;

  @IsString()
  @MaxLength(500)
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoDescription?: string;

  @IsOptional()
  @IsEnum(TranslationStatus)
  translationStatus?: TranslationStatus;

  @IsOptional()
  @IsBoolean()
  isOriginal?: boolean;
}

export class UpdateTranslationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoDescription?: string;

  @IsOptional()
  @IsEnum(TranslationStatus)
  translationStatus?: TranslationStatus;

  @IsOptional()
  @IsBoolean()
  isOriginal?: boolean;
}
