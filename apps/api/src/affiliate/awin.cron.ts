import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AffiliateService } from './affiliate.service';

/**
 * Nightly Awin commission sync cron (Phase C.4)
 * Fires at 03:00 Europe/Paris daily.
 * Syncs a 48h window to handle Awin's eventual consistency and clock skew.
 */
@Injectable()
export class AwinCronService {
  private readonly logger = new Logger(AwinCronService.name);

  constructor(private readonly affiliateService: AffiliateService) {}

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
      this.logger.log(`Nightly Awin sync result: ${JSON.stringify(result)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`Nightly Awin sync failed: ${msg}`, stack);
      // Don't rethrow — cron failures must not crash the app
    }
  }
}
