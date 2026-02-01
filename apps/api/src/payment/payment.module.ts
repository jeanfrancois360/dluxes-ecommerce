import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PayPalService } from './paypal.service';
import { PaymentMonitorService } from './payment-monitor.service';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';
import { CurrencyModule } from '../currency/currency.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [ConfigModule, DatabaseModule, SettingsModule, CurrencyModule, SubscriptionModule],
  controllers: [PaymentController],
  providers: [PaymentService, PayPalService, PaymentMonitorService],
  exports: [PaymentService, PayPalService, PaymentMonitorService],
})
export class PaymentModule {}
