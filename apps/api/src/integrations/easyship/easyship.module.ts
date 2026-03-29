import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EasyshipService } from './easyship.service';
import { EasyshipController } from './easyship.controller';

@Module({
  imports: [ConfigModule],
  controllers: [EasyshipController],
  providers: [EasyshipService],
  exports: [EasyshipService],
})
export class EasyshipModule {}
