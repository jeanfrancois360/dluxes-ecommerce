import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { PaymentService } from './payment.service';
import { SettingsService } from '../settings/settings.service';

/**
 * Payment Monitor Service
 *
 * Monitors uncaptured payments and automatically captures them before Stripe
 * authorization expires (7 days). Runs every 6 hours to check for payments
 * approaching the auto-capture fallback day (default: Day 6).
 */
@Injectable()
export class PaymentMonitorService {
  private readonly logger = new Logger(PaymentMonitorService.name);

  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
    private settingsService: SettingsService,
  ) {}

  /**
   * Check for uncaptured payments approaching authorization expiry
   * Runs every 6 hours
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async monitorUncapturedPayments() {
    this.logger.log('Starting uncaptured payment monitoring...');

    try {
      const captureStrategy = await this.settingsService.getSetting(
        'payment_capture_strategy',
      );

      // Only run if strategy includes fallback
      if (!captureStrategy?.value?.toString().includes('FALLBACK')) {
        this.logger.log('Auto-capture fallback not enabled, skipping');
        return;
      }

      const autoCaptureDay = parseInt(
        (await this.settingsService.getSetting('payment_auto_capture_day'))?.value?.toString() ||
          '6',
      );

      // Calculate cutoff date (Day N since payment authorized)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - autoCaptureDay);

      this.logger.log(
        `Looking for uncaptured payments older than ${autoCaptureDay} days (since ${cutoffDate.toISOString()})`,
      );

      // Find orders with uncaptured payments older than cutoff
      const ordersToCapture = await this.prisma.order.findMany({
        where: {
          paymentStatus: { in: ['PAID', 'AUTHORIZED'] },
          status: { notIn: ['DELIVERED', 'CANCELLED', 'REFUNDED'] },
          paidAt: { lte: cutoffDate },
          paymentTransactions: {
            some: {
              status: { in: ['SUCCEEDED', 'REQUIRES_ACTION'] },
              OR: [
                {
                  metadata: {
                    equals: null,
                  },
                },
                {
                  metadata: {
                    path: ['capturedAt'],
                    equals: null,
                  },
                },
              ],
            },
          },
        },
        include: {
          paymentTransactions: true,
        },
      });

      this.logger.log(
        `Found ${ordersToCapture.length} orders requiring auto-capture fallback`,
      );

      let capturedCount = 0;
      let failedCount = 0;

      for (const order of ordersToCapture) {
        try {
          const result = await this.paymentService.capturePaymentWithStrategy(
            order.id,
            'AUTO_FALLBACK',
          );

          if (result.success) {
            capturedCount++;
            this.logger.log(
              `Auto-captured ${result.capturedAmount} ${order.currency} for order ${order.orderNumber}`,
            );
          }
        } catch (error) {
          failedCount++;
          this.logger.error(
            `Failed to auto-capture payment for order ${order.orderNumber}:`,
            error.message,
          );
        }
      }

      this.logger.log(
        `Auto-capture completed: ${capturedCount} succeeded, ${failedCount} failed`,
      );
    } catch (error) {
      this.logger.error('Error in uncaptured payment monitoring:', error);
    }
  }

  /**
   * Get orders approaching authorization expiry for admin dashboard
   * Returns orders that are 5+ days old and still uncaptured
   */
  async getOrdersApproachingExpiry() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 5); // Day 5+ orders

    const orders = await this.prisma.order.findMany({
      where: {
        paymentStatus: { in: ['PAID', 'AUTHORIZED'] },
        status: { notIn: ['DELIVERED', 'CANCELLED', 'REFUNDED'] },
        paidAt: { lte: cutoffDate },
        paymentTransactions: {
          some: {
            status: { in: ['SUCCEEDED', 'REQUIRES_ACTION'] },
            OR: [
              {
                metadata: {
                  equals: null,
                },
              },
              {
                metadata: {
                  path: ['capturedAt'],
                  equals: null,
                },
              },
            ],
          },
        },
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        currency: true,
        paidAt: true,
        status: true,
        paymentStatus: true,
        user: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { paidAt: 'asc' },
    });

    // Calculate days until expiry for each order
    return orders.map((order) => {
      const daysSincePaid = Math.floor(
        (Date.now() - new Date(order.paidAt).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const daysUntilExpiry = 7 - daysSincePaid;

      return {
        ...order,
        daysSincePaid,
        daysUntilExpiry,
        isUrgent: daysUntilExpiry <= 1,
      };
    });
  }

  /**
   * Get uncaptured payment statistics
   */
  async getUncapturedPaymentStats() {
    const totalUncaptured = await this.prisma.order.count({
      where: {
        paymentStatus: { in: ['PAID', 'AUTHORIZED'] },
        status: { notIn: ['DELIVERED', 'CANCELLED', 'REFUNDED'] },
        paymentTransactions: {
          some: {
            status: { in: ['SUCCEEDED', 'REQUIRES_ACTION'] },
            OR: [
              {
                metadata: {
                  equals: null,
                },
              },
              {
                metadata: {
                  path: ['capturedAt'],
                  equals: null,
                },
              },
            ],
          },
        },
      },
    });

    const ordersApproachingExpiry = await this.getOrdersApproachingExpiry();

    const urgentOrders = ordersApproachingExpiry.filter(
      (order) => order.isUrgent,
    );

    return {
      totalUncaptured,
      approachingExpiry: ordersApproachingExpiry.length,
      urgent: urgentOrders.length,
      oldestOrder: ordersApproachingExpiry[0] || null,
    };
  }
}
