import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { CategoryType } from '@prisma/client';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Category Type & Settings
  @IsOptional()
  @IsEnum(CategoryType)
  categoryType?: CategoryType;

  @IsOptional()
  @IsObject()
  typeSettings?: Record<string, any>; // Type-specific configuration
}
