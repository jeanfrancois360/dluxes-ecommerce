import { IsBoolean, IsOptional, IsString, IsNumber, IsObject, Min, Max } from 'class-validator';

export class UpdatePickupSettingsDto {
  @IsBoolean()
  pickupEnabled: boolean;

  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @IsOptional()
  @IsString()
  pickupInstructions?: string;

  @IsOptional()
  @IsObject()
  pickupHours?: Record<string, string>; // { monday: "9am-5pm", ... }

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  pickupRadius?: number; // km

  @IsOptional()
  @IsNumber()
  @Min(0)
  pickupFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(1440) // 1 day max
  pickupEstimatedMinutes?: number;
}
