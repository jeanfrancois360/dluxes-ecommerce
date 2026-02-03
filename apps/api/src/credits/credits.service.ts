import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { CreditTransactionType } from '@prisma/client';

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Get or create credit balance for user
   */
  async getOrCreateBalance(userId: string) {
    let balance = await this.prisma.creditBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      // Check for new seller bonus
      let bonusCredits = 0;
      try {
        const setting = await this.settingsService.getSetting(
          'new_seller_bonus_credits',
        );
        bonusCredits = Number(setting.value) || 0;
      } catch {
        // No bonus
      }

      balance = await this.prisma.creditBalance.create({
        data: {
          userId,
          availableCredits: bonusCredits,
          lifetimeCredits: bonusCredits,
          purchasedCredits: 0,
        },
      });

      if (bonusCredits > 0) {
        await this.recordTransaction(balance.id, {
          type: 'BONUS',
          amount: bonusCredits,
          balanceBefore: 0,
          balanceAfter: bonusCredits,
          action: 'new_seller_bonus',
          description: 'Welcome bonus for new sellers',
        });
        this.logger.log(
          `Granted ${bonusCredits} bonus credits to user ${userId}`,
        );
      }
    }

    return balance;
  }

  /**
   * Get credit cost for an action
   */
  async getCreditCost(action: string): Promise<number> {
    const key = `credit_cost_${action}`;
    try {
      const setting = await this.settingsService.getSetting(key);
      return Number(setting.value) || 1;
    } catch {
      return 1; // Default cost
    }
  }

  /**
   * Check if user has enough credits
   */
  async hasCredits(
    userId: string,
    action: string,
  ): Promise<{
    hasCredits: boolean;
    required: number;
    available: number;
  }> {
    const balance = await this.getOrCreateBalance(userId);
    const required = await this.getCreditCost(action);
    return {
      hasCredits: balance.availableCredits >= required,
      required,
      available: balance.availableCredits,
    };
  }

  /**
   * Debit credits from user
   */
  async debitCredits(
    userId: string,
    action: string,
    description?: string,
    productId?: string,
  ) {
    const balance = await this.getOrCreateBalance(userId);
    const cost = await this.getCreditCost(action);

    if (balance.availableCredits < cost) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${cost}, Available: ${balance.availableCredits}`,
      );
    }

    const newBalance = balance.availableCredits - cost;

    await this.prisma.$transaction(async (tx) => {
      await tx.creditBalance.update({
        where: { id: balance.id },
        data: {
          availableCredits: newBalance,
          lifetimeUsed: { increment: cost },
        },
      });

      await tx.creditTransaction.create({
        data: {
          balanceId: balance.id,
          type: 'DEBIT',
          amount: -cost,
          balanceBefore: balance.availableCredits,
          balanceAfter: newBalance,
          action,
          description: description || `Used ${cost} credits for ${action}`,
          productId,
        },
      });
    });

    this.logger.log(`Debited ${cost} credits from user ${userId} for ${action}`);

    return { debited: cost, remaining: newBalance };
  }

  /**
   * Add credits to user (purchase, refund, bonus)
   */
  async addCredits(
    userId: string,
    amount: number,
    type: CreditTransactionType,
    action: string,
    description?: string,
    packageId?: string,
    performedBy?: string,
  ) {
    const balance = await this.getOrCreateBalance(userId);
    const newBalance = balance.availableCredits + amount;

    await this.prisma.$transaction(async (tx) => {
      const updateData: {
        availableCredits: number;
        lifetimeCredits: { increment: number };
        purchasedCredits?: { increment: number };
      } = {
        availableCredits: newBalance,
        lifetimeCredits: { increment: amount },
      };

      if (type === 'PURCHASE') {
        updateData.purchasedCredits = { increment: amount };
      }

      await tx.creditBalance.update({
        where: { id: balance.id },
        data: updateData,
      });

      await tx.creditTransaction.create({
        data: {
          balanceId: balance.id,
          type,
          amount,
          balanceBefore: balance.availableCredits,
          balanceAfter: newBalance,
          action,
          description,
          packageId,
          performedBy,
        },
      });
    });

    this.logger.log(`Added ${amount} credits to user ${userId} (${type})`);

    return { added: amount, newBalance };
  }

  /**
   * Record a transaction (internal helper)
   */
  private async recordTransaction(
    balanceId: string,
    data: {
      type: CreditTransactionType;
      amount: number;
      balanceBefore: number;
      balanceAfter: number;
      action?: string;
      description?: string;
      productId?: string;
      packageId?: string;
      performedBy?: string;
    },
  ) {
    return this.prisma.creditTransaction.create({
      data: {
        balanceId,
        ...data,
      },
    });
  }

  /**
   * Get all credit packages
   */
  async getPackages() {
    return this.prisma.creditPackage.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      type?: CreditTransactionType;
    },
  ) {
    const balance = await this.getOrCreateBalance(userId);
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: { balanceId: string; type?: CreditTransactionType } = {
      balanceId: balance.id,
    };
    if (options?.type) {
      where.type = options.type;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.creditTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.creditTransaction.count({ where }),
    ]);

    return {
      transactions,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }
}
