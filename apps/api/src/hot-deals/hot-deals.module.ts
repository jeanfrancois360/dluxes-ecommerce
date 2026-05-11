import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HotDealsService } from './hot-deals.service';
import { HotDealsController } from './hot-deals.controller';
import { HotDealsCronService } from './hot-deals.cron';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [HotDealsService, HotDealsCronService],
  controllers: [HotDealsController],
  exports: [HotDealsService],
})
export class HotDealsModule {}
