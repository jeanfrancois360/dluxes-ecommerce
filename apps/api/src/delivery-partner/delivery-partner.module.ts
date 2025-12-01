import { Module } from '@nestjs/common';
import { DeliveryPartnerController } from './delivery-partner.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [DeliveryPartnerController],
})
export class DeliveryPartnerModule {}
