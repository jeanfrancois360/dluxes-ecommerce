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

  /**
   * Delete user account
   * Soft delete: anonymizes user data but preserves order history
   */
  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Prevent deletion of admin accounts through this endpoint
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      throw new Error('Admin accounts cannot be deleted through this endpoint');
    }

    // Verify password
    const bcrypt = await import('bcrypt');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // Generate anonymous identifier
    const anonymousId = `deleted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Soft delete: anonymize user data
    await this.prisma.$transaction(async (tx) => {
      // Delete user sessions
      await tx.userSession.deleteMany({
        where: { userId },
      });

      // Delete magic links
      await tx.magicLink.deleteMany({
        where: { userId },
      });

      // Delete cart
      await tx.cartItem.deleteMany({
        where: { cart: { userId } },
      });
      await tx.cart.deleteMany({
        where: { userId },
      });

      // Delete wishlist items
      await tx.wishlistItem.deleteMany({
        where: { userId },
      });

      // Delete user preferences
      await tx.userPreferences.deleteMany({
        where: { userId },
      });

      // Anonymize addresses (keep for order history)
      await tx.address.updateMany({
        where: { userId },
        data: {
          firstName: 'Deleted',
          lastName: 'User',
          phone: null,
        },
      });

      // Anonymize user but keep record for order history
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `${anonymousId}@deleted.account`,
          password: await bcrypt.hash(anonymousId, 10),
          firstName: 'Deleted',
          lastName: 'User',
          phone: null,
          avatar: null,
          isActive: false,
          emailVerified: false,
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });
    });

    return { success: true, message: 'Account deleted successfully' };
  }
}
