import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PayoutStatus } from '@prisma/client';

@Injectable()
export class DeliveryPayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all delivery provider payouts with optional filters
   */
  async findAll(filters: { status?: PayoutStatus; providerId?: string }) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.providerId) {
      where.providerId = filters.providerId;
    }

    const payouts = await this.prisma.deliveryProviderPayout.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            contactEmail: true,
            logo: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: payouts,
    };
  }

  /**
   * Get a single payout by ID
   */
  async findOne(id: string) {
    const payout = await this.prisma.deliveryProviderPayout.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            contactEmail: true,
            contactPhone: true,
            logo: true,
          },
        },
      },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    return payout;
  }

  /**
   * Process a pending payout (mark as processing)
   */
  async processPayout(
    id: string,
    data: {
      paymentMethod: string;
      paymentReference?: string;
      notes?: string;
    },
    adminUserId: string
  ) {
    const payout = await this.findOne(id);

    if (payout.status !== 'PENDING') {
      throw new BadRequestException('Only pending payouts can be processed');
    }

    const updated = await this.prisma.deliveryProviderPayout.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
        notes: data.notes,
        processedAt: new Date(),
        processedBy: adminUserId,
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            contactEmail: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Payout is being processed',
      data: updated,
    };
  }

  /**
   * Complete a payout
   */
  async completePayout(id: string) {
    const payout = await this.findOne(id);

    if (payout.status !== 'PROCESSING') {
      throw new BadRequestException('Only processing payouts can be completed');
    }

    const updated = await this.prisma.deliveryProviderPayout.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            contactEmail: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Payout completed successfully',
      data: updated,
    };
  }

  /**
   * Cancel a payout
   */
  async cancelPayout(id: string, reason?: string) {
    const payout = await this.findOne(id);

    if (payout.status === 'COMPLETED') {
      throw new BadRequestException('Completed payouts cannot be cancelled');
    }

    if (payout.status === 'CANCELLED') {
      throw new BadRequestException('Payout is already cancelled');
    }

    const updated = await this.prisma.deliveryProviderPayout.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `Cancelled: ${reason}` : payout.notes,
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            contactEmail: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Payout cancelled',
      data: updated,
    };
  }

  /**
   * Create a new payout for a delivery provider
   */
  async createPayout(data: {
    providerId: string;
    amount: number;
    periodStart: Date;
    periodEnd: Date;
    deliveryCount: number;
    currency?: string;
  }) {
    // Verify provider exists
    const provider = await this.prisma.deliveryProvider.findUnique({
      where: { id: data.providerId },
    });

    if (!provider) {
      throw new NotFoundException('Delivery provider not found');
    }

    const payout = await this.prisma.deliveryProviderPayout.create({
      data: {
        providerId: data.providerId,
        amount: data.amount,
        currency: data.currency || 'USD',
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        deliveryCount: data.deliveryCount,
        status: 'PENDING',
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            contactEmail: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Payout created successfully',
      data: payout,
    };
  }

  /**
   * Get payout statistics
   */
  async getStats() {
    const [pending, processing, completed, failed] = await Promise.all([
      this.prisma.deliveryProviderPayout.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.deliveryProviderPayout.aggregate({
        where: { status: 'PROCESSING' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.deliveryProviderPayout.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.deliveryProviderPayout.aggregate({
        where: { status: 'FAILED' },
        _count: true,
      }),
    ]);

    return {
      pending: {
        count: pending._count,
        amount: pending._sum.amount || 0,
      },
      processing: {
        count: processing._count,
        amount: processing._sum.amount || 0,
      },
      completed: {
        count: completed._count,
        amount: completed._sum.amount || 0,
      },
      failed: {
        count: failed._count,
      },
    };
  }
}
