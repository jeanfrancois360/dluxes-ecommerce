import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PayPalService } from './paypal.service';
import { PayPalBillingService } from './paypal-billing.service';
import { PaymentMonitorService } from './payment-monitor.service';
import { PayPalWebhookService } from './paypal-webhook.service';
import { PayPalWebhookController } from './paypal-webhook.controller';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';
import { CurrencyModule } from '../currency/currency.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { ReferralModule } from '../referral/referral.module';
import { AuthorizationModule } from '../common/authorization/authorization.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    SettingsModule,
    CurrencyModule,
    forwardRef(() => SubscriptionModule),
    ReferralModule,
    AuthorizationModule,
  ],
  controllers: [PaymentController, PayPalWebhookController],
  providers: [
    PaymentService,
    PayPalService,
    PayPalBillingService,
    PaymentMonitorService,
    PayPalWebhookService,
  ],
  exports: [
    PaymentService,
    PayPalService,
    PayPalBillingService,
    PaymentMonitorService,
    PayPalWebhookService,
  ],
})
export class PaymentModule {}
