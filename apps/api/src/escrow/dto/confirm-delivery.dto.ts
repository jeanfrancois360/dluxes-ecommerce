import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class ConfirmDeliveryDto {
  @IsString()
  orderId: string;

  @IsString()
  @IsOptional()
  signature?: string;

  @IsArray()
  @IsOptional()
  photos?: string[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class RefundEscrowDto {
  @IsString()
  reason: string;
}
