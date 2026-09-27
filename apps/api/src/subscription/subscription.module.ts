import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionService } from './subscription.service';
import { StripeSubscriptionService } from './stripe-subscription.service';
import { SubscriptionCronService } from './subscription.cron';
import { SubscriptionController } from './subscription.controller';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [DatabaseModule, SettingsModule, ConfigModule, forwardRef(() => PaymentModule)],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, StripeSubscriptionService, SubscriptionCronService],
  exports: [SubscriptionService, StripeSubscriptionService],
})
export class SubscriptionModule {}
