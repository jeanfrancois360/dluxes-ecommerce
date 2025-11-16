import { IsString, IsOptional, IsBoolean, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCollectionDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  heroImage?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
