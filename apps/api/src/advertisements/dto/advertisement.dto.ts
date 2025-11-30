import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsUUID, IsDateString, Min } from 'class-validator';
import { AdPlacement, AdPricingModel, AdStatus } from '@prisma/client';

export class CreateAdvertisementDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  imageUrl: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  @IsOptional()
  linkUrl?: string;

  @IsString()
  @IsOptional()
  linkText?: string;

  @IsEnum(AdPlacement)
  placement: AdPlacement;

  @IsEnum(AdPricingModel)
  pricingModel: AdPricingModel;

  @IsNumber()
  @Min(0)
  price: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priority?: number;

  @IsString()
  @IsOptional()
  targetAudience?: string;
}

export class UpdateAdvertisementDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  @IsOptional()
  linkUrl?: string;

  @IsString()
  @IsOptional()
  linkText?: string;

  @IsEnum(AdPlacement)
  @IsOptional()
  placement?: AdPlacement;

  @IsEnum(AdPricingModel)
  @IsOptional()
  pricingModel?: AdPricingModel;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priority?: number;

  @IsString()
  @IsOptional()
  targetAudience?: string;

  @IsEnum(AdStatus)
  @IsOptional()
  status?: AdStatus;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ApproveAdvertisementDto {
  @IsBoolean()
  approved: boolean;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class RecordAdEventDto {
  @IsString()
  eventType: 'IMPRESSION' | 'CLICK' | 'CONVERSION';

  @IsString()
  @IsOptional()
  page?: string;
}
