import { IsString, IsNumber, IsBoolean, IsOptional, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCurrencyRateDto {
  @IsString()
  currencyCode: string;

  @IsString()
  currencyName: string;

  @IsString()
  symbol: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  rate: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  decimalDigits?: number;

  @IsOptional()
  @IsString()
  @IsIn(['before', 'after'])
  position?: string;
}

export class UpdateCurrencyRateDto {
  @IsOptional()
  @IsString()
  currencyName?: string;

  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  rate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  decimalDigits?: number;

  @IsOptional()
  @IsString()
  @IsIn(['before', 'after'])
  position?: string;
}

export class ConvertCurrencyDto {
  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsString()
  fromCurrency: string;

  @IsString()
  toCurrency: string;
}
