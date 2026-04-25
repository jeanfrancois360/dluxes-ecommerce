import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ReferralStatus, UserRole } from '@prisma/client';

/**
 * DTO for getting referral history
 */
export class GetReferralHistoryDto {
  @IsOptional()
  @IsEnum(ReferralStatus)
  status?: ReferralStatus;

  @IsOptional()
  @IsString()
  startDate?: string; // ISO date string

  @IsOptional()
  @IsString()
  endDate?: string; // ISO date string

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * DTO for admin to get all referrals
 */
export class GetAllReferralsDto extends GetReferralHistoryDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole; // Filter by referred user's role (BUYER or SELLER)
}

/**
 * DTO for validating referral code
 */
export class ValidateReferralCodeDto {
  @IsString()
  code!: string;
}

/**
 * DTO for applying referral code (used in registration)
 */
export class ApplyReferralCodeDto {
  @IsOptional()
  @IsString()
  referralCode?: string;
}
