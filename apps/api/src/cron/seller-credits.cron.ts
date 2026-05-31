import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { StoreStatus } from '@prisma/client';
import { SellerCreditsService } from '../seller/seller-credits.service';
import { EmailService } from '../email/email.service';

/**
 * Cron service for automated seller credit management
 */
@Injectable()
export class SellerCreditsCronService {
  private readonly logger = new Logger(SellerCreditsCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sellerCreditsService: SellerCreditsService,
    private readonly emailService: EmailService
  ) {}

  /**
   * Monthly credit deduction - Runs on the 1st day of each month at 00:00 UTC
   * Deducts 1 credit from all active stores with balance > 0
   */
  @Cron('0 0 1 * *', {
    name: 'deduct-monthly-credits',
    timeZone: 'UTC',
  })
  async deductMonthlyCredits() {
    this.logger.log('🔄 Running monthly credit deduction...');
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const startTime = Date.now();

    try {
      // Get all active stores with credits
      const stores = await this.prisma.store.findMany({
        where: {
          status: StoreStatus.ACTIVE,
          creditsBalance: { gt: 0 },
        },
        select: {
          id: true,
          name: true,
          creditsBalance: true,
          userId: true,
        },
      });

      if (stores.length === 0) {
        this.logger.log('No active stores with credits found');
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return;
      }

      this.logger.log(`Processing ${stores.length} active stores...`);
      this.logger.log('');

      let successCount = 0;
      let errorCount = 0;
      let depletedCount = 0;

      // Process each store
      for (const store of stores) {
        try {
          const result = await this.sellerCreditsService.deductMonthlyCredit(store.id);

          if (result.success) {
            const balanceAfter = store.creditsBalance - 1;
            const isDepletedNow = balanceAfter === 0;

            if (isDepletedNow) {
              this.logger.warn(
                `⚠️  Store #${store.id.substring(0, 8)}... (${store.name}) - Balance depleted (${store.creditsBalance} → 0) - Grace period started`
              );
              depletedCount++;
            } else {
              this.logger.log(
                `✅ Store #${store.id.substring(0, 8)}... (${store.name}) - Deducted 1 credit (${store.creditsBalance} → ${balanceAfter})`
              );
            }
            successCount++;
          }
        } catch (error) {
          this.logger.error(`❌ Failed to deduct credit from store ${store.id}:`, error.message);
          errorCount++;
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      this.logger.log('');
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.log('Summary:');
      this.logger.log(`✅ Successfully deducted: ${successCount} stores`);
      if (depletedCount > 0) {
        this.logger.warn(`⚠️  Credits depleted: ${depletedCount} stores`);
      }
      if (errorCount > 0) {
        this.logger.error(`❌ Failed: ${errorCount} stores`);
      }
      this.logger.log(`⏱️  Total runtime: ${duration} seconds`);
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
      this.logger.error('❌ Monthly credit deduction failed:', error);
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  }

  /**
   * Grace period enforcement - Runs daily at 02:00 UTC
   * Suspends products for stores with expired grace period
   */
  @Cron('0 2 * * *', {
    name: 'enforce-grace-period',
    timeZone: 'UTC',
  })
  async enforceGracePeriod() {
    this.logger.log('🚨 Enforcing grace period for depleted stores...');

    try {
      const result = await this.sellerCreditsService.suspendExpiredGracePeriodStores();

      if (result.success && result.data.suspendedCount > 0) {
        this.logger.warn(
          `⚠️  Suspended products for ${result.data.suspendedCount} stores with expired grace period`
        );
        this.logger.log(`Store IDs: ${result.data.storeIds.join(', ')}`);
      } else {
        this.logger.log('✅ No stores with expired grace period found');
      }
    } catch (error) {
      this.logger.error('❌ Grace period enforcement failed:', error);
    }
  }

  /**
   * Low credit warnings - Runs daily at 08:00 UTC
   * Sends email notifications to sellers with low credits or in grace period.
   * Each store receives at most one warning per 7 days, tracked via
   * lowCreditWarningSentAt / gracePeriodWarningSentAt on the Store model.
   */
  @Cron('0 8 * * *', {
    name: 'low-credit-warnings',
    timeZone: 'UTC',
  })
  async sendLowCreditWarnings() {
    this.logger.log('📧 Checking for sellers with low credits...');

    const WARNING_INTERVAL_DAYS = 7;
    const cutoff = new Date(Date.now() - WARNING_INTERVAL_DAYS * 24 * 60 * 60 * 1000);

    try {
      const result = await this.sellerCreditsService.getStoresNeedingAttention();

      if (!result.success) {
        this.logger.warn('Failed to get stores needing attention');
        return;
      }

      const { lowCredits, inGracePeriod } = result.data;

      // --- Low credit warnings ---
      const lowCreditStoreIds = lowCredits.map((s) => s.storeId);
      const recentlyWarnedLow =
        lowCreditStoreIds.length > 0
          ? new Set(
              (
                await this.prisma.store.findMany({
                  where: { id: { in: lowCreditStoreIds }, lowCreditWarningSentAt: { gte: cutoff } },
                  select: { id: true },
                })
              ).map((s) => s.id)
            )
          : new Set<string>();

      const dueForLowCreditWarning = lowCredits.filter((s) => !recentlyWarnedLow.has(s.storeId));

      if (dueForLowCreditWarning.length > 0) {
        this.logger.warn(
          `⚠️  ${dueForLowCreditWarning.length} stores with low credits (≤2 months):`
        );
        dueForLowCreditWarning.forEach((store) => {
          this.logger.warn(
            `   - ${store.storeName} (${store.ownerEmail}): ${store.creditsBalance} month${store.creditsBalance > 1 ? 's' : ''} remaining`
          );
        });

        await this.emailService.sendLowCreditWarning(dueForLowCreditWarning);

        await this.prisma.store.updateMany({
          where: { id: { in: dueForLowCreditWarning.map((s) => s.storeId) } },
          data: { lowCreditWarningSentAt: new Date() },
        });
      } else {
        this.logger.log(
          `✅ No low-credit warnings due (${lowCredits.length} stores already warned within ${WARNING_INTERVAL_DAYS}d)`
        );
      }

      // --- Grace period warnings ---
      const gracePeriodStoreIds = inGracePeriod.map((s) => s.storeId);
      const recentlyWarnedGrace =
        gracePeriodStoreIds.length > 0
          ? new Set(
              (
                await this.prisma.store.findMany({
                  where: {
                    id: { in: gracePeriodStoreIds },
                    gracePeriodWarningSentAt: { gte: cutoff },
                  },
                  select: { id: true },
                })
              ).map((s) => s.id)
            )
          : new Set<string>();

      const dueForGraceWarning = inGracePeriod.filter((s) => !recentlyWarnedGrace.has(s.storeId));

      if (dueForGraceWarning.length > 0) {
        this.logger.warn(`🚨 ${dueForGraceWarning.length} stores in grace period:`);
        dueForGraceWarning.forEach((store) => {
          const daysRemaining = Math.ceil(
            (new Date(store.graceEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          this.logger.warn(
            `   - ${store.storeName} (${store.ownerEmail}): ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} until suspension`
          );
        });

        await this.emailService.sendGracePeriodWarning(dueForGraceWarning);

        await this.prisma.store.updateMany({
          where: { id: { in: dueForGraceWarning.map((s) => s.storeId) } },
          data: { gracePeriodWarningSentAt: new Date() },
        });
      } else {
        this.logger.log(
          `✅ No grace-period warnings due (${inGracePeriod.length} stores already warned within ${WARNING_INTERVAL_DAYS}d)`
        );
      }
    } catch (error) {
      this.logger.error('❌ Low credit warning check failed:', error);
    }
  }

  /**
   * Manual trigger for testing (not scheduled)
   * Can be called via admin endpoint for testing purposes
   */
  async manualDeductMonthlyCredits() {
    this.logger.log('🔧 Manual trigger: Monthly credit deduction');
    await this.deductMonthlyCredits();
  }

  /**
   * Manual trigger for testing (not scheduled)
   */
  async manualEnforceGracePeriod() {
    this.logger.log('🔧 Manual trigger: Grace period enforcement');
    await this.enforceGracePeriod();
  }

  /**
   * Manual trigger for testing (not scheduled)
   */
  async manualSendLowCreditWarnings() {
    this.logger.log('🔧 Manual trigger: Low credit warnings');
    await this.sendLowCreditWarnings();
  }
}
