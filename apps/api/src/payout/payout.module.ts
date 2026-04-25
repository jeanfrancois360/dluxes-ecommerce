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
import { EncryptionService } from '../common/services/encryption.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [DatabaseModule, SettingsModule, ConfigModule, EmailModule, ScheduleModule.forRoot()],
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
    EncryptionService, // v2.11.1: Banking data encryption
  ],
  exports: [PayoutSchedulerService, SellerPayoutSettingsService, StripeConnectService],
})
export class PayoutModule {}
