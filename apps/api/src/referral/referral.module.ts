import { Module } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';

/**
 * Referral Module (v2.11.0)
 * Dynamic Referral Management Module
 * Supports BUYER and SELLER referrals with configurable rewards
 */
@Module({
  imports: [DatabaseModule, SettingsModule],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService], // Export for use in auth, orders, products modules
})
export class ReferralModule {}
