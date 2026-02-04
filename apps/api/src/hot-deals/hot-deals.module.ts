import { Module } from '@nestjs/common';
import { HotDealsService } from './hot-deals.service';
import { HotDealsController } from './hot-deals.controller';
import { HotDealsCronService } from './hot-deals.cron';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [HotDealsService, HotDealsCronService],
  controllers: [HotDealsController],
  exports: [HotDealsService],
})
export class HotDealsModule {}
