import { Module } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { PayoutService } from './payout.service';
import { CommissionController } from './commission.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CommissionController],
  providers: [CommissionService, PayoutService],
  exports: [CommissionService, PayoutService],
})
export class CommissionModule {}
