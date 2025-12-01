import { Module } from '@nestjs/common';
import { DeliveryProviderController } from './delivery-provider.controller';
import { DeliveryProviderService } from './delivery-provider.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [DeliveryProviderController],
  providers: [DeliveryProviderService],
  exports: [DeliveryProviderService],
})
export class DeliveryProviderModule {}
