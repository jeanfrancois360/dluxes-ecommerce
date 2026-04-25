import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';
import { ConfigService } from '@nestjs/config';

const DISPATCH_REMINDER_HOURS = 48;

/**
 * Sends a reminder email to sellers who have not purchased a shipping label
 * within 48 hours of a paid order being placed.
 */
@Injectable()
export class EasyPostDispatchReminderCron {
  private readonly logger = new Logger(EasyPostDispatchReminderCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Run every hour. Finds PAID orders older than 48h with no EasyPost label and
   * sends a reminder to the associated seller.
   */
  @Cron('0 * * * *', {
    name: 'easypost-dispatch-reminder',
    timeZone: 'UTC',
  })
  async handleDispatchReminder() {
    this.logger.log('Checking for unshipped orders past 48h...');

    try {
      const cutoff = new Date(Date.now() - DISPATCH_REMINDER_HOURS * 60 * 60 * 1000);

      // Orders paid > 48h ago, not yet fully cancelled/delivered
      const overdueOrders = await this.prisma.order.findMany({
        where: {
          paymentStatus: 'PAID',
          status: { in: ['PENDING', 'PROCESSING', 'CONFIRMED'] },
          createdAt: { lt: cutoff },
          // No EasyPost shipment exists for this order
          NOT: {
            id: {
              in: (
                await this.prisma.easyPostShipment.findMany({
                  select: { orderId: true },
                  where: { status: { not: 'PENDING' } },
                })
              ).map((s) => s.orderId),
            },
          },
        },
        include: {
          items: {
            take: 1,
            include: {
              product: {
                include: {
                  store: {
                    include: { user: true },
                  },
                },
              },
            },
          },
        },
      });

      if (overdueOrders.length === 0) {
        this.logger.log('No unshipped overdue orders found.');
        return;
      }

      this.logger.log(`Found ${overdueOrders.length} overdue order(s). Sending reminders...`);

      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      let sent = 0;

      for (const order of overdueOrders) {
        const sellerItem = order.items[0];
        const store = sellerItem?.product?.store;
        if (!store?.user) continue;

        const seller = store.user;
        const hoursOverdue = Math.floor(
          (Date.now() - order.createdAt.getTime()) / (60 * 60 * 1000)
        );

        await this.emailService.sendSellerDispatchReminder(seller.email, {
          sellerName: `${seller.firstName} ${seller.lastName}`,
          storeName: store.name,
          orderNumber: order.orderNumber,
          orderId: order.id,
          orderUrl: `${frontendUrl}/seller/orders/${order.id}`,
          hoursOverdue,
        });

        sent++;
      }

      this.logger.log(`Dispatch reminders sent: ${sent}`);
    } catch (error) {
      this.logger.error('Failed to process dispatch reminders', error);
      throw error;
    }
  }
}
