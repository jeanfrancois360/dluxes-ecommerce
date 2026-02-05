import {
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  IsEmail,
  Matches,
} from 'class-validator';

// Define enums locally until Prisma client is regenerated
export enum HotDealCategory {
  CHILDCARE = 'CHILDCARE',
  HOME_SERVICES = 'HOME_SERVICES',
  AUTOMOTIVE = 'AUTOMOTIVE',
  PET_SERVICES = 'PET_SERVICES',
  MOVING_DELIVERY = 'MOVING_DELIVERY',
  TECH_SUPPORT = 'TECH_SUPPORT',
  TUTORING = 'TUTORING',
  HEALTH_WELLNESS = 'HEALTH_WELLNESS',
  CLEANING = 'CLEANING',
  OTHER = 'OTHER',
}

export enum UrgencyLevel {
  NORMAL = 'NORMAL',
  URGENT = 'URGENT',
  EMERGENCY = 'EMERGENCY',
}

export enum ContactMethod {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  BOTH = 'BOTH',
}

export enum HotDealStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
}

export class CreateHotDealDto {
  @IsString()
  @MinLength(10, { message: 'Title must be at least 10 characters' })
  @MaxLength(100, { message: 'Title cannot exceed 100 characters' })
  title: string;

  @IsString()
  @MinLength(20, { message: 'Description must be at least 20 characters' })
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description: string;

  @IsEnum(HotDealCategory, { message: 'Invalid category' })
  category: HotDealCategory;

  @IsEnum(UrgencyLevel, { message: 'Invalid urgency level' })
  @IsOptional()
  urgency?: UrgencyLevel;

  @IsString()
  @MinLength(2, { message: 'Contact name must be at least 2 characters' })
  @MaxLength(100)
  contactName: string;

  @IsString()
  @Matches(/^\+?1?\d{10,14}$/, {
    message: 'Please enter a valid phone number',
  })
  contactPhone: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  contactEmail: string;

  @IsEnum(ContactMethod, { message: 'Invalid contact method preference' })
  @IsOptional()
  preferredContact?: ContactMethod;

  @IsString()
  @MinLength(2, { message: 'City is required' })
  @MaxLength(100)
  city: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  state?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{5}(-\d{4})?$/, { message: 'Invalid ZIP code format' })
  zipCode?: string;
}
