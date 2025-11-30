import { IsString, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePayoutDto {
  @IsString()
  sellerId: string;

  @IsString()
  storeId: string;

  @Type(() => Date)
  @IsDate()
  periodStart: Date;

  @Type(() => Date)
  @IsDate()
  periodEnd: Date;

  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
