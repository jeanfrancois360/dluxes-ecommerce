import { Module } from '@nestjs/common';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { DatabaseModule } from '../database/database.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { CreditsModule } from '../credits/credits.module';
import { DhlModule } from '../integrations/dhl/dhl.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [DatabaseModule, SubscriptionModule, CreditsModule, DhlModule, SettingsModule],
  controllers: [SellerController],
  providers: [SellerService],
  exports: [SellerService],
})
export class SellerModule {}
