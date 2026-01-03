import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionService } from './subscription.service';
import { StripeSubscriptionService } from './stripe-subscription.service';
import { SubscriptionController } from './subscription.controller';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [DatabaseModule, SettingsModule, ConfigModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, StripeSubscriptionService],
  exports: [SubscriptionService, StripeSubscriptionService],
})
export class SubscriptionModule {}
