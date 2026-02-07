import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PayoutStatus, CommissionStatus, PayoutFrequency, EscrowStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Payout Scheduler Service
 * Automated payout processing for sellers
 * Integrates with Escrow system to ensure secure fund releases
 */
@Injectable()
export class PayoutSchedulerService {
  private readonly logger = new Logger(PayoutSchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Process scheduled payouts based on configuration
   * This should be called by a cron job
   */
  async processScheduledPayouts() {
    this.logger.log('Starting scheduled payout processing...');

    // Get active payout schedule configuration
    const config = await this.getActivePayoutConfig();

    if (!config || !config.isAutomatic) {
      this.logger.log('Automated payouts are disabled');
      return {
        processed: 0,
        successful: 0,
        failed: 0,
        totalAmount: 0,
      };
    }

    // Find sellers eligible for payout
    const eligibleSellers = await this.findEligibleSellers(config);

    this.logger.log(`Found ${eligibleSellers.length} sellers eligible for payout`);

    let successCount = 0;
    let failCount = 0;
    let totalAmount = 0;

    for (const seller of eligibleSellers) {
      try {
        const payout = await this.createPayoutForSeller(seller.id, config);
        if (payout) {
          successCount++;
          totalAmount += payout.amount.toNumber();
          this.logger.log(
            `Payout created for seller ${seller.id}: ${payout.amount} ${payout.currency}`
          );
        }
      } catch (error) {
        this.logger.error(`Failed to create payout for seller ${seller.id}:`, error);
        failCount++;
      }
    }

    // Update next process time
    await this.updateNextProcessTime(config);

    this.logger.log(
      `Payout processing completed: ${successCount} successful, ${failCount} failed, total: $${totalAmount}`
    );

    return {
      processed: eligibleSellers.length,
      successful: successCount,
      failed: failCount,
      totalAmount,
    };
  }

  /**
   * Get active payout configuration
   */
  private async getActivePayoutConfig() {
    return this.prisma.payoutScheduleConfig.findFirst({
      where: {
        isActive: true,
        isAutomatic: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find sellers eligible for payout
   */
  private async findEligibleSellers(config: any) {
    const minPayoutAmount = config.minPayoutAmount.toNumber();

    // Find sellers with released escrow funds or confirmed commissions
    const eligibleFromEscrow = await this.prisma.user.findMany({
      where: {
        role: 'SELLER',
        escrowTransactions: {
          some: {
            status: EscrowStatus.RELEASED,
            releasedAt: {
              not: null,
            },
          },
        },
      },
      include: {
        escrowTransactions: {
          where: {
            status: EscrowStatus.RELEASED,
          },
        },
        commissions: {
          where: {
            status: CommissionStatus.CONFIRMED,
            paidOut: false,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Filter by minimum payout amount
    return eligibleFromEscrow.filter((seller) => {
      const escrowTotal = seller.escrowTransactions.reduce(
        (sum, escrow) => sum + escrow.sellerAmount.toNumber(),
        0
      );
      const commissionTotal = seller.commissions.reduce(
        (sum, commission) => sum + commission.commissionAmount.toNumber(),
        0
      );
      const total = escrowTotal + commissionTotal;

      return total >= minPayoutAmount;
    });
  }

  /**
   * Create payout for a seller
   */
  private async createPayoutForSeller(sellerId: string, config: any) {
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      include: {
        store: true,
        escrowTransactions: {
          where: {
            status: EscrowStatus.RELEASED,
          },
        },
        commissions: {
          where: {
            status: CommissionStatus.CONFIRMED,
            paidOut: false,
          },
        },
      },
    });

    if (!seller || !seller.store) {
      this.logger.warn(`Seller ${sellerId} has no store, skipping payout`);
      return null;
    }

    // Calculate total amount from released escrow and confirmed commissions
    const escrowAmount = seller.escrowTransactions.reduce(
      (sum, escrow) => sum.add(escrow.sellerAmount),
      new Decimal(0)
    );

    const commissionAmount = seller.commissions.reduce(
      (sum, commission) => sum.add(commission.commissionAmount),
      new Decimal(0)
    );

    const totalAmount = escrowAmount.add(commissionAmount);

    if (totalAmount.toNumber() < config.minPayoutAmount.toNumber()) {
      return null;
    }

    // Determine payout period
    const now = new Date();
    const periodEnd = now;
    const periodStart = new Date(now);

    switch (config.frequency) {
      case PayoutFrequency.DAILY:
        periodStart.setDate(periodStart.getDate() - 1);
        break;
      case PayoutFrequency.WEEKLY:
        periodStart.setDate(periodStart.getDate() - 7);
        break;
      case PayoutFrequency.BIWEEKLY:
        periodStart.setDate(periodStart.getDate() - 14);
        break;
      case PayoutFrequency.MONTHLY:
        periodStart.setMonth(periodStart.getMonth() - 1);
        break;
    }

    // Create payout in transaction
    const payout = await this.prisma.$transaction(async (prisma) => {
      // Create payout record
      const newPayout = await prisma.payout.create({
        data: {
          sellerId,
          storeId: seller.store!.id,
          amount: totalAmount,
          currency: 'USD', // TODO: Make dynamic based on seller's currency
          commissionCount: seller.commissions.length,
          status: PayoutStatus.PENDING,
          paymentMethod: 'bank_transfer', // Default - can be configured per seller
          periodStart,
          periodEnd,
          scheduledAt: now,
          notes: `Automated payout - ${config.frequency}`,
        },
      });

      // Link commissions to payout
      const commissionIds = seller.commissions.map((c) => c.id);
      if (commissionIds.length > 0) {
        await prisma.commission.updateMany({
          where: { id: { in: commissionIds } },
          data: {
            payoutId: newPayout.id,
            paidOut: true,
            paidOutAt: now,
          },
        });
      }

      return newPayout;
    });

    return payout;
  }

  /**
   * Update next process time for the configuration
   */
  private async updateNextProcessTime(config: any) {
    const now = new Date();
    const nextProcess = new Date(now);

    switch (config.frequency) {
      case PayoutFrequency.DAILY:
        nextProcess.setDate(nextProcess.getDate() + 1);
        break;
      case PayoutFrequency.WEEKLY:
        nextProcess.setDate(nextProcess.getDate() + 7);
        // Set to specific day of week if configured
        if (config.dayOfWeek !== null) {
          while (nextProcess.getDay() !== config.dayOfWeek) {
            nextProcess.setDate(nextProcess.getDate() + 1);
          }
        }
        break;
      case PayoutFrequency.BIWEEKLY:
        nextProcess.setDate(nextProcess.getDate() + 14);
        break;
      case PayoutFrequency.MONTHLY:
        nextProcess.setMonth(nextProcess.getMonth() + 1);
        // Set to specific day of month if configured
        if (config.dayOfMonth !== null) {
          nextProcess.setDate(config.dayOfMonth);
        }
        break;
    }

    await this.prisma.payoutScheduleConfig.update({
      where: { id: config.id },
      data: {
        lastProcessedAt: now,
        nextProcessAt: nextProcess,
      },
    });
  }

  /**
   * Manually trigger payout for a seller (Admin only)
   */
  async triggerManualPayout(sellerId: string, adminId: string) {
    const config = await this.getActivePayoutConfig();

    if (!config) {
      // Use default config
      const defaultConfig = {
        minPayoutAmount: new Decimal(50),
        frequency: PayoutFrequency.ON_DEMAND,
      };

      return this.createPayoutForSeller(sellerId, defaultConfig);
    }

    return this.createPayoutForSeller(sellerId, config);
  }

  /**
   * Get payout schedule configuration
   */
  async getPayoutConfig() {
    return this.prisma.payoutScheduleConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update payout schedule configuration (Admin only)
   */
  async updatePayoutConfig(data: {
    frequency?: PayoutFrequency;
    dayOfWeek?: number;
    dayOfMonth?: number;
    minPayoutAmount?: number;
    holdPeriodDays?: number;
    isAutomatic?: boolean;
    isActive?: boolean;
    notifyBeforeDays?: number;
  }) {
    const existing = await this.getPayoutConfig();

    if (existing) {
      const updateData: any = { ...data };
      if (data.minPayoutAmount !== undefined) {
        updateData.minPayoutAmount = new Decimal(data.minPayoutAmount);
      }

      return this.prisma.payoutScheduleConfig.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      // Create new config
      return this.prisma.payoutScheduleConfig.create({
        data: {
          frequency: data.frequency || PayoutFrequency.WEEKLY,
          dayOfWeek: data.dayOfWeek,
          dayOfMonth: data.dayOfMonth,
          minPayoutAmount: new Decimal(data.minPayoutAmount || 50),
          holdPeriodDays: data.holdPeriodDays || 7,
          isAutomatic: data.isAutomatic ?? true,
          isActive: data.isActive ?? true,
          notifyBeforeDays: data.notifyBeforeDays || 1,
        },
      });
    }
  }

  /**
   * Get seller's pending payout amount
   */
  async getSellerPendingPayout(sellerId: string) {
    const [escrowReleased, commissionsConfirmed] = await Promise.all([
      this.prisma.escrowTransaction.aggregate({
        where: {
          sellerId,
          status: EscrowStatus.RELEASED,
        },
        _sum: { sellerAmount: true },
      }),
      this.prisma.commission.aggregate({
        where: {
          sellerId,
          status: CommissionStatus.CONFIRMED,
          paidOut: false,
        },
        _sum: { commissionAmount: true },
      }),
    ]);

    const escrowAmount = escrowReleased._sum.sellerAmount || new Decimal(0);
    const commissionAmount = commissionsConfirmed._sum.commissionAmount || new Decimal(0);
    const totalPending = escrowAmount.add(commissionAmount);

    return {
      escrowAmount: escrowAmount.toNumber(),
      commissionAmount: commissionAmount.toNumber(),
      totalPending: totalPending.toNumber(),
      currency: 'USD',
    };
  }

  /**
   * Mark payout as completed (Admin only - after actual payment)
   */
  async completePayout(payoutId: string, paymentReference?: string, paymentProof?: string) {
    return this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.COMPLETED,
        processedAt: new Date(),
        paymentReference,
        paymentProof,
      },
    });
  }

  /**
   * Mark payout as failed (Admin only)
   */
  async failPayout(payoutId: string, reason: string) {
    return this.prisma.$transaction(async (prisma) => {
      // Update payout status
      const payout = await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.FAILED,
          notes: `Failed: ${reason}`,
        },
      });

      // Unlink commissions so they can be included in next payout
      await prisma.commission.updateMany({
        where: { payoutId },
        data: {
          payoutId: null,
          paidOut: false,
          paidOutAt: null,
        },
      });

      return payout;
    });
  }
}
