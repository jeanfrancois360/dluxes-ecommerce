import { Module } from '@nestjs/common';
import { PayoutSchedulerService } from './payout-scheduler.service';
import { PayoutController } from './payout.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PayoutController],
  providers: [PayoutSchedulerService],
  exports: [PayoutSchedulerService],
})
export class PayoutModule {}
