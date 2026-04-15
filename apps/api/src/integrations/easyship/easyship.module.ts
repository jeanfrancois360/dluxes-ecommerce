import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EasyshipService } from './easyship.service';
import { EasyshipController } from './easyship.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [EasyshipController],
  providers: [EasyshipService],
  exports: [EasyshipService],
})
export class EasyshipModule {}
