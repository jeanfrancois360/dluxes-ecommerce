import { Module } from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { AffiliateController } from './affiliate.controller';
import { AwinApiClient } from './awin-api.service';
import { AwinFeedService } from './awin-feed.service';
import { AwinCronService } from './awin.cron';
import { DatabaseModule } from '../database/database.module';

/**
 * Affiliate Module (Phase C.3 / C.4 / Feed)
 * Manages Awin affiliate advertisers, products, translations,
 * click tracking, commission sync, and automated feed ingestion.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [AffiliateController],
  providers: [AffiliateService, AwinApiClient, AwinFeedService, AwinCronService],
  exports: [AffiliateService],
})
export class AffiliateModule {}
