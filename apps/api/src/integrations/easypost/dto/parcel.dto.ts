import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ParcelDto {
  @IsNumber()
  length: number; // inches

  @IsNumber()
  width: number; // inches

  @IsNumber()
  height: number; // inches

  @IsNumber()
  weight: number; // ounces

  @IsOptional()
  @IsString()
  predefinedPackage?: string; // e.g., "Parcel", "FlatRatePaddedEnvelope"
}
