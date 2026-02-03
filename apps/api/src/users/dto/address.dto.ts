import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

/**
 * DTO for creating a new address
 * province and postalCode are optional - not all countries use them
 */
export class CreateAddressDto {
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsString()
  @MinLength(1)
  address1: string;

  @IsOptional()
  @IsString()
  address2?: string;

  @IsString()
  @MinLength(1)
  city: string;

  @IsOptional()
  @IsString()
  province?: string; // Optional - not all countries have states/provinces

  @IsOptional()
  @IsString()
  postalCode?: string; // Optional - not all countries have postal codes

  @IsString()
  @MinLength(2)
  country: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

/**
 * DTO for updating an existing address
 * All fields are optional - only update what's provided
 */
export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  address1?: string;

  @IsOptional()
  @IsString()
  address2?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  city?: string;

  @IsOptional()
  @IsString()
  province?: string | null; // Optional - can be null for countries without provinces

  @IsOptional()
  @IsString()
  postalCode?: string | null; // Optional - can be null for countries without postal codes

  @IsOptional()
  @IsString()
  @MinLength(2)
  country?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
