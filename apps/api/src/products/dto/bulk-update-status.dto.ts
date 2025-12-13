import { IsArray, IsString, IsEnum, ArrayMinSize } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class BulkUpdateStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids: string[];

  @IsEnum(ProductStatus)
  status: ProductStatus;
}
