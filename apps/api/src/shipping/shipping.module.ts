import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { ShippingCacheService } from './shipping-cache.service';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';
import { DhlModule } from '../integrations/dhl/dhl.module';

@Module({
  imports: [ConfigModule, DatabaseModule, SettingsModule, DhlModule],
  controllers: [ShippingController],
  providers: [ShippingService, ShippingCacheService],
  exports: [ShippingService, ShippingCacheService],
})
export class ShippingModule {}
