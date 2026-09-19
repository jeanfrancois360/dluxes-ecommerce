import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdvertisementController } from './advertisement.controller';
import { AdvertisementService } from './advertisement.service';
import { AdvertisementPlansController } from './advertisement-plans.controller';
import { AdvertisementPlansService } from './advertisement-plans.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [AdvertisementController, AdvertisementPlansController],
  providers: [AdvertisementService, AdvertisementPlansService],
  exports: [AdvertisementService, AdvertisementPlansService],
})
export class AdvertisementModule {}
