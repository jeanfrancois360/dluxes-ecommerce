import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsDateString,
  MaxLength,
  MinLength,
  IsIn,
} from 'class-validator';

export class CreateInquiryDto {
  @IsString()
  productId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  buyerName: string;

  @IsEmail()
  buyerEmail: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  buyerPhone?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsIn(['email', 'phone', 'both'])
  preferredContact?: string;

  @IsOptional()
  @IsIn(['morning', 'afternoon', 'evening', 'anytime'])
  preferredTime?: string;

  // Real estate specific
  @IsOptional()
  @IsDateString()
  scheduledViewing?: string;

  @IsOptional()
  @IsBoolean()
  preApproved?: boolean;

  // Vehicle specific
  @IsOptional()
  @IsDateString()
  scheduledTestDrive?: string;

  @IsOptional()
  @IsBoolean()
  tradeInInterest?: boolean;
}
