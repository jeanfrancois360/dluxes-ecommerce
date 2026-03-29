import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionService } from './subscription.service';

/**
 * Subscription Cron Jobs Service
 * Handles automated subscription maintenance tasks
 */
@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * Reset Monthly Credits - Runs on 1st of every month at 1:00 AM UTC
   * Resets creditsUsed to 0 and creditsAllocated to plan's monthlyCredits
   */
  @Cron('0 1 1 * *', {
    name: 'reset-monthly-credits',
    timeZone: 'UTC',
  })
  async handleMonthlyCreditsReset() {
    this.logger.log('Starting monthly credit reset...');

    try {
      const result = await this.subscriptionService.resetMonthlyCredits();

      if (result.errors.length > 0) {
        this.logger.warn(
          `Monthly credit reset completed with errors: ${result.reset} reset, ${result.errors.length} errors`
        );
        this.logger.error(`Errors: ${result.errors.join('; ')}`);
      } else {
        this.logger.log(
          `Monthly credit reset completed successfully: ${result.reset} subscriptions reset`
        );
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to reset monthly credits', error);
      throw error;
    }
  }

  /**
   * Manual trigger for testing - Not a scheduled job
   */
  async triggerManualCreditReset() {
    this.logger.log('Manual credit reset triggered');
    return this.handleMonthlyCreditsReset();
  }
}
