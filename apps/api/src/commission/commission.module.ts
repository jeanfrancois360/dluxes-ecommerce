import { Module } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { PayoutService } from './payout.service';
import { EnhancedCommissionService } from './enhanced-commission.service';
import { CommissionController } from './commission.controller';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [DatabaseModule, SettingsModule],
  controllers: [CommissionController],
  providers: [CommissionService, PayoutService, EnhancedCommissionService],
  exports: [CommissionService, PayoutService, EnhancedCommissionService],
})
export class CommissionModule {}
