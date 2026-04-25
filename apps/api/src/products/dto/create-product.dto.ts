import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  Min,
  IsObject,
  ValidateNested,
  Validate,
} from 'class-validator';
import { ProductStatus, ProductType, PurchaseType, FulfillmentType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  RequiresPriceForInstantConstraint,
  RequiresInventoryForInstantConstraint,
} from './validators/product-validation';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  storeId?: string; // Admin can assign product to a specific store

  @IsOptional() // Optional for INQUIRY purchase type
  @Validate(RequiresPriceForInstantConstraint)
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  compareAtPrice?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional() // Optional for INQUIRY purchase type
  @Validate(RequiresInventoryForInstantConstraint)
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  inventory?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weight?: number;

  // Product Type & Purchase Model
  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;

  @IsOptional()
  @IsEnum(PurchaseType)
  purchaseType?: PurchaseType;

  @IsOptional()
  @IsBoolean()
  isPreOrder?: boolean;

  @IsOptional()
  @IsBoolean()
  contactRequired?: boolean;

  @IsOptional()
  @IsString()
  heroImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]; // Array of image URLs (handled separately, not passed to Prisma directly)

  @IsOptional()
  @IsObject()
  gallery?: any; // Array of {type: 'image'|'video'|'360', url: string, thumbnail?: string}

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  badges?: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  displayOrder?: number;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoKeywords?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materials?: string[];

  // ============ REAL ESTATE FIELDS ============
  @IsOptional()
  @IsString()
  propertyType?: string; // house, apartment, condo, townhouse, land, commercial

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  squareFeet?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  lotSize?: number;

  @IsOptional()
  @IsNumber()
  @Min(1800)
  @Type(() => Number)
  yearBuilt?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  parkingSpaces?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsString()
  propertyAddress?: string;

  @IsOptional()
  @IsString()
  propertyCity?: string;

  @IsOptional()
  @IsString()
  propertyState?: string;

  @IsOptional()
  @IsString()
  propertyCountry?: string;

  @IsOptional()
  @IsString()
  propertyZipCode?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  propertyLatitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  propertyLongitude?: number;

  @IsOptional()
  @IsString()
  virtualTourUrl?: string;

  // ============ VEHICLE FIELDS ============
  @IsOptional()
  @IsString()
  vehicleMake?: string;

  @IsOptional()
  @IsString()
  vehicleModel?: string;

  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Type(() => Number)
  vehicleYear?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  vehicleMileage?: number;

  @IsOptional()
  @IsString()
  vehicleVIN?: string;

  @IsOptional()
  @IsString()
  vehicleCondition?: string; // new, used, certified_preowned

  @IsOptional()
  @IsString()
  vehicleTransmission?: string; // automatic, manual, cvt

  @IsOptional()
  @IsString()
  vehicleFuelType?: string; // petrol, diesel, electric, hybrid, plugin_hybrid

  @IsOptional()
  @IsString()
  vehicleBodyType?: string; // sedan, suv, truck, coupe, hatchback, van, wagon, convertible

  @IsOptional()
  @IsString()
  vehicleExteriorColor?: string;

  @IsOptional()
  @IsString()
  vehicleInteriorColor?: string;

  @IsOptional()
  @IsString()
  vehicleDrivetrain?: string; // fwd, rwd, awd, 4wd

  @IsOptional()
  @IsString()
  vehicleEngine?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vehicleFeatures?: string[];

  @IsOptional()
  @IsString()
  vehicleHistory?: string;

  @IsOptional()
  @IsString()
  vehicleWarranty?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  vehicleTestDriveAvailable?: boolean;

  // ============ DIGITAL FIELDS ============
  @IsOptional()
  @IsString()
  digitalFileUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  digitalFileSize?: number; // File size in bytes

  @IsOptional()
  @IsString()
  digitalFileFormat?: string; // PDF, ZIP, MP3, MP4, PNG, etc.

  @IsOptional()
  @IsString()
  digitalFileName?: string;

  @IsOptional()
  @IsString()
  digitalVersion?: string; // e.g., "1.0.0", "2024.1"

  @IsOptional()
  @IsString()
  digitalLicenseType?: string; // personal, commercial, extended, unlimited

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  digitalDownloadLimit?: number; // null = unlimited

  @IsOptional()
  @IsString()
  digitalPreviewUrl?: string;

  @IsOptional()
  @IsString()
  digitalRequirements?: string;

  @IsOptional()
  @IsString()
  digitalInstructions?: string;

  @IsOptional()
  @IsString()
  digitalUpdatePolicy?: string; // free_lifetime, free_1year, paid_updates

  @IsOptional()
  @IsString()
  digitalSupportEmail?: string;

  // ============ SERVICE FIELDS ============
  @IsOptional()
  @IsString()
  serviceType?: string; // in_person, online, hybrid

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  serviceDuration?: number;

  @IsOptional()
  @IsString()
  serviceDurationUnit?: string; // minutes, hours, days, sessions

  @IsOptional()
  @IsString()
  serviceLocation?: string;

  @IsOptional()
  @IsString()
  serviceArea?: string;

  @IsOptional()
  @IsString()
  serviceAvailability?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  serviceBookingRequired?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  serviceBookingLeadTime?: number; // Hours in advance

  @IsOptional()
  @IsString()
  serviceProviderName?: string;

  @IsOptional()
  @IsString()
  serviceProviderBio?: string;

  @IsOptional()
  @IsString()
  serviceProviderImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceProviderCredentials?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  serviceMaxClients?: number;

  @IsOptional()
  @IsString()
  serviceCancellationPolicy?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceIncludes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceExcludes?: string[];

  @IsOptional()
  @IsString()
  serviceRequirements?: string;

  // ============ RENTAL FIELDS ============
  @IsOptional()
  @IsString()
  rentalPeriodType?: string; // hourly, daily, weekly, monthly

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  rentalMinPeriod?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  rentalMaxPeriod?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rentalPriceHourly?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rentalPriceDaily?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rentalPriceWeekly?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rentalPriceMonthly?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rentalSecurityDeposit?: number;

  @IsOptional()
  @IsString()
  rentalPickupLocation?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  rentalDeliveryAvailable?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rentalDeliveryFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rentalLateReturnFee?: number;

  @IsOptional()
  @IsString()
  rentalConditions?: string;

  @IsOptional()
  @IsString()
  rentalAvailability?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  rentalInsuranceRequired?: boolean;

  @IsOptional()
  @IsString()
  rentalInsuranceOptions?: string;

  @IsOptional()
  @IsNumber()
  @Min(16)
  @Type(() => Number)
  rentalAgeRequirement?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  rentalIdRequired?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rentalIncludes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rentalExcludes?: string[];

  @IsOptional()
  @IsString()
  rentalNotes?: string;

  // ============ GELATO POD FIELDS ============
  @IsOptional()
  @IsEnum(FulfillmentType)
  fulfillmentType?: FulfillmentType;

  @IsOptional()
  @IsString()
  gelatoProductUid?: string;

  @IsOptional()
  @IsString()
  gelatoTemplateId?: string;

  @IsOptional()
  @IsString()
  designFileUrl?: string;

  @IsOptional()
  @IsObject()
  printAreas?: any; // Print area configs { front: {...}, back: {...} }

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  baseCost?: number; // Base production cost from Gelato
}
