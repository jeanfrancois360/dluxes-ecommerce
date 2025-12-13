import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { InventoryTransactionType } from '@prisma/client';

export class AdjustInventoryDto {
  @IsNumber()
  quantity: number;

  @IsEnum(InventoryTransactionType)
  type: InventoryTransactionType;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
