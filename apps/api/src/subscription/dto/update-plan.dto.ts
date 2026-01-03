import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsOptional,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { SubscriptionTier } from '@prisma/client';

export class UpdatePlanDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  yearlyPrice?: number;

  @IsNumber()
  @IsOptional()
  maxActiveListings?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyCredits?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  featuredSlotsPerMonth?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  listingDurationDays?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedProductTypes?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}
