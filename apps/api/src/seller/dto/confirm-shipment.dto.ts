import { IsNotEmpty, IsString, IsOptional, Matches } from 'class-validator';

export class ConfirmShipmentDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Tracking number must contain only uppercase letters and numbers',
  })
  trackingNumber: string;

  @IsOptional()
  @IsString()
  dhlServiceType?: string; // EXPRESS, PARCEL, ECOMMERCE

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d+)?\s?(kg|g|lb|oz)$/, {
    message: 'Package weight must be in format: "2.5 kg" or "500 g"',
  })
  packageWeight?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+x\d+x\d+\s?(cm|in|m)$/, {
    message: 'Package dimensions must be in format: "30x20x10 cm"',
  })
  packageDimensions?: string;
}
