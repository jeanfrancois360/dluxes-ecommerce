import { IsString, IsOptional, IsEnum, IsDateString, MinLength, MaxLength } from 'class-validator';
import { CampaignAudience } from '@prisma/client';

export class CreateCampaignDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  previewText?: string;

  @IsString()
  @MinLength(1)
  body: string;

  @IsOptional()
  @IsEnum(CampaignAudience)
  audience?: CampaignAudience;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  previewText?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  body?: string;

  @IsOptional()
  @IsEnum(CampaignAudience)
  audience?: CampaignAudience;
}

export class ScheduleCampaignDto {
  @IsDateString()
  scheduledAt: string;
}
