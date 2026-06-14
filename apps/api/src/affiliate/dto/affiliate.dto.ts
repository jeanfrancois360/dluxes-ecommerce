import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  IsEnum,
  IsUrl,
  IsArray,
  Min,
  Max,
  MaxLength,
  IsPositive,
  IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  AffiliateAdvertiserStatus,
  AffiliateCommissionStatus,
  AffiliateFulfillmentSource,
  TranslationStatus,
} from '@prisma/client';

// ============================================================================
// ADVERTISER DTOs
// ============================================================================

export class CreateAdvertiserDto {
  @IsString()
  awinMerchantId!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsEnum(AffiliateAdvertiserStatus)
  approvalStatus?: AffiliateAdvertiserStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultCommissionRate?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAdvertiserDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsEnum(AffiliateAdvertiserStatus)
  approvalStatus?: AffiliateAdvertiserStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultCommissionRate?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ListAdvertisersQueryDto {
  @IsOptional()
  @IsEnum(AffiliateAdvertiserStatus)
  approvalStatus?: AffiliateAdvertiserStatus;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

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

// ============================================================================
// PRODUCT DTOs
// ============================================================================

export class CreateAffiliateProductDto {
  @IsString()
  slug!: string;

  @IsString()
  advertiserId!: string;

  @IsString()
  awinDeepLink!: string;

  @IsString()
  imageUrl!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryUrls?: string[];

  @IsOptional()
  @IsNumber()
  @IsPositive()
  displayPrice?: number;

  @IsOptional()
  @IsString()
  displayCurrency?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  originalPrice?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productCategoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  // Feed metadata — set by AwinFeedService; read-only for admin API
  @IsOptional()
  @IsEnum(AffiliateFulfillmentSource)
  fulfillmentSource?: AffiliateFulfillmentSource;

  @IsOptional()
  @IsString()
  merchantProductId?: string;

  @IsOptional()
  @IsString()
  feedId?: string;
}

export class UpdateAffiliateProductDto {
  @IsOptional()
  @IsString()
  awinDeepLink?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryUrls?: string[];

  @IsOptional()
  @IsNumber()
  @IsPositive()
  displayPrice?: number;

  @IsOptional()
  @IsString()
  displayCurrency?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  originalPrice?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productCategoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

// ============================================================================
// FEED SYNC DTOs
// ============================================================================

export class TriggerFeedSyncDto {
  /** Awin numeric merchant ID. Omit to sync all advertisers. */
  @IsOptional()
  @IsString()
  awinMerchantId?: string;
}

export class FeedSyncHistoryQueryDto {
  @IsOptional()
  @IsString()
  advertiserId?: string;

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

export class ListProductsQueryDto {
  @IsOptional()
  @IsString()
  advertiserId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @IsString()
  locale?: string;

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

export class AdminListProductsQueryDto extends ListProductsQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeDeleted?: boolean;

  @IsOptional()
  @IsEnum(AffiliateFulfillmentSource)
  fulfillmentSource?: AffiliateFulfillmentSource;
}

// ============================================================================
// TRANSLATION DTOs
// ============================================================================

export class CreateTranslationDto {
  @IsString()
  @MaxLength(10)
  locale!: string;

  @IsString()
  @MaxLength(500)
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  longDescription?: string;

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
  description?: string;

  @IsOptional()
  @IsString()
  longDescription?: string;

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

// ============================================================================
// CLICK LOGGING DTOs
// ============================================================================

export class RecordClickDto {
  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  referrer?: string;
}

// ============================================================================
// COMMISSION DTOs
// ============================================================================

export class SyncCommissionDto {
  @IsString()
  awinTransactionId!: string;

  @IsOptional()
  @IsString()
  affiliateProductId?: string;

  @IsOptional()
  @IsString()
  advertiserId?: string;

  @IsOptional()
  @IsString()
  awinClickRef?: string;

  @IsNumber()
  @IsPositive()
  saleAmount!: number;

  @IsNumber()
  @IsPositive()
  commissionAmount!: number;

  @IsString()
  currency!: string;

  @IsEnum(AffiliateCommissionStatus)
  status!: AffiliateCommissionStatus;

  @IsString()
  transactionDate!: string; // ISO date string

  @IsOptional()
  @IsString()
  validationDate?: string;

  @IsOptional()
  @IsString()
  paymentDate?: string;

  rawPayload!: Record<string, unknown>;
}

export class ListCommissionsQueryDto {
  @IsOptional()
  @IsEnum(AffiliateCommissionStatus)
  status?: AffiliateCommissionStatus;

  @IsOptional()
  @IsString()
  advertiserId?: string;

  @IsOptional()
  @IsString()
  affiliateProductId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

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

// ============================================================================
// AWIN SYNC DTOs (Phase C.4)
// ============================================================================

/**
 * Body for POST /affiliate/admin/commissions/awin-sync
 * Both fields are optional — defaults to last 7 days if omitted.
 */
export class SyncCommissionsRequestDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// ============================================================================
// CLICK ANALYTICS DTOs
// ============================================================================

export class ClickAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  affiliateProductId?: string;

  @IsOptional()
  @IsString()
  advertiserId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

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
  limit?: number = 50;
}
