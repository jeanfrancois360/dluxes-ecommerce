import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
  IsBoolean,
  Min,
  IsNotEmpty,
  MaxLength,
  IsInt,
} from 'class-validator';

export class CreateProductVariantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  compareAtPrice?: number;

  @IsInt()
  @Min(0)
  inventory: number;

  @IsObject()
  @IsNotEmpty()
  attributes: Record<string, string>; // { size: 'M', color: 'Black', material: 'Cotton' }

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  colorHex?: string; // #000000

  @IsString()
  @IsOptional()
  @MaxLength(50)
  colorName?: string;

  @IsObject()
  @IsOptional()
  sizeChart?: any;

  @IsInt()
  @IsOptional()
  @Min(0)
  displayOrder?: number;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsInt()
  @IsOptional()
  @Min(1)
  lowStockThreshold?: number;
}
