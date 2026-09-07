import { Module } from '@nestjs/common';
import { SellerPromotionsService } from './seller-promotions.service';
import { SellerPromotionsController } from './seller-promotions.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SellerPromotionsController],
  providers: [SellerPromotionsService],
  exports: [SellerPromotionsService],
})
export class SellerPromotionsModule {}
