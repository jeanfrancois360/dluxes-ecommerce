import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AffiliateService } from './affiliate.service';

/**
 * Nightly Awin cron jobs.
 *
 * 02:00 Europe/Paris — product feed sync (imports/refreshes products from Awin CSV feeds)
 * 03:00 Europe/Paris — commission sync (pulls last 48h of transactions from Publisher API)
 *
 * Feed sync runs first so that newly imported products are present when commissions
 * are attributed to affiliateProductId via AffiliateClickLog.awinClickRef.
 */
@Injectable()
export class AwinCronService {
  private readonly logger = new Logger(AwinCronService.name);

  constructor(private readonly affiliateService: AffiliateService) {}

  @Cron('0 2 * * *', {
    name: 'awin-feed-sync',
    timeZone: 'Europe/Paris',
  })
  async syncFeedsCron() {
    this.logger.log('Starting nightly Awin feed sync');
    try {
      const result = await this.affiliateService.syncAllFeeds();
      this.logger.log(
        `Nightly feed sync complete: advertisersWithFeed=${result.advertisersWithFeed} ` +
          `upserted=${result.totalUpserted} errors=${result.totalErrors}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`Nightly feed sync failed: ${msg}`, stack);
      // Don't rethrow — cron failures must not crash the app
    }
  }

  @Cron('0 3 * * *', {
    name: 'awin-commission-sync',
    timeZone: 'Europe/Paris',
  })
  async syncCommissionsCron() {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 48 * 60 * 60 * 1000);

    this.logger.log(
      `Starting nightly Awin commission sync: ${startDate.toISOString()} → ${endDate.toISOString()}`
    );

    try {
      const result = await this.affiliateService.syncCommissionsFromAwin({ startDate, endDate });
      this.logger.log(`Nightly commission sync result: ${JSON.stringify(result)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`Nightly commission sync failed: ${msg}`, stack);
      // Don't rethrow — cron failures must not crash the app
    }
  }
}
