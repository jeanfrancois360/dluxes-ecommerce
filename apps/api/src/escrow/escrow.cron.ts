import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EscrowService } from './escrow.service';

/**
 * Automated Escrow Release Service
 * Runs scheduled jobs for escrow fund management
 */
@Injectable()
export class EscrowCronService {
  private readonly logger = new Logger(EscrowCronService.name);

  constructor(private readonly escrowService: EscrowService) {}

  /**
   * Auto-release Escrow Funds - Runs every 6 hours
   * Releases funds for completed deliveries that have passed the hold period
   */
  @Cron(CronExpression.EVERY_6_HOURS, {
    name: 'auto-release-escrow',
    timeZone: 'UTC',
  })
  async handleEscrowAutoRelease() {
    this.logger.log('Starting automated escrow release...');

    try {
      const result = await this.escrowService.autoReleaseEscrow();

      this.logger.log(
        `Escrow auto-release completed: ${result.released} released, ${result.failed} failed`
      );

      if (result.failed > 0) {
        this.logger.warn(`Failed escrow releases: ${JSON.stringify(result.failedIds)}`);
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to auto-release escrow funds', error);
      throw error;
    }
  }

  /**
   * Check Expired Escrow Holds - Runs every day at 3 AM UTC
   * Checks for escrow holds that have expired and need attention
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    name: 'check-expired-escrow',
    timeZone: 'UTC',
  })
  async handleExpiredEscrow() {
    this.logger.log('Checking for expired escrow holds...');

    try {
      const result = await this.escrowService.checkExpiredEscrowHolds();

      this.logger.log(`Expired escrow check completed: ${result.found} expired holds found`);

      if (result.found > 0) {
        this.logger.warn(
          `Expired escrow holds need attention: ${JSON.stringify(result.expiredIds)}`
        );
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to check expired escrow holds', error);
      throw error;
    }
  }

  /**
   * Send Escrow Release Notifications - Runs every day at 10 AM UTC
   * Sends notifications about upcoming escrow releases
   */
  @Cron('0 10 * * *', {
    name: 'escrow-release-reminders',
    timeZone: 'UTC',
  })
  async handleEscrowReleaseReminders() {
    this.logger.log('Sending escrow release reminders...');

    try {
      const result = await this.escrowService.sendEscrowReleaseReminders();

      this.logger.log(`Escrow reminders sent: ${result.sent} notifications sent`);

      return result;
    } catch (error) {
      this.logger.error('Failed to send escrow release reminders', error);
      throw error;
    }
  }

  /**
   * Reconcile Escrow Balances - Runs every day at 4 AM UTC
   * Ensures escrow balances match actual funds held
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM, {
    name: 'reconcile-escrow-balances',
    timeZone: 'UTC',
  })
  async handleEscrowReconciliation() {
    this.logger.log('Starting escrow balance reconciliation...');

    try {
      const result = await this.escrowService.reconcileEscrowBalances();

      this.logger.log(`Escrow reconciliation completed: ${result.reconciled} accounts reconciled`);

      if (result.discrepancies > 0) {
        this.logger.error(
          `Escrow discrepancies found: ${result.discrepancies} accounts have mismatched balances`
        );
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to reconcile escrow balances', error);
      throw error;
    }
  }

  /**
   * Manual trigger for testing - Not a scheduled job
   */
  async triggerManualEscrowRelease() {
    this.logger.log('Manual escrow release triggered');
    return this.handleEscrowAutoRelease();
  }
}
