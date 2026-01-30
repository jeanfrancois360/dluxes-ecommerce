import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsNumber()
  @Min(0.50) // Stripe minimum
  amount: number;

  @IsString()
  currency: string; // Currency must be provided (no default to prevent mismatches)

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  customerEmail?: string;
}
