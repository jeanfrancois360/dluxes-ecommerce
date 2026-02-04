import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class RespondToDealDto {
  @IsString()
  @MinLength(20, { message: 'Message must be at least 20 characters' })
  @MaxLength(500, { message: 'Message cannot exceed 500 characters' })
  message: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Contact info cannot exceed 500 characters' })
  contactInfo?: string;
}
