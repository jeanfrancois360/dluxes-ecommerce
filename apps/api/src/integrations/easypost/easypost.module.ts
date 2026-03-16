import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { SettingsModule } from '../../settings/settings.module';

import { EasyPostService } from './easypost.service';
import { EasyPostRatesService } from './easypost-rates.service';
import { EasyPostShipmentService } from './easypost-shipment.service';
import { EasyPostTrackingService } from './easypost-tracking.service';
import { EasyPostAddressService } from './easypost-address.service';
import { EasyPostController } from './easypost.controller';
import { EasyPostWebhookController } from './easypost-webhook.controller';

@Module({
  imports: [ConfigModule, DatabaseModule, SettingsModule],
  controllers: [EasyPostController, EasyPostWebhookController],
  providers: [
    EasyPostService,
    EasyPostRatesService,
    EasyPostShipmentService,
    EasyPostTrackingService,
    EasyPostAddressService,
  ],
  exports: [
    EasyPostService,
    EasyPostRatesService,
    EasyPostShipmentService,
    EasyPostTrackingService,
    EasyPostAddressService,
  ],
})
export class EasyPostModule {}
