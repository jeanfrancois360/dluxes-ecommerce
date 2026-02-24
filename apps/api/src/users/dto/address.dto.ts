import { IsString, IsOptional, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for creating a new address
 * province and postalCode are optional - not all countries use them
 *
 * IMPORTANT: Address fields have strict validation for Gelato POD compatibility:
 * - address1 max 35 characters (Gelato requirement)
 * - No newlines allowed (prevents multi-line concatenation issues)
 * - Automatic trimming and whitespace normalization
 */
export class CreateAddressDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }) => value?.toString().trim().replace(/\s+/g, ' '))
  @Matches(/^[^\n\r]+$/, { message: 'First name cannot contain line breaks' })
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }) => value?.toString().trim().replace(/\s+/g, ' '))
  @Matches(/^[^\n\r]+$/, { message: 'Last name cannot contain line breaks' })
  lastName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(35, {
    message: 'Address line 1 must not exceed 35 characters (required for shipping providers)',
  })
  @Transform(({ value }) => value?.toString().trim().replace(/\s+/g, ' '))
  @Matches(/^[^\n\r]+$/, { message: 'Address line 1 cannot contain line breaks' })
  address1: string;

  @IsOptional()
  @IsString()
  @MaxLength(35)
  @Transform(({ value }) => value?.toString().trim().replace(/\s+/g, ' '))
  @Matches(/^[^\n\r]*$/, { message: 'Address line 2 cannot contain line breaks' })
  address2?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }) => value?.toString().trim().replace(/\s+/g, ' '))
  @Matches(/^[^\n\r]+$/, { message: 'City cannot contain line breaks' })
  city: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.toString().trim().replace(/\s+/g, ' '))
  province?: string; // Optional - not all countries have states/provinces

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => value?.toString().trim().replace(/\s+/g, ' '))
  postalCode?: string; // Optional - not all countries have postal codes

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.toString().trim())
  country: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => value?.toString().trim().replace(/\s+/g, ' '))
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

/**
 * DTO for updating an existing address
 * All fields are optional - only update what's provided
 * Same validation rules as CreateAddressDto
 */
export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }) => value?.toString().trim().replace(/\s+/g, ' '))
  @Matches(/^[^\n\r]+$/, { message: 'First name cannot contain line breaks' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }) => value?.toString().trim().replace(/\s+/g, ' '))
  @Matches(/^[^\n\r]+$/, { message: 'Last name cannot contain line breaks' })
  lastName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(35, {
    message: 'Address line 1 must not exceed 35 characters (required for shipping providers)',
  })
  @Transform(({ value }) => value?.toString().trim().replace(/\s+/g, ' '))
  @Matches(/^[^\n\r]+$/, { message: 'Address line 1 cannot contain line breaks' })
  address1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(35)
  @Transform(({ value }) => value?.toString().trim().replace(/\s+/g, ' '))
  @Matches(/^[^\n\r]*$/, { message: 'Address line 2 cannot contain line breaks' })
  address2?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }) => value?.toString().trim().replace(/\s+/g, ' '))
  @Matches(/^[^\n\r]+$/, { message: 'City cannot contain line breaks' })
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.toString().trim().replace(/\s+/g, ' '))
  province?: string | null; // Optional - can be null for countries without provinces

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => value?.toString().trim().replace(/\s+/g, ' '))
  postalCode?: string | null; // Optional - can be null for countries without postal codes

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.toString().trim())
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => value?.toString().trim().replace(/\s+/g, ' '))
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
