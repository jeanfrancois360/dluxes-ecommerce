import { IsString, IsEnum, IsNumber, IsOptional, Min, Max, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { CommissionRuleType } from '@prisma/client';

export class CreateCommissionRuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(CommissionRuleType)
  type: CommissionRuleType;

  @IsNumber()
  @Min(0)
  @Max(100)
  value: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxOrderValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tier?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validUntil?: Date;
}
