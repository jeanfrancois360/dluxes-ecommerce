import { IsString, IsOptional } from 'class-validator';

export class SubmitPodOrderDto {
  @IsString()
  orderId: string;

  @IsString()
  orderItemId: string;

  @IsOptional()
  @IsString()
  shippingMethod?: string;
}

export class CancelPodOrderDto {
  @IsString()
  podOrderId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
