import { Module } from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { AffiliateController } from './affiliate.controller';
import { AwinApiClient } from './awin-api.service';
import { AwinCronService } from './awin.cron';
import { DatabaseModule } from '../database/database.module';

/**
 * Affiliate Module (Phase C.3 / C.4)
 * Manages Awin affiliate advertisers, products, translations,
 * click tracking, and commission sync.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [AffiliateController],
  providers: [AffiliateService, AwinApiClient, AwinCronService],
  exports: [AffiliateService],
})
export class AffiliateModule {}
