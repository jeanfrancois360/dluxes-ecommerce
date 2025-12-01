import { Module } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { PayoutService } from './payout.service';
import { EnhancedCommissionService } from './enhanced-commission.service';
import { CommissionController } from './commission.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CommissionController],
  providers: [CommissionService, PayoutService, EnhancedCommissionService],
  exports: [CommissionService, PayoutService, EnhancedCommissionService],
})
export class CommissionModule {}
