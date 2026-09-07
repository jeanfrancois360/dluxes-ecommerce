import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HotDealsService } from './hot-deals.service';
import { HotDealsController } from './hot-deals.controller';
import { HotDealsCronService } from './hot-deals.cron';
import { HotDealCategoriesService } from './hot-deal-categories.service';
import { HotDealCategoriesController } from './hot-deal-categories.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [HotDealsService, HotDealsCronService, HotDealCategoriesService],
  controllers: [HotDealCategoriesController, HotDealsController],
  exports: [HotDealsService, HotDealCategoriesService],
})
export class HotDealsModule {}
