import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for calculating order totals before checkout
 * SAFE: Read-only operation, doesn't create any records
 */

class CartItemDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;
}

export class CalculateTotalsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @IsString()
  shippingAddressId: string;

  @IsOptional()
  @IsEnum(['standard', 'express', 'overnight'])
  shippingMethod?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  couponCode?: string; // For future coupon feature
}

/**
 * Response interface for calculate-totals endpoint
 */
export interface OrderCalculationResponse {
  subtotal: number;
  shipping: {
    method: string;
    name: string;
    price: number;
    estimatedDays: number;
    carrier?: string;
  };
  shippingOptions: Array<{
    id: string;
    name: string;
    price: number;
    estimatedDays: number;
    carrier?: string;
  }>;
  tax: {
    amount: number;
    rate: number;
    jurisdiction: string;
    breakdown?: {
      state?: number;
      county?: number;
      city?: number;
    };
  };
  discount: number;
  coupon?: {
    code: string;
    discount: number;
    type: 'PERCENTAGE' | 'FIXED';
  } | null;
  total: number;
  currency: string;
  breakdown: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
  };
  warnings?: string[];
}
