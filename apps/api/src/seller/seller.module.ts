import { Module } from '@nestjs/common';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { SellerApprovalService } from './seller-approval.service';
import { SellerCreditsService } from './seller-credits.service';
import { SellerCreditsController } from './seller-credits.controller';
import { CanPublishGuard } from './guards/can-publish.guard';
import { DatabaseModule } from '../database/database.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { CreditsModule } from '../credits/credits.module';
import { DhlModule } from '../integrations/dhl/dhl.module';
import { SettingsModule } from '../settings/settings.module';
import { CurrencyModule } from '../currency/currency.module';
import { PaymentModule } from '../payment/payment.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    DatabaseModule,
    SubscriptionModule,
    CreditsModule,
    DhlModule,
    SettingsModule,
    CurrencyModule,
    PaymentModule,
    EmailModule,
  ],
  controllers: [SellerController, SellerCreditsController],
  providers: [SellerService, SellerApprovalService, SellerCreditsService, CanPublishGuard],
  exports: [SellerService, SellerApprovalService, SellerCreditsService, CanPublishGuard],
})
export class SellerModule {}
