import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EscrowStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create escrow transaction after successful payment
   * This wraps the existing payment flow without modifying it
   */
  async createEscrowTransaction(data: {
    orderId: string;
    paymentTransactionId: string;
    sellerId: string;
    storeId: string;
    totalAmount: number;
    platformFee: number;
    currency: string;
    holdPeriodDays?: number; // Optional, defaults from system settings or env var
  }) {
    const sellerAmount = new Decimal(data.totalAmount).minus(data.platformFee);
    const holdPeriodDays = data.holdPeriodDays || parseInt(process.env.ESCROW_DEFAULT_HOLD_DAYS || '7');
    const autoReleaseDate = new Date(Date.now() + holdPeriodDays * 24 * 60 * 60 * 1000);

    const escrow = await this.prisma.escrowTransaction.create({
      data: {
        orderId: data.orderId,
        paymentTransactionId: data.paymentTransactionId,
        sellerId: data.sellerId,
        storeId: data.storeId,
        totalAmount: new Decimal(data.totalAmount),
        platformFee: new Decimal(data.platformFee),
        sellerAmount,
        currency: data.currency,
        status: EscrowStatus.HELD,
        holdPeriodDays,
        autoReleaseAt: autoReleaseDate,
      },
    });

    this.logger.log(
      `Escrow created for order ${data.orderId}: ${sellerAmount} ${data.currency} (held until ${autoReleaseDate.toISOString()})`
    );

    return escrow;
  }

  /**
   * Get escrow transaction by order ID
   */
  async getEscrowByOrderId(orderId: string) {
    const escrow = await this.prisma.escrowTransaction.findFirst({
      where: { orderId },
      include: {
        order: {
          select: {
            orderNumber: true,
            status: true,
          },
        },
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
      },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow transaction not found');
    }

    return escrow;
  }

  /**
   * Confirm delivery - triggers escrow release countdown
   */
  async confirmDelivery(orderId: string, confirmedBy: string, confirmationType: string) {
    const escrow = await this.prisma.escrowTransaction.findFirst({
      where: { orderId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow transaction not found');
    }

    if (escrow.status !== EscrowStatus.HELD) {
      throw new BadRequestException(`Cannot confirm delivery for escrow with status ${escrow.status}`);
    }

    // Calculate auto-release date
    const autoReleaseAt = new Date(Date.now() + escrow.holdPeriodDays * 24 * 60 * 60 * 1000);

    // Update escrow status
    const updatedEscrow = await this.prisma.escrowTransaction.update({
      where: { id: escrow.id },
      data: {
        deliveryConfirmed: true,
        deliveryConfirmedAt: new Date(),
        deliveryConfirmedBy: confirmedBy,
        status: EscrowStatus.PENDING_RELEASE,
        autoReleaseAt,
      },
    });

    // Create delivery confirmation record
    await this.prisma.deliveryConfirmation.create({
      data: {
        orderId,
        confirmedBy,
        confirmationType: confirmationType as any,
        actualDeliveryDate: new Date(),
      },
    });

    this.logger.log(
      `Delivery confirmed for order ${orderId}. Auto-release scheduled for ${autoReleaseAt.toISOString()}`
    );

    return updatedEscrow;
  }

  /**
   * Release escrow to seller
   */
  async releaseEscrow(escrowId: string, releasedBy: string) {
    const escrow = await this.prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
      include: {
        seller: true,
        order: true,
      },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow transaction not found');
    }

    if (escrow.status !== EscrowStatus.HELD && escrow.status !== EscrowStatus.PENDING_RELEASE) {
      throw new BadRequestException(`Cannot release escrow with status ${escrow.status}`);
    }

    await this.prisma.$transaction(async (prisma) => {
      // Update escrow status
      await prisma.escrowTransaction.update({
        where: { id: escrowId },
        data: {
          status: EscrowStatus.RELEASED,
          releasedAt: new Date(),
          releasedBy,
        },
      });

      // Update order status if needed
      await prisma.order.update({
        where: { id: escrow.orderId },
        data: {
          status: 'COMPLETED' as any,
        },
      });

      // Create order timeline entry
      await prisma.orderTimeline.create({
        data: {
          orderId: escrow.orderId,
          status: 'COMPLETED' as any,
          title: 'Payment Released to Seller',
          description: `Escrow funds of ${escrow.sellerAmount} ${escrow.currency} released to seller`,
          icon: 'check-circle',
        },
      });
    });

    this.logger.log(
      `Escrow released for ${escrow.sellerId}: ${escrow.sellerAmount} ${escrow.currency} (Order: ${escrow.orderId})`
    );

    return escrow;
  }

  /**
   * Refund escrow to buyer
   */
  async refundEscrow(escrowId: string, refundReason: string) {
    const escrow = await this.prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
      include: {
        order: true,
      },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow transaction not found');
    }

    if (escrow.status === EscrowStatus.RELEASED) {
      throw new BadRequestException('Cannot refund already released escrow');
    }

    await this.prisma.$transaction(async (prisma) => {
      // Update escrow status
      await prisma.escrowTransaction.update({
        where: { id: escrowId },
        data: {
          status: EscrowStatus.REFUNDED,
          refundedAt: new Date(),
          refundReason,
        },
      });

      // Update order status
      await prisma.order.update({
        where: { id: escrow.orderId },
        data: {
          status: 'REFUNDED' as any,
          paymentStatus: 'REFUNDED' as any,
        },
      });

      // Create order timeline entry
      await prisma.orderTimeline.create({
        data: {
          orderId: escrow.orderId,
          status: 'REFUNDED' as any,
          title: 'Escrow Refunded',
          description: `Escrow funds refunded to buyer. Reason: ${refundReason}`,
          icon: 'undo',
        },
      });
    });

    this.logger.log(`Escrow refunded for order ${escrow.orderId}: ${refundReason}`);

    return escrow;
  }

  /**
   * Auto-release escrows that have passed hold period
   * Called by cron job/scheduler
   */
  async autoReleaseExpiredEscrows() {
    const now = new Date();

    const expiredEscrows = await this.prisma.escrowTransaction.findMany({
      where: {
        status: EscrowStatus.PENDING_RELEASE,
        autoReleaseAt: { lte: now },
      },
      take: 50, // Process 50 at a time
    });

    this.logger.log(`Processing ${expiredEscrows.length} expired escrows for auto-release`);

    let successCount = 0;
    let failCount = 0;

    for (const escrow of expiredEscrows) {
      try {
        await this.releaseEscrow(escrow.id, 'SYSTEM_AUTO_RELEASE');
        successCount++;
      } catch (error) {
        this.logger.error(`Failed to auto-release escrow ${escrow.id}:`, error);
        failCount++;
      }
    }

    this.logger.log(
      `Auto-release completed: ${successCount} successful, ${failCount} failed`
    );

    return {
      processed: expiredEscrows.length,
      successful: successCount,
      failed: failCount,
    };
  }

  /**
   * Get seller's escrow summary
   */
  async getSellerEscrowSummary(sellerId: string) {
    const [held, pendingRelease, released, refunded] = await Promise.all([
      this.prisma.escrowTransaction.aggregate({
        where: { sellerId, status: EscrowStatus.HELD },
        _sum: { sellerAmount: true },
        _count: true,
      }),
      this.prisma.escrowTransaction.aggregate({
        where: { sellerId, status: EscrowStatus.PENDING_RELEASE },
        _sum: { sellerAmount: true },
        _count: true,
      }),
      this.prisma.escrowTransaction.aggregate({
        where: { sellerId, status: EscrowStatus.RELEASED },
        _sum: { sellerAmount: true },
        _count: true,
      }),
      this.prisma.escrowTransaction.aggregate({
        where: { sellerId, status: EscrowStatus.REFUNDED },
        _sum: { sellerAmount: true },
        _count: true,
      }),
    ]);

    return {
      held: {
        amount: held._sum.sellerAmount || 0,
        count: held._count,
      },
      pendingRelease: {
        amount: pendingRelease._sum.sellerAmount || 0,
        count: pendingRelease._count,
      },
      released: {
        amount: released._sum.sellerAmount || 0,
        count: released._count,
      },
      refunded: {
        amount: refunded._sum.sellerAmount || 0,
        count: refunded._count,
      },
      availableForPayout: released._sum.sellerAmount || 0,
    };
  }

  /**
   * Get escrow transactions for a seller
   */
  async getSellerEscrows(sellerId: string, filters?: {
    status?: EscrowStatus;
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

    const [escrows, total] = await Promise.all([
      this.prisma.escrowTransaction.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              createdAt: true,
            },
          },
          store: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.escrowTransaction.count({ where }),
    ]);

    return {
      data: escrows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all escrows (Admin only)
   */
  async getAllEscrows(filters?: {
    status?: EscrowStatus;
    sellerId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.sellerId && { sellerId: filters.sellerId }),
    };

    const [escrows, total] = await Promise.all([
      this.prisma.escrowTransaction.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              createdAt: true,
            },
          },
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.escrowTransaction.count({ where }),
    ]);

    return {
      data: escrows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get escrow statistics (Admin dashboard)
   */
  async getEscrowStatistics() {
    const [held, pendingRelease, released, refunded, disputed] = await Promise.all([
      this.prisma.escrowTransaction.aggregate({
        where: { status: EscrowStatus.HELD },
        _sum: { totalAmount: true, sellerAmount: true, platformFee: true },
        _count: true,
      }),
      this.prisma.escrowTransaction.aggregate({
        where: { status: EscrowStatus.PENDING_RELEASE },
        _sum: { totalAmount: true, sellerAmount: true, platformFee: true },
        _count: true,
      }),
      this.prisma.escrowTransaction.aggregate({
        where: { status: EscrowStatus.RELEASED },
        _sum: { totalAmount: true, sellerAmount: true, platformFee: true },
        _count: true,
      }),
      this.prisma.escrowTransaction.aggregate({
        where: { status: EscrowStatus.REFUNDED },
        _sum: { totalAmount: true, sellerAmount: true, platformFee: true },
        _count: true,
      }),
      this.prisma.escrowTransaction.aggregate({
        where: { status: EscrowStatus.DISPUTED },
        _sum: { totalAmount: true, sellerAmount: true, platformFee: true },
        _count: true,
      }),
    ]);

    return {
      held: {
        amount: held._sum.totalAmount || 0,
        sellerAmount: held._sum.sellerAmount || 0,
        platformFee: held._sum.platformFee || 0,
        count: held._count,
      },
      pendingRelease: {
        amount: pendingRelease._sum.totalAmount || 0,
        sellerAmount: pendingRelease._sum.sellerAmount || 0,
        platformFee: pendingRelease._sum.platformFee || 0,
        count: pendingRelease._count,
      },
      released: {
        amount: released._sum.totalAmount || 0,
        sellerAmount: released._sum.sellerAmount || 0,
        platformFee: released._sum.platformFee || 0,
        count: released._count,
      },
      refunded: {
        amount: refunded._sum.totalAmount || 0,
        sellerAmount: refunded._sum.sellerAmount || 0,
        platformFee: refunded._sum.platformFee || 0,
        count: refunded._count,
      },
      disputed: {
        amount: disputed._sum.totalAmount || 0,
        sellerAmount: disputed._sum.sellerAmount || 0,
        platformFee: disputed._sum.platformFee || 0,
        count: disputed._count,
      },
    };
  }
}
