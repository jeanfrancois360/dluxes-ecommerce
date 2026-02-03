import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DhlTrackingService } from './dhl-tracking.service';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DhlSyncService {
  private readonly logger = new Logger(DhlSyncService.name);

  constructor(
    private readonly dhlTrackingService: DhlTrackingService,
    private readonly prisma: PrismaService,
  ) {}

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

  /**
   * ✅ NEW: Delete tracking data 30 days after delivery (DHL legal requirement)
   * Runs daily at 2 AM
   *
   * DHL Terms of Use require deletion of tracking data after 30 days for privacy compliance.
   * This ensures we comply with data retention regulations.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    name: 'dhl-tracking-cleanup',
  })
  async cleanupOldTrackingData() {
    this.logger.log('Starting DHL tracking data cleanup (30-day retention)...');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Delete tracking events older than 30 days for delivered shipments
      const result = await this.prisma.deliveryTrackingEvent.deleteMany({
        where: {
          delivery: {
            currentStatus: 'DELIVERED',
            deliveredAt: {
              lt: thirtyDaysAgo,
            },
          },
        },
      });

      this.logger.log(
        `Cleaned up ${result.count} tracking events older than 30 days (legal compliance)`,
      );

      // Also clear dhlTrackingData from delivered shipments
      const clearedDeliveries = await this.prisma.delivery.updateMany({
        where: {
          currentStatus: 'DELIVERED',
          deliveredAt: {
            lt: thirtyDaysAgo,
          },
          dhlTrackingData: {
            not: null,
          },
        },
        data: {
          dhlTrackingData: null,
        },
      });

      this.logger.log(
        `Cleared tracking data from ${clearedDeliveries.count} delivered shipments`,
      );
    } catch (error) {
      this.logger.error('Tracking data cleanup failed:', error.message);
    }
  }
}
