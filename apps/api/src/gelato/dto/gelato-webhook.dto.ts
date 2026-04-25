import { IsString, IsObject } from 'class-validator';

export class GelatoWebhookDto {
  @IsString()
  event: string;

  @IsString()
  id: string;

  @IsString()
  createdAt: string;

  @IsObject()
  data: Record<string, any>;
}
