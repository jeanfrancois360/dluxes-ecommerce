import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        addresses: true,
        preferences: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        addresses: true,
        preferences: true,
      },
    });
  }

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }) {
    return this.prisma.user.create({
      data: {
        ...data,
        preferences: {
          create: {},
        },
      },
      include: {
        preferences: true,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        addresses: true,
        preferences: true,
      },
    });
  }

  /**
   * Get notification preferences for a user
   */
  async getNotificationPreferences(userId: string) {
    // First try to get existing preferences
    let preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = await this.prisma.userPreferences.create({
        data: { userId },
      });
    }

    return preferences;
  }

  /**
   * Update notification preferences for a user
   */
  async updateNotificationPreferences(userId: string, data: {
    // Master toggles
    notifications?: boolean;
    newsletter?: boolean;

    // Email preferences
    emailOrderConfirmation?: boolean;
    emailOrderShipped?: boolean;
    emailOrderDelivered?: boolean;
    emailPaymentReceipt?: boolean;
    emailRefundProcessed?: boolean;
    emailPromotions?: boolean;
    emailPriceDrops?: boolean;
    emailBackInStock?: boolean;
    emailReviewReminder?: boolean;
    emailSecurityAlerts?: boolean;

    // Push preferences
    pushOrderUpdates?: boolean;
    pushPromotions?: boolean;
    pushPriceDrops?: boolean;
    pushBackInStock?: boolean;
    pushSecurityAlerts?: boolean;
  }) {
    // Filter out undefined values
    const updateData: Record<string, boolean> = {};
    const allowedFields = [
      'notifications',
      'newsletter',
      'emailOrderConfirmation',
      'emailOrderShipped',
      'emailOrderDelivered',
      'emailPaymentReceipt',
      'emailRefundProcessed',
      'emailPromotions',
      'emailPriceDrops',
      'emailBackInStock',
      'emailReviewReminder',
      'emailSecurityAlerts',
      'pushOrderUpdates',
      'pushPromotions',
      'pushPriceDrops',
      'pushBackInStock',
      'pushSecurityAlerts',
    ];

    for (const field of allowedFields) {
      if (data[field as keyof typeof data] !== undefined) {
        updateData[field] = data[field as keyof typeof data] as boolean;
      }
    }

    // Upsert preferences
    return this.prisma.userPreferences.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
    });
  }
}
