import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { CommissionStatus, PayoutStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Payout Service
 * Handles seller payout batches and commission disbursement
 */
@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Create a payout batch for a seller
   */
  async createPayout(data: {
    sellerId: string;
    storeId: string;
    periodStart: Date;
    periodEnd: Date;
    paymentMethod: string;
    notes?: string;
  }) {
    // Get all confirmed commissions in the period
    const commissions = await this.prisma.commission.findMany({
      where: {
        sellerId: data.sellerId,
        storeId: data.storeId,
        status: CommissionStatus.CONFIRMED,
        paidOut: false,
        createdAt: {
          gte: data.periodStart,
          lte: data.periodEnd,
        },
      },
    });

    if (commissions.length === 0) {
      throw new BadRequestException('No confirmed commissions found for this period');
    }

    // Calculate total amount
    const totalAmount = commissions.reduce(
      (sum, commission) => sum.add(commission.commissionAmount),
      new Decimal(0)
    );

    // Check minimum payout amount from settings
    const minPayoutAmount = await this.getMinimumPayoutAmount();
    if (totalAmount.lessThan(minPayoutAmount)) {
      throw new BadRequestException(
        `Payout amount $${totalAmount} is less than minimum required $${minPayoutAmount}`
      );
    }

    // Create payout in a transaction
    const payout = await this.prisma.$transaction(async (prisma) => {
      // Create payout
      const newPayout = await prisma.payout.create({
        data: {
          sellerId: data.sellerId,
          storeId: data.storeId,
          amount: totalAmount,
          commissionCount: commissions.length,
          paymentMethod: data.paymentMethod,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          notes: data.notes,
          status: PayoutStatus.PENDING,
        },
      });

      // Link commissions to payout
      await prisma.commission.updateMany({
        where: {
          id: { in: commissions.map((c) => c.id) },
        },
        data: {
          payoutId: newPayout.id,
        },
      });

      return newPayout;
    });

    this.logger.log(
      `Created payout ${payout.id} for seller ${data.sellerId}: ${totalAmount} (${commissions.length} commissions)`
    );

    return payout;
  }

  /**
   * Get seller's payouts
   */
  async getSellerPayouts(sellerId: string, filters?: {
    status?: PayoutStatus;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      sellerId,
      ...(filters?.status && { status: filters.status }),
    };

    const [payouts, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        include: {
          store: {
            select: {
              name: true,
              slug: true,
            },
          },
          _count: {
            select: { commissions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payout.count({ where }),
    ]);

    return {
      data: payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get payout details with commissions
   */
  async getPayoutDetails(id: string, sellerId?: string) {
    const payout = await this.prisma.payout.findFirst({
      where: {
        id,
        ...(sellerId && { sellerId }),
      },
      include: {
        seller: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        store: {
          select: {
            name: true,
            slug: true,
          },
        },
        commissions: {
          include: {
            order: {
              select: {
                orderNumber: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!payout) {
      throw new BadRequestException('Payout not found');
    }

    return payout;
  }

  /**
   * Process payout (Admin only)
   * Marks payout as processing and updates status
   */
  async processPayout(id: string, data: {
    paymentReference?: string;
    paymentProof?: string;
  }) {
    const payout = await this.prisma.payout.findUnique({
      where: { id },
      include: { commissions: true },
    });

    if (!payout) {
      throw new BadRequestException('Payout not found');
    }

    if (payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException(`Cannot process payout with status ${payout.status}`);
    }

    return this.prisma.$transaction(async (prisma) => {
      // Update payout status
      const updatedPayout = await prisma.payout.update({
        where: { id },
        data: {
          status: PayoutStatus.PROCESSING,
          paymentReference: data.paymentReference,
          paymentProof: data.paymentProof,
        },
      });

      this.logger.log(`Processing payout ${id}`);

      return updatedPayout;
    });
  }

  /**
   * Complete payout (Admin only)
   * Marks payout and commissions as paid
   */
  async completePayout(id: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id },
      include: { commissions: true },
    });

    if (!payout) {
      throw new BadRequestException('Payout not found');
    }

    if (payout.status !== PayoutStatus.PENDING && payout.status !== PayoutStatus.PROCESSING) {
      throw new BadRequestException(`Cannot complete payout with status ${payout.status}`);
    }

    return this.prisma.$transaction(async (prisma) => {
      // Update payout status
      const updatedPayout = await prisma.payout.update({
        where: { id },
        data: {
          status: PayoutStatus.COMPLETED,
          processedAt: new Date(),
        },
      });

      // Mark all commissions as paid
      await prisma.commission.updateMany({
        where: { payoutId: id },
        data: {
          status: CommissionStatus.PAID,
          paidOut: true,
          paidOutAt: new Date(),
          payoutMethod: payout.paymentMethod,
          payoutReference: payout.paymentReference || undefined,
        },
      });

      this.logger.log(
        `Completed payout ${id}: ${payout.commissionCount} commissions marked as paid`
      );

      return updatedPayout;
    });
  }

  /**
   * Fail payout (Admin only)
   */
  async failPayout(id: string, reason?: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id },
    });

    if (!payout) {
      throw new BadRequestException('Payout not found');
    }

    return this.prisma.$transaction(async (prisma) => {
      // Update payout status
      const updatedPayout = await prisma.payout.update({
        where: { id },
        data: {
          status: PayoutStatus.FAILED,
          notes: reason ? `${payout.notes || ''}\nFailure reason: ${reason}` : payout.notes,
        },
      });

      // Unlink commissions from payout
      await prisma.commission.updateMany({
        where: { payoutId: id },
        data: {
          payoutId: null,
        },
      });

      this.logger.warn(`Failed payout ${id}: ${reason || 'No reason provided'}`);

      return updatedPayout;
    });
  }

  /**
   * Cancel payout
   */
  async cancelPayout(id: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id },
    });

    if (!payout) {
      throw new BadRequestException('Payout not found');
    }

    if (payout.status === PayoutStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed payout');
    }

    return this.prisma.$transaction(async (prisma) => {
      // Update payout status
      const updatedPayout = await prisma.payout.update({
        where: { id },
        data: {
          status: PayoutStatus.CANCELLED,
        },
      });

      // Unlink commissions from payout
      await prisma.commission.updateMany({
        where: { payoutId: id },
        data: {
          payoutId: null,
        },
      });

      this.logger.log(`Cancelled payout ${id}`);

      return updatedPayout;
    });
  }

  /**
   * Get all payouts (Admin only)
   */
  async getAllPayouts(filters?: {
    status?: PayoutStatus;
    sellerId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.sellerId && { sellerId: filters.sellerId }),
      ...(filters?.startDate &&
        filters?.endDate && {
          periodStart: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
    };

    const [payouts, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        include: {
          seller: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          store: {
            select: {
              name: true,
              slug: true,
            },
          },
          _count: {
            select: { commissions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payout.count({ where }),
    ]);

    return {
      data: payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get payout statistics (Admin dashboard)
   */
  async getPayoutStatistics(filters?: {
    sellerId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {
      ...(filters?.sellerId && { sellerId: filters.sellerId }),
      ...(filters?.startDate &&
        filters?.endDate && {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
    };

    const [total, pending, processing, completed, failed] = await Promise.all([
      this.prisma.payout.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payout.aggregate({
        where: { ...where, status: PayoutStatus.PENDING },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payout.aggregate({
        where: { ...where, status: PayoutStatus.PROCESSING },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payout.aggregate({
        where: { ...where, status: PayoutStatus.COMPLETED },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payout.aggregate({
        where: { ...where, status: PayoutStatus.FAILED },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      total: {
        amount: total._sum.amount || 0,
        count: total._count,
      },
      pending: {
        amount: pending._sum.amount || 0,
        count: pending._count,
      },
      processing: {
        amount: processing._sum.amount || 0,
        count: processing._count,
      },
      completed: {
        amount: completed._sum.amount || 0,
        count: completed._count,
      },
      failed: {
        amount: failed._sum.amount || 0,
        count: failed._count,
      },
    };
  }

  /**
   * Get pending payouts for admin dashboard
   */
  async getPendingPayouts(limit: number = 10) {
    return this.prisma.payout.findMany({
      where: {
        status: { in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] },
      },
      include: {
        seller: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        store: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  /**
   * Get minimum payout amount from settings
   * Falls back to env variable or hardcoded value
   */
  private async getMinimumPayoutAmount(): Promise<Decimal> {
    try {
      const setting = await this.settingsService.getSetting('payout.minimum_amount');
      const amount = Number(setting.value);
      if (amount && !isNaN(amount)) {
        return new Decimal(amount);
      }
    } catch (error) {
      this.logger.warn('Minimum payout amount setting not found, using fallback');
    }

    // Fallback to env variable or hardcoded $50
    const envAmount = process.env.PAYOUT_MIN_AMOUNT;
    if (envAmount) {
      return new Decimal(parseFloat(envAmount));
    }

    return new Decimal(50);
  }

  /**
   * Check if automated payout scheduling is enabled
   */
  private async isAutoScheduleEnabled(): Promise<boolean> {
    try {
      const setting = await this.settingsService.getSetting('payout.auto_schedule_enabled');
      return setting.value === 'true' || setting.value === true;
    } catch (error) {
      this.logger.warn('Auto schedule setting not found, defaulting to true');
      return true;
    }
  }

  /**
   * Get default payout frequency from settings
   */
  private async getDefaultPayoutFrequency(): Promise<string> {
    try {
      const setting = await this.settingsService.getSetting('payout.default_frequency');
      return String(setting.value) || 'WEEKLY';
    } catch (error) {
      this.logger.warn('Default payout frequency setting not found, using WEEKLY');
      return 'WEEKLY';
    }
  }
}
