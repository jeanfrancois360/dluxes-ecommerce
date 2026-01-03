import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { SubscriptionPlansController } from './subscription-plans.controller';
import { SellerSubscriptionsController } from './seller-subscriptions.controller';
import { CreditsAdminController } from './credits.controller';
import { AdminService } from './admin.service';
import { DatabaseModule } from '../database/database.module';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [DatabaseModule, CreditsModule],
  controllers: [AdminController, SubscriptionPlansController, SellerSubscriptionsController, CreditsAdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
