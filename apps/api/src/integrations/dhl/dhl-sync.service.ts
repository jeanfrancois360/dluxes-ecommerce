import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DhlTrackingService } from './dhl-tracking.service';

@Injectable()
export class DhlSyncService {
  private readonly logger = new Logger(DhlSyncService.name);

  constructor(private readonly dhlTrackingService: DhlTrackingService) {}

  /**
   * Sync all active deliveries with DHL API every 10 minutes
   * Cron pattern: Every 10 minutes
   */
  @Cron('*/10 * * * *', {
    name: 'dhl-tracking-sync',
  })
  async handleDhlTrackingSync() {
    this.logger.log('Starting DHL tracking sync cron job...');

    try {
      await this.dhlTrackingService.syncAllActiveDeliveries();
      this.logger.log('DHL tracking sync completed successfully');
    } catch (error) {
      this.logger.error('DHL tracking sync failed', error.message);
    }
  }
}
