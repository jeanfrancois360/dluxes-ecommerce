import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(private readonly prisma: PrismaService) {}

  async subscribe(email: string, source: string = 'homepage', ipAddress?: string) {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if already subscribed
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      if (existing.isActive) {
        return { alreadySubscribed: true, message: 'You are already subscribed!' };
      }

      // Re-activate
      await this.prisma.newsletterSubscriber.update({
        where: { email: normalizedEmail },
        data: {
          isActive: true,
          unsubscribedAt: null,
          source,
          subscribedAt: new Date(),
        },
      });

      this.logger.log(`Newsletter re-subscription: ${normalizedEmail}`);
      return { alreadySubscribed: false, message: 'Welcome back! You have been re-subscribed.' };
    }

    await this.prisma.newsletterSubscriber.create({
      data: {
        email: normalizedEmail,
        source,
        ipAddress,
      },
    });

    this.logger.log(`New newsletter subscriber: ${normalizedEmail} (source: ${source})`);
    return { alreadySubscribed: false, message: 'Successfully subscribed to our newsletter!' };
  }

  async unsubscribe(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const subscriber = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (!subscriber || !subscriber.isActive) {
      return { message: 'Email not found or already unsubscribed.' };
    }

    await this.prisma.newsletterSubscriber.update({
      where: { email: normalizedEmail },
      data: { isActive: false, unsubscribedAt: new Date() },
    });

    this.logger.log(`Newsletter unsubscription: ${normalizedEmail}`);
    return { message: 'You have been unsubscribed from our newsletter.' };
  }

  async getStats() {
    const [active, total] = await Promise.all([
      this.prisma.newsletterSubscriber.count({ where: { isActive: true } }),
      this.prisma.newsletterSubscriber.count(),
    ]);

    return { active, total, unsubscribed: total - active };
  }
}
