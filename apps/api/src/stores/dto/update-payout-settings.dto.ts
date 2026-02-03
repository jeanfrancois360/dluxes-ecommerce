import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export enum PayoutMethod {
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  STRIPE_CONNECT = 'stripe_connect',
}

export enum PayoutFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

export class UpdatePayoutSettingsDto {
  // Payout Method
  @IsOptional()
  @IsEnum(PayoutMethod)
  payoutMethod?: PayoutMethod;

  @IsOptional()
  @IsEmail()
  payoutEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  payoutCurrency?: string;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(10000)
  payoutMinAmount?: number;

  // Payout Schedule
  @IsOptional()
  @IsEnum(PayoutFrequency)
  payoutFrequency?: PayoutFrequency;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  payoutDayOfWeek?: number; // 0-6 for weekly (0 = Sunday)

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(28)
  payoutDayOfMonth?: number; // 1-28 for monthly

  @IsOptional()
  @IsBoolean()
  payoutAutomatic?: boolean;

  // Bank Account Details
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankAccountName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(34) // IBAN can be up to 34 characters
  bankAccountNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  bankRoutingNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankBranchName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(11) // SWIFT codes are 8 or 11 characters
  bankSwiftCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(34) // IBAN can be up to 34 characters
  bankIban?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2) // ISO country code
  bankCountry?: string;
}
