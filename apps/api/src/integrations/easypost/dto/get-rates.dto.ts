import { Type } from 'class-transformer';
import { IsOptional, ValidateNested, IsArray, IsString } from 'class-validator';
import { AddressDto } from './address.dto';
import { ParcelDto } from './parcel.dto';
import { CustomsInfoDto } from './customs-info.dto';

export class GetRatesDto {
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
  @ValidateNested()
  @Type(() => CustomsInfoDto)
  customsInfo?: CustomsInfoDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  carriers?: string[];

  /** Optional order ID — when provided, customs info is auto-built from
   *  product hsCode / countryOfOrigin for international shipments. */
  @IsOptional()
  @IsString()
  orderId?: string;
}
