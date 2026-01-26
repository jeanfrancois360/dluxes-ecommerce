import { IsString, IsOptional, IsDateString, IsEnum, MaxLength, Length } from 'class-validator';

export enum DhlServiceType {
  EXPRESS = 'express',
  PARCEL = 'parcel-de',
  ECOMMERCE = 'ecommerce',
}

export class ConfirmShipmentDto {
  @IsEnum(DhlServiceType)
  dhlServiceType: DhlServiceType;

  @IsString()
  @MaxLength(100)
  trackingNumber: string;

  @IsOptional()
  @IsDateString()
  shippedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  packageWeight?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  packageDimensions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  // ✅ NEW: Optional parameters for better DHL tracking accuracy
  @IsOptional()
  @IsString()
  @Length(2, 10)
  recipientPostalCode?: string; // Improves tracking accuracy

  @IsOptional()
  @IsString()
  @Length(2, 2)
  originCountryCode?: string; // ISO 2-letter code (e.g., "RW", "US", "DE")

  @IsOptional()
  @IsString()
  @Length(2, 2)
  language?: string; // e.g., "en", "de", "fr" - for localized status messages
}
