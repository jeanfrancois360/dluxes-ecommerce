import { IsArray, ValidateNested, IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryTransactionType } from '@prisma/client';

export class InventoryUpdateItem {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsNumber()
  quantity: number;

  @IsEnum(InventoryTransactionType)
  type: InventoryTransactionType;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkInventoryUpdateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryUpdateItem)
  updates: InventoryUpdateItem[];
}
