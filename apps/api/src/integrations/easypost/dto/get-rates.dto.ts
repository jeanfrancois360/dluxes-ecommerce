import { Type } from 'class-transformer';
import { IsOptional, ValidateNested, IsArray, IsString } from 'class-validator';
import { AddressDto } from './address.dto';
import { ParcelDto } from './parcel.dto';
import { CustomsItemDto } from './customs-info.dto';

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
  customsInfo?: {
    contentsType?: string;
    contentsExplanation?: string;
    signer?: string;
    eelPfc?: string;
    nonDeliveryOption?: string;
    items?: CustomsItemDto[];
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  carriers?: string[];
}
