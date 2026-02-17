import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PayoutSchedulerService } from './payout-scheduler.service';

/**
 * Automated Payout Processing Service
 * Runs scheduled jobs for payout processing
 */
@Injectable()
export class PayoutCronService {
  private readonly logger = new Logger(PayoutCronService.name);

  constructor(private readonly payoutScheduler: PayoutSchedulerService) {}

  /**
   * Process Pending Payouts - Runs every day at 2 AM UTC
   * This ensures sellers get their payouts processed automatically
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    name: 'process-pending-payouts',
    timeZone: 'UTC',
  })
  async handlePendingPayouts() {
    this.logger.log('Starting automated payout processing...');

    try {
      const result = await this.payoutScheduler.processPendingPayouts();

      this.logger.log(
        `Payout processing completed: ${result.processed} processed, ${result.failed} failed`
      );

      if (result.failed > 0) {
        this.logger.warn(`Failed payouts: ${JSON.stringify(result.failedPayoutIds)}`);
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to process pending payouts', error);
      throw error;
    }
  }

  /**
   * Check Scheduled Payouts - Runs every hour
   * Checks if any stores have scheduled payouts due and creates them
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'check-scheduled-payouts',
    timeZone: 'UTC',
  })
  async handleScheduledPayouts() {
    this.logger.log('Checking for scheduled payouts...');

    try {
      const result = await this.payoutScheduler.processScheduledPayouts();

      this.logger.log(`Scheduled payout check completed: ${result.successful} created`);

      return result;
    } catch (error) {
      this.logger.error('Failed to check scheduled payouts', error);
      throw error;
    }
  }

  /**
   * Retry Failed Payouts - Runs every 6 hours
   * Retries payouts that failed due to temporary issues
   */
  @Cron(CronExpression.EVERY_6_HOURS, {
    name: 'retry-failed-payouts',
    timeZone: 'UTC',
  })
  async handleFailedPayouts() {
    this.logger.log('Retrying failed payouts...');

    try {
      const result = await this.payoutScheduler.retryFailedPayouts();

      this.logger.log(
        `Failed payout retry completed: ${result.retried} retried, ${result.succeeded} succeeded`
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to retry failed payouts', error);
      throw error;
    }
  }

  /**
   * Send Payout Reminders - Runs every day at 9 AM UTC
   * Sends reminders to sellers about upcoming payouts
   */
  @Cron('0 9 * * *', {
    name: 'send-payout-reminders',
    timeZone: 'UTC',
  })
  async handlePayoutReminders() {
    this.logger.log('Sending payout reminders...');

    try {
      const result = await this.payoutScheduler.sendPayoutReminders();

      this.logger.log(`Payout reminders sent: ${result.sent} notifications sent`);

      return result;
    } catch (error) {
      this.logger.error('Failed to send payout reminders', error);
      throw error;
    }
  }

  /**
   * Update Payout Statuses - Runs every 30 minutes
   * Updates status of payouts from payment providers (Stripe, PayPal, etc.)
   */
  @Cron(CronExpression.EVERY_30_MINUTES, {
    name: 'update-payout-statuses',
    timeZone: 'UTC',
  })
  async handlePayoutStatusUpdates() {
    this.logger.log('Updating payout statuses from payment providers...');

    try {
      const result = await this.payoutScheduler.updatePayoutStatuses();

      this.logger.log(`Payout status update completed: ${result.updated} updated`);

      return result;
    } catch (error) {
      this.logger.error('Failed to update payout statuses', error);
      throw error;
    }
  }

  /**
   * Manual trigger for testing - Not a scheduled job
   */
  async triggerManualPayoutProcessing() {
    this.logger.log('Manual payout processing triggered');
    return this.handlePendingPayouts();
  }
}
