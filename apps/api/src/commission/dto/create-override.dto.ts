import { IsString, IsEnum, IsNumber, IsOptional, Min, Max, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { CommissionRuleType } from '@prisma/client';

export class CreateOverrideDto {
  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsEnum(CommissionRuleType)
  commissionType: CommissionRuleType;

  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxOrderValue?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validUntil?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOverrideDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validUntil?: Date;
}
