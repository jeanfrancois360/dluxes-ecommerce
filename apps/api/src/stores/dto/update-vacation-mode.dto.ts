import {
  IsBoolean,
  IsString,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class UpdateVacationModeDto {
  @IsBoolean()
  vacationMode: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  vacationMessage?: string;

  @IsOptional()
  @IsDateString()
  vacationEndDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  vacationAutoReply?: string;

  @IsOptional()
  @IsBoolean()
  vacationHideProducts?: boolean;
}
