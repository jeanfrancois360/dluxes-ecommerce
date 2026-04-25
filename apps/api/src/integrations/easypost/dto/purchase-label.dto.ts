import { Type } from 'class-transformer';
import { IsString, IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { AddressDto } from './address.dto';
import { ParcelDto } from './parcel.dto';

export class PurchaseLabelDto {
  @IsString()
  orderId: string;

  @IsOptional()
  @IsString()
  orderItemId?: string;

  @IsString()
  sellerId: string;

  @IsOptional()
  @IsString()
  storeId?: string;

  // If rating was already done
  @IsOptional()
  @IsString()
  shipmentId?: string;

  @IsString()
  rateId: string;

  @ValidateNested()
  @Type(() => AddressDto)
  fromAddress: AddressDto;

  @ValidateNested()
  @Type(() => AddressDto)
  toAddress: AddressDto;

  @ValidateNested()
  @Type(() => ParcelDto)
  parcel: ParcelDto;

  @IsOptional()
  customsInfo?: any;

  @IsOptional()
  @IsNumber()
  insuranceAmount?: number;

  @IsOptional()
  @IsString()
  labelFormat?: 'PNG' | 'PDF' | 'ZPL' | 'EPL2';

  @IsOptional()
  @IsString()
  labelSize?: string;
}
