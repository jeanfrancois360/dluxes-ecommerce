import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateGelatoSettingsDto {
  @IsString()
  @IsOptional()
  gelatoApiKey?: string;

  @IsString()
  @IsOptional()
  gelatoStoreId?: string;

  @IsString()
  @IsOptional()
  gelatoWebhookSecret?: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
