import { IsString, IsBoolean, IsOptional, IsEnum, IsDefined } from 'class-validator';
import { SettingValueType } from '@prisma/client';

export class CreateSettingDto {
  @IsString()
  key: string;

  @IsString()
  category: string;

  value: any;

  @IsEnum(SettingValueType)
  valueType: SettingValueType;

  @IsString()
  label: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsBoolean()
  @IsOptional()
  isEditable?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresRestart?: boolean;

  @IsOptional()
  defaultValue?: any;
}

export class UpdateSettingDto {
  @IsDefined()
  value: any;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class RollbackSettingDto {
  @IsString()
  auditLogId: string;
}
