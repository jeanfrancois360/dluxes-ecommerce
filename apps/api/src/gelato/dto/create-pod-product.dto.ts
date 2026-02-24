import { IsString, IsOptional, IsNumber, IsObject, IsUrl, Min } from 'class-validator';

export class CreatePodProductDto {
  @IsString()
  gelatoProductUid: string;

  @IsOptional()
  @IsString()
  gelatoTemplateId?: string;

  @IsOptional()
  @IsUrl()
  designFileUrl?: string;

  @IsOptional()
  @IsObject()
  printAreas?: Record<
    string,
    {
      fileUrl: string;
      position?: { x: number; y: number };
      scale?: number;
    }
  >;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  markupPercentage?: number;
}

export class UpdatePodProductDto {
  @IsOptional()
  @IsString()
  gelatoProductUid?: string;

  @IsOptional()
  @IsString()
  gelatoTemplateId?: string;

  @IsOptional()
  @IsUrl()
  designFileUrl?: string;

  @IsOptional()
  @IsObject()
  printAreas?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  markupPercentage?: number;
}
