import { Module } from '@nestjs/common';
import { DeliveryPayoutsController } from './delivery-payouts.controller';
import { DeliveryPayoutsService } from './delivery-payouts.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [DeliveryPayoutsController],
  providers: [DeliveryPayoutsService],
  exports: [DeliveryPayoutsService],
})
export class DeliveryPayoutsModule {}
