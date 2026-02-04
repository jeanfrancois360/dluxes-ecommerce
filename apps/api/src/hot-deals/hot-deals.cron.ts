import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HotDealsService } from './hot-deals.service';

@Injectable()
export class HotDealsCronService {
  private readonly logger = new Logger(HotDealsCronService.name);

  constructor(private readonly hotDealsService: HotDealsService) {}

  /**
   * Expire old hot deals every hour
   * Runs at the start of every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async expireOldDeals() {
    this.logger.log('Running hot deals expiration cron job...');
    try {
      const result = await this.hotDealsService.expireOldDeals();
      if (result.count > 0) {
        this.logger.log(`Successfully expired ${result.count} hot deals`);
      }
    } catch (error) {
      this.logger.error('Failed to expire hot deals:', error);
    }
  }
}
