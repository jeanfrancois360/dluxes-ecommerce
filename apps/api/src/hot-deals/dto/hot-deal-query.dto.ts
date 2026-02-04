import { IsString, IsEnum, IsOptional } from 'class-validator';
import { HotDealCategory } from './create-hot-deal.dto';

export class HotDealQueryDto {
  @IsEnum(HotDealCategory, { message: 'Invalid category' })
  @IsOptional()
  category?: HotDealCategory;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
