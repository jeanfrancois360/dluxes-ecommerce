import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { SubscriptionPlansController } from './subscription-plans.controller';
import { SellerSubscriptionsController } from './seller-subscriptions.controller';
import { CreditsAdminController } from './credits.controller';
import { AdminSellersController } from './admin-sellers.controller';
import { AdminService } from './admin.service';
import { DatabaseModule } from '../database/database.module';
import { CreditsModule } from '../credits/credits.module';
import { SellerModule } from '../seller/seller.module';

@Module({
  imports: [DatabaseModule, CreditsModule, SellerModule],
  controllers: [AdminController, SubscriptionPlansController, SellerSubscriptionsController, CreditsAdminController, AdminSellersController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
