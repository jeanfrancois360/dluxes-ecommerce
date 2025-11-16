import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsNumber()
  @Min(0.50) // Stripe minimum
  amount: number;

  @IsString()
  currency: string = 'usd';

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  customerEmail?: string;
}
