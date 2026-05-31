import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class GetPickupStoresDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  productIds: string[];
}
