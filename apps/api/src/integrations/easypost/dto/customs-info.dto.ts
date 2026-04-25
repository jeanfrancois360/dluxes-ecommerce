import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CustomsItemDto {
  @IsString()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  value: number;

  @IsNumber()
  weight: number; // ounces

  @IsOptional()
  @IsString()
  hsTariffNumber?: string;

  @IsOptional()
  @IsString()
  originCountry?: string;
}
