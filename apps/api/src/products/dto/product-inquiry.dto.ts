import { IsString, IsEmail, IsOptional, MaxLength, MinLength } from 'class-validator';

export class ProductInquiryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  message: string;

  @IsString()
  productId: string;
}
