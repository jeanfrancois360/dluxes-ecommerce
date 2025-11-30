import { IsOptional, IsString } from 'class-validator';

export class ProcessPayoutDto {
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsString()
  paymentProof?: string;
}
