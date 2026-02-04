import { Module } from '@nestjs/common';
import { DhlTrackingService } from './dhl-tracking.service';
import { DhlSyncService } from './dhl-sync.service';
import { DhlRatesService } from './dhl-rates.service';
import { DhlShipmentService } from './dhl-shipment.service';
import { DatabaseModule } from '../../database/database.module';
import { SettingsModule } from '../../settings/settings.module';

@Module({
  imports: [DatabaseModule, SettingsModule],
  providers: [DhlTrackingService, DhlSyncService, DhlRatesService, DhlShipmentService],
  exports: [DhlTrackingService, DhlRatesService, DhlShipmentService],
})
export class DhlModule {}
