import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { PayoutSchedulerService } from './payout-scheduler.service';
import { PayoutCronService } from './payout.cron';
import { PayoutController } from './payout.controller';
import { SellerPayoutSettingsService } from './seller-payout-settings.service';
import {
  SellerPayoutSettingsController,
  AdminPayoutSettingsController,
} from './seller-payout-settings.controller';
import { StripeConnectService } from './integrations/stripe-connect.service';
import { StripeConnectController } from './stripe-connect.controller';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [DatabaseModule, SettingsModule, ConfigModule, ScheduleModule.forRoot()],
  controllers: [
    PayoutController,
    SellerPayoutSettingsController,
    AdminPayoutSettingsController,
    StripeConnectController,
  ],
  providers: [
    PayoutSchedulerService,
    PayoutCronService,
    SellerPayoutSettingsService,
    StripeConnectService,
  ],
  exports: [PayoutSchedulerService, SellerPayoutSettingsService, StripeConnectService],
})
export class PayoutModule {}
