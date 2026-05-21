import { Module } from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { AffiliateController } from './affiliate.controller';
import { DatabaseModule } from '../database/database.module';

/**
 * Affiliate Module (Phase C.3)
 * Manages Awin affiliate advertisers, products, translations,
 * click tracking, and commission sync.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [AffiliateController],
  providers: [AffiliateService],
  exports: [AffiliateService],
})
export class AffiliateModule {}
