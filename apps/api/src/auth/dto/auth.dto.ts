import { IsEmail, IsString, MinLength, IsOptional, IsBoolean, IsEnum, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

// Sanitization helper functions
const sanitizeString = (value: any): string => {
  if (typeof value !== 'string') return value;
  // Trim whitespace
  let sanitized = value.trim();
  // Strip HTML tags to prevent XSS
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>'"]/g, '');
  return sanitized;
};

const sanitizeEmail = (value: any): string => {
  if (typeof value !== 'string') return value;
  // Trim and lowercase email
  return value.trim().toLowerCase();
};

export enum UserRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
}

export class RegisterDto {
  @Transform(({ value }) => sanitizeEmail(value))
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
    },
  )
  password!: string;

  @Transform(({ value }) => sanitizeString(value))
  @IsString()
  firstName!: string;

  @Transform(({ value }) => sanitizeString(value))
  @IsString()
  lastName!: string;

  @IsOptional()
  @Transform(({ value }) => sanitizeString(value))
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  sessionId?: string;

  // Seller-specific fields
  @IsOptional()
  @Transform(({ value }) => sanitizeString(value))
  @IsString()
  storeName?: string;

  @IsOptional()
  @Transform(({ value }) => sanitizeString(value))
  @IsString()
  storeDescription?: string;
}

export class LoginDto {
  @Transform(({ value }) => sanitizeEmail(value))
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;

  @IsOptional()
  @IsString()
  twoFactorCode?: string;

  @IsOptional()
  @IsString()
  backupCode?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class MagicLinkDto {
  @Transform(({ value }) => sanitizeEmail(value))
  @IsEmail()
  email!: string;
}

export class PasswordResetRequestDto {
  @Transform(({ value }) => sanitizeEmail(value))
  @IsEmail()
  email!: string;
}

export class PasswordResetDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
    },
  )
  newPassword!: string;
}

export class Enable2FADto {
  @IsString()
  code!: string;
}

export class Verify2FADto {
  @IsString()
  code!: string;
}

export class VerifyMagicLinkDto {
  @IsString()
  token!: string;
}

export class VerifyEmailDto {
  @IsString()
  token!: string;
}

export class ResendVerificationDto {
  @Transform(({ value }) => sanitizeEmail(value))
  @IsEmail()
  email!: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
    },
  )
  newPassword!: string;
}
