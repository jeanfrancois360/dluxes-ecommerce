import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { EscrowStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

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
    holdPeriodDays?: number; // Optional, defaults from system settings
    bypassEscrow?: boolean; // For trusted sellers with immediate payout enabled
  }) {
    // Check if escrow system is enabled
    const escrowEnabled = await this.isEscrowEnabled();
    if (!escrowEnabled) {
      throw new BadRequestException('Escrow system is currently disabled. Please contact support.');
    }

    // Check if immediate payout is enabled and allowed for this seller
    if (data.bypassEscrow) {
      const immediatePayoutEnabled = await this.isImmediatePayoutEnabled();
      if (!immediatePayoutEnabled) {
        this.logger.warn(`Immediate payout attempted but disabled: Seller ${data.sellerId}`);
        throw new BadRequestException('Immediate payout is not available at this time.');
      }
    }

    const sellerAmount = new Decimal(data.totalAmount).minus(data.platformFee);

    // Get hold period from settings (with fallback to env var for backwards compatibility)
    let holdPeriodDays = data.holdPeriodDays;
    if (!holdPeriodDays) {
      try {
        const setting = await this.settingsService.getSetting('escrow_hold_period_days');
        holdPeriodDays = Number(setting.value) || 7;
      } catch (error) {
        // Fallback to env var if setting not found
        this.logger.warn('Escrow hold period setting not found, using env variable');
        holdPeriodDays = parseInt(process.env.ESCROW_DEFAULT_HOLD_DAYS || '7');
      }
    }

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

    // Audit log
    await this.logEscrowAction('CREATE', escrow.id, {
      orderId: data.orderId,
      sellerId: data.sellerId,
      totalAmount: data.totalAmount,
      platformFee: data.platformFee,
      sellerAmount: sellerAmount.toString(),
      currency: data.currency,
      holdPeriodDays,
      autoReleaseAt: autoReleaseDate.toISOString(),
    });

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

    // CHECK IF DELIVERY CONFIRMATION IS REQUIRED
    const confirmationRequired = await this.isDeliveryConfirmationRequired();
    if (confirmationRequired && !escrow.deliveryConfirmed) {
      throw new BadRequestException(
        'Delivery confirmation is required before releasing escrow. Please confirm delivery first.'
      );
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

    // Audit log
    await this.logEscrowAction('RELEASE', escrow.id, {
      sellerId: escrow.sellerId,
      sellerAmount: escrow.sellerAmount.toString(),
      currency: escrow.currency,
      orderId: escrow.orderId,
      releasedBy,
      releasedAt: new Date().toISOString(),
    }, releasedBy);

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

    // Audit log
    await this.logEscrowAction('REFUND', escrow.id, {
      orderId: escrow.orderId,
      totalAmount: escrow.totalAmount.toString(),
      currency: escrow.currency,
      refundReason,
      refundedAt: new Date().toISOString(),
    });

    return escrow;
  }

  /**
   * Auto-release escrows that have passed hold period
   * Called by cron job/scheduler
   */
  async autoReleaseExpiredEscrows() {
    // Check if auto-release is enabled
    const autoReleaseEnabled = await this.isAutoReleaseEnabled();
    if (!autoReleaseEnabled) {
      this.logger.log('Auto-release is disabled, skipping escrow auto-release');
      return {
        processed: 0,
        successful: 0,
        failed: 0,
      };
    }

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

  /**
   * Check if escrow system is enabled
   * Critical security setting - if disabled, no escrow transactions can be created
   */
  private async isEscrowEnabled(): Promise<boolean> {
    try {
      const setting = await this.settingsService.getSetting('escrow_enabled');
      return setting.value === 'true' || setting.value === true;
    } catch (error) {
      this.logger.warn('Escrow enabled setting not found, defaulting to true');
      return true; // Default to enabled for safety
    }
  }

  /**
   * Check if automatic release is enabled
   * Controls whether autoReleaseExpiredEscrows() should process releases
   */
  private async isAutoReleaseEnabled(): Promise<boolean> {
    try {
      const setting = await this.settingsService.getSetting('escrow.auto_release_enabled');
      return setting.value === 'true' || setting.value === true;
    } catch (error) {
      this.logger.warn('Auto release setting not found, defaulting to true');
      return true;
    }
  }

  /**
   * Check if immediate payout is enabled
   * Allows bypassing escrow for trusted sellers
   */
  private async isImmediatePayoutEnabled(): Promise<boolean> {
    try {
      const setting = await this.settingsService.getSetting('escrow.immediate_payout_enabled');
      return setting.value === 'true' || setting.value === true;
    } catch (error) {
      this.logger.warn('Immediate payout setting not found, defaulting to false');
      return false; // Default to disabled for security
    }
  }

  /**
   * Check if delivery confirmation is required before releasing escrow
   * Critical security setting - prevents premature fund release
   */
  private async isDeliveryConfirmationRequired(): Promise<boolean> {
    try {
      const setting = await this.settingsService.getSetting('delivery_confirmation_required');
      return setting.value === 'true' || setting.value === true;
    } catch (error) {
      this.logger.warn('Delivery confirmation setting not found, defaulting to true');
      return true; // Default to required for security
    }
  }

  /**
   * Check if audit logging is enabled for escrow actions
   */
  private async isAuditLoggingEnabled(): Promise<boolean> {
    try {
      const setting = await this.settingsService.getSetting('audit.log_all_escrow_actions');
      return setting.value === 'true' || setting.value === true;
    } catch (error) {
      this.logger.warn('Audit logging setting not found, defaulting to true');
      return true; // Default to enabled for security/compliance
    }
  }

  /**
   * Log escrow action if audit logging is enabled
   * Does not throw errors - failures are logged but don't affect escrow operations
   */
  private async logEscrowAction(action: string, escrowId: string, details: any, userId?: string) {
    try {
      const loggingEnabled = await this.isAuditLoggingEnabled();

      if (loggingEnabled) {
        // Log to console (database audit log model can be added later if needed)
        const auditEntry = {
          timestamp: new Date().toISOString(),
          action,
          entityType: 'ESCROW',
          entityId: escrowId,
          userId: userId || 'SYSTEM',
          details: JSON.stringify(details),
        };

        this.logger.log(`[AUDIT] ${action} - Escrow ${escrowId}: ${JSON.stringify(auditEntry)}`);

        // TODO: If AuditLog model exists in Prisma schema, uncomment:
        // await this.prisma.auditLog.create({ data: auditEntry });
      }
    } catch (error) {
      // Don't fail escrow operation if logging fails
      this.logger.error(`Failed to log escrow action ${action}:`, error);
    }
  }
}
