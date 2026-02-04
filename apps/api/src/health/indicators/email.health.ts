import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';

/**
 * Email Health Indicator
 *
 * Custom health indicator to check email service configuration
 */
@Injectable()
export class EmailHealthIndicator extends HealthIndicator {
  /**
   * Check if email service (Resend) is configured correctly
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isConfigured = !!process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM || 'noreply@nextpik.com';

    if (isConfigured) {
      return this.getStatus(key, true, {
        message: 'Email service is configured',
        provider: 'Resend',
        from: emailFrom,
      });
    } else {
      throw new HealthCheckError(
        'Email service not configured',
        this.getStatus(key, false, {
          message: 'RESEND_API_KEY not set',
          provider: 'Resend',
        }),
      );
    }
  }
}
