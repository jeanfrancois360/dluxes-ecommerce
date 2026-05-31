import { IsString, IsNumber, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

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

export class CustomsInfoDto {
  @IsOptional()
  @IsString()
  contentsType?: string;

  @IsOptional()
  @IsString()
  contentsExplanation?: string;

  @IsOptional()
  @IsString()
  signer?: string;

  @IsOptional()
  @IsString()
  eelPfc?: string;

  @IsOptional()
  @IsString()
  nonDeliveryOption?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomsItemDto)
  items?: CustomsItemDto[];
}
