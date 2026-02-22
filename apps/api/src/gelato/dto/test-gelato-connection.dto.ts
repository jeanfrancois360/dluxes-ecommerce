import { IsString, IsNotEmpty } from 'class-validator';

export class TestGelatoConnectionDto {
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @IsString()
  @IsNotEmpty()
  storeId: string;
}
