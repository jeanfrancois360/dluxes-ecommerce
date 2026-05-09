import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PayoutStatus, CommissionStatus, PayoutFrequency, EscrowStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { StripeConnectService } from './integrations/stripe-connect.service';
import { SettingsService } from '../settings/settings.service';
import { EmailService } from '../email/email.service';

/**
 * Payout Scheduler Service
 * Automated payout processing for sellers
 * Integrates with Escrow system to ensure secure fund releases
 * v2.11.1: Added dynamic currency support and email notifications
 */
@Injectable()
export class PayoutSchedulerService {
  private readonly logger = new Logger(PayoutSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => StripeConnectService))
    private readonly stripeConnectService: StripeConnectService,
    private readonly settingsService: SettingsService,
    private readonly emailService: EmailService
  ) {}

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
   * Get payout currency for seller
   * Priority: Seller's payout currency > Store currency > Platform default
   */
  private async getPayoutCurrency(sellerId: string, storeId: string): Promise<string> {
    try {
      // Check seller's payout currency preference first
      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
        select: { payoutCurrency: true, currency: true },
      });

      if (store?.payoutCurrency) {
        return store.payoutCurrency;
      }

      if (store?.currency) {
        return store.currency;
      }

      // Fall back to platform default
      const defaultCurrency = await this.settingsService
        .getSetting('default_currency')
        .catch(() => ({ value: 'USD' }));

      return String(defaultCurrency.value) || 'USD';
    } catch (error) {
      this.logger.warn(`Failed to get payout currency for ${sellerId}, using USD`, error);
      return 'USD';
    }
  }

  /**
   * Get estimated arrival date for payout
   */
  private async getEstimatedArrival(): Promise<string> {
    try {
      const days = await this.settingsService
        .getSetting('payout_processing_days')
        .catch(() => ({ value: 3 }));
      const processingDays = Number(days.value) || 3;
      const arrival = new Date();
      arrival.setDate(arrival.getDate() + processingDays);
      return arrival.toISOString();
    } catch (error) {
      // Default to 3 business days
      const arrival = new Date();
      arrival.setDate(arrival.getDate() + 3);
      return arrival.toISOString();
    }
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
    // Exclude sellers who already have a pending/processing payout (prevent duplicates)
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
        payouts: {
          none: {
            status: { in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] },
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
        payoutSettings: true, // Include payout settings to determine payment method
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

    // Get currency dynamically
    const currency = await this.getPayoutCurrency(sellerId, seller.store!.id);

    // Determine payment method from seller settings
    // Priority: seller payout settings → store settings → default
    const paymentMethod =
      seller.payoutSettings?.paymentMethod ||
      (seller.store as any)?.payoutMethod ||
      'bank_transfer'; // Default fallback

    // Create payout in transaction
    const payout = await this.prisma.$transaction(async (prisma) => {
      // Create payout record
      const newPayout = await prisma.payout.create({
        data: {
          sellerId,
          storeId: seller.store!.id,
          amount: totalAmount,
          currency, // Dynamic currency based on seller preference
          commissionCount: seller.commissions.length,
          status: PayoutStatus.PENDING,
          paymentMethod, // Dynamic payment method based on seller preference
          periodStart,
          periodEnd,
          scheduledAt: now,
          notes: `Automated payout - ${config.frequency} via ${paymentMethod}`,
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

    // Send payout scheduled email (non-blocking)
    try {
      await this.emailService.sendPayoutScheduled(seller.email, {
        sellerName: `${seller.firstName || ''} ${seller.lastName || ''}`.trim(),
        storeName: seller.store?.name || 'Your Store',
        payoutId: payout.id,
        amount: Number(payout.amount),
        currency: payout.currency,
        commissionsCount: seller.commissions.length,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        scheduledDate: now.toISOString(),
        estimatedArrival: await this.getEstimatedArrival(),
        paymentMethod: paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        sellerId,
      });
    } catch (emailErr) {
      this.logger.error(`Failed to send payout scheduled email to ${seller.email}`, emailErr);
    }

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
    // Get seller's store for currency
    const user = await this.prisma.user.findUnique({
      where: { id: sellerId },
      include: { store: { select: { id: true, payoutCurrency: true, currency: true } } },
    });

    const storeId = user?.store?.id;
    const currency = storeId ? await this.getPayoutCurrency(sellerId, storeId) : 'USD';

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
      currency,
    };
  }

  /**
   * Get all payouts with filters (Admin only)
   */
  async getAllPayouts(params: { limit?: number; offset?: number; status?: string }) {
    const { limit = 50, offset = 0, status } = params;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const [payouts, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      this.prisma.payout.count({ where }),
    ]);

    return {
      success: true,
      data: payouts,
      total,
      limit,
      offset,
    };
  }

  /**
   * Mark payout as completed (Admin only - after actual payment)
   */
  async completePayout(payoutId: string, paymentReference?: string, paymentProof?: string) {
    const payout = await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.COMPLETED,
        processedAt: new Date(),
        paymentReference,
        paymentProof,
      },
      include: {
        seller: { select: { email: true, firstName: true, lastName: true } },
        store: { select: { name: true } },
      },
    });

    // Send payout completed email (non-blocking)
    try {
      await this.emailService.sendPayoutCompleted(payout.seller.email, {
        sellerName: `${payout.seller.firstName || ''} ${payout.seller.lastName || ''}`.trim(),
        storeName: payout.store?.name || 'Your Store',
        payoutId: payout.id,
        amount: Number(payout.amount),
        currency: payout.currency,
        commissionsCount: payout.commissionCount || 0,
        periodStart: payout.periodStart?.toISOString() || '',
        periodEnd: payout.periodEnd?.toISOString() || '',
        completedDate: payout.processedAt?.toISOString() || new Date().toISOString(),
        paymentReference: paymentReference || '',
        paymentMethod: payout.paymentMethod || 'Bank Transfer',
        sellerId: payout.sellerId,
      });
    } catch (emailErr) {
      this.logger.error(
        `Failed to send payout completed email to ${payout.seller.email}`,
        emailErr
      );
    }

    return payout;
  }

  /**
   * Mark payout as failed (Admin only)
   */
  async failPayout(payoutId: string, reason: string) {
    const payout = await this.prisma.$transaction(async (prisma) => {
      // Update payout status
      const failedPayout = await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.FAILED,
          notes: `Failed: ${reason}`,
        },
        include: {
          seller: { select: { email: true, firstName: true, lastName: true } },
          store: { select: { name: true } },
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

      return failedPayout;
    });

    // Send payout failed email (non-blocking)
    try {
      await this.emailService.sendPayoutFailed(payout.seller.email, {
        sellerName: `${payout.seller.firstName || ''} ${payout.seller.lastName || ''}`.trim(),
        storeName: payout.store?.name || 'Your Store',
        payoutId: payout.id,
        amount: Number(payout.amount),
        currency: payout.currency,
        commissionsCount: payout.commissionCount || 0,
        failureReason: reason,
        failedDate: new Date().toISOString(),
        paymentMethod: payout.paymentMethod || 'bank_transfer',
        sellerId: payout.sellerId,
      });
    } catch (emailErr) {
      this.logger.error(`Failed to send payout failed email to ${payout.seller.email}`, emailErr);
    }

    return payout;
  }

  /**
   * Process pending payouts
   * Executes actual payment transfers for pending payouts
   */
  async processPendingPayouts() {
    this.logger.log('Processing pending payouts...');

    const pendingPayouts = await this.prisma.payout.findMany({
      where: {
        status: PayoutStatus.PENDING,
      },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            payoutSettings: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            payoutMethod: true,
            payoutCurrency: true,
          },
        },
      },
      take: 100, // Process 100 at a time
    });

    let processedCount = 0;
    let failedCount = 0;
    const failedPayoutIds: string[] = [];

    for (const payout of pendingPayouts) {
      try {
        // Get payout method from seller settings or store settings
        const payoutMethod =
          payout.seller.payoutSettings?.paymentMethod ||
          payout.store.payoutMethod ||
          'bank_transfer';
        const currency =
          payout.seller.payoutSettings?.payoutCurrency ||
          payout.store.payoutCurrency ||
          payout.currency;

        // Process payment via payment provider
        switch (payoutMethod) {
          case 'STRIPE_CONNECT':
            try {
              // Process via Stripe Connect
              const transfer = await this.stripeConnectService.createPayout({
                sellerId: payout.sellerId,
                amount: payout.amount.toNumber(),
                currency: currency,
                description: `Payout for ${payout.commissionCount} commission(s)`,
                metadata: {
                  payoutId: payout.id,
                  periodStart: payout.periodStart.toISOString(),
                  periodEnd: payout.periodEnd.toISOString(),
                },
              });

              // Mark as completed
              await this.prisma.payout.update({
                where: { id: payout.id },
                data: {
                  status: PayoutStatus.COMPLETED,
                  processedAt: new Date(),
                  paymentReference: transfer.transferId,
                  notes: `Stripe transfer: ${transfer.transferId}`,
                },
              });

              this.logger.log(
                `Stripe Connect payout completed: ${payout.id} -> ${transfer.transferId} (${transfer.amount} ${transfer.currency})`
              );
            } catch (stripeError) {
              // If Stripe fails, mark as processing for manual handling
              this.logger.error(`Stripe Connect failed for payout ${payout.id}:`, stripeError);
              await this.prisma.payout.update({
                where: { id: payout.id },
                data: {
                  status: PayoutStatus.PROCESSING,
                  notes: `Stripe failed: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}. Manual processing required.`,
                },
              });
            }
            break;

          case 'PAYPAL':
            // TODO: Implement PayPal Payouts API
            this.logger.log(`Would process PayPal payout for ${payout.id}`);
            await this.prisma.payout.update({
              where: { id: payout.id },
              data: {
                status: PayoutStatus.PROCESSING,
                notes: 'PayPal integration pending - manual processing required',
              },
            });
            break;

          case 'WISE':
            // TODO: Implement Wise API
            this.logger.log(`Would process Wise payout for ${payout.id}`);
            await this.prisma.payout.update({
              where: { id: payout.id },
              data: {
                status: PayoutStatus.PROCESSING,
                notes: 'Wise integration pending - manual processing required',
              },
            });
            break;

          case 'BANK_TRANSFER':
          case 'bank_transfer':
          default:
            // Mark as processing - requires manual bank transfer
            await this.prisma.payout.update({
              where: { id: payout.id },
              data: {
                status: PayoutStatus.PROCESSING,
                notes: 'Pending manual bank transfer',
              },
            });
            this.logger.log(
              `Marked payout ${payout.id} as processing (manual bank transfer required)`
            );
            break;
        }

        processedCount++;
      } catch (error) {
        this.logger.error(`Failed to process payout ${payout.id}:`, error);
        failedCount++;
        failedPayoutIds.push(payout.id);

        // Mark as failed
        await this.failPayout(payout.id, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    this.logger.log(
      `Pending payout processing completed: ${processedCount} processed, ${failedCount} failed`
    );

    return {
      processed: processedCount,
      failed: failedCount,
      failedPayoutIds,
    };
  }

  /**
   * Retry failed payouts
   * Retries payouts that failed due to temporary issues
   */
  async retryFailedPayouts() {
    this.logger.log('Retrying failed payouts...');

    const failedPayouts = await this.prisma.payout.findMany({
      where: {
        status: PayoutStatus.FAILED,
        createdAt: {
          // Only retry payouts from last 7 days
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            payoutSettings: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 50, // Retry 50 at a time
    });

    let retriedCount = 0;
    let succeededCount = 0;

    for (const payout of failedPayouts) {
      try {
        // Reset to pending for retry
        await this.prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: PayoutStatus.PENDING,
            notes: `Retry attempt at ${new Date().toISOString()}`,
          },
        });

        retriedCount++;
        this.logger.log(`Retrying payout ${payout.id}`);
      } catch (error) {
        this.logger.error(`Failed to retry payout ${payout.id}:`, error);
      }
    }

    this.logger.log(`Failed payout retry completed: ${retriedCount} retried`);

    return {
      retried: retriedCount,
      succeeded: succeededCount,
    };
  }

  /**
   * Send payout reminders to sellers
   * Notifies sellers about upcoming or available payouts
   */
  async sendPayoutReminders() {
    this.logger.log('Sending payout reminders...');

    // Find sellers with pending payout amounts
    const sellers = await this.prisma.user.findMany({
      where: {
        role: 'SELLER',
        escrowTransactions: {
          some: {
            status: EscrowStatus.RELEASED,
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

    let sentCount = 0;

    for (const seller of sellers) {
      try {
        const pendingPayout = await this.getSellerPendingPayout(seller.id);

        if (pendingPayout.totalPending > 0) {
          // TODO: Integrate with email/notification service
          this.logger.log(
            `Would send payout reminder to ${seller.email}: ${pendingPayout.totalPending} ${pendingPayout.currency} available`
          );

          // TODO: Create notification
          // await this.notificationService.create({
          //   userId: seller.id,
          //   type: 'PAYOUT_REMINDER',
          //   title: 'Funds available for payout',
          //   message: `You have ${pendingPayout.totalPending} ${pendingPayout.currency} available for payout`,
          // });

          sentCount++;
        }
      } catch (error) {
        this.logger.error(`Failed to send payout reminder to seller ${seller.id}:`, error);
      }
    }

    this.logger.log(`Payout reminders sent: ${sentCount}`);

    return {
      sent: sentCount,
    };
  }

  /**
   * Update payout statuses from payment providers
   * Syncs status with Stripe, PayPal, Wise, etc.
   */
  async updatePayoutStatuses() {
    this.logger.log('Updating payout statuses from payment providers...');

    const processingPayouts = await this.prisma.payout.findMany({
      where: {
        status: PayoutStatus.PROCESSING,
      },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            payoutSettings: true,
          },
        },
      },
      take: 100,
    });

    let updatedCount = 0;

    for (const payout of processingPayouts) {
      try {
        const payoutMethod = payout.seller.payoutSettings?.paymentMethod || 'bank_transfer';

        // TODO: Check status with payment provider
        switch (payoutMethod) {
          case 'STRIPE_CONNECT':
            // const stripeStatus = await this.stripePayoutService.getPayoutStatus(payout.id);
            // if (stripeStatus === 'paid') {
            //   await this.completePayout(payout.id, stripeStatus.transferId);
            //   updatedCount++;
            // }
            this.logger.log(`Would check Stripe Connect status for payout ${payout.id}`);
            break;
          case 'PAYPAL':
            // const paypalStatus = await this.paypalPayoutService.getPayoutStatus(payout.id);
            // if (paypalStatus === 'SUCCESS') {
            //   await this.completePayout(payout.id, paypalStatus.batchId);
            //   updatedCount++;
            // }
            this.logger.log(`Would check PayPal status for payout ${payout.id}`);
            break;
          case 'WISE':
            // const wiseStatus = await this.wisePayoutService.getTransferStatus(payout.id);
            // if (wiseStatus === 'funds_converted') {
            //   await this.completePayout(payout.id, wiseStatus.transferId);
            //   updatedCount++;
            // }
            this.logger.log(`Would check Wise status for payout ${payout.id}`);
            break;
        }
      } catch (error) {
        this.logger.error(`Failed to update status for payout ${payout.id}:`, error);
      }
    }

    this.logger.log(`Payout status update completed: ${updatedCount} updated`);

    return {
      updated: updatedCount,
    };
  }

  /**
   * Get seller's payout history with pagination
   */
  async getSellerPayoutHistory(
    sellerId: string,
    page: number = 1,
    limit: number = 20,
    status?: string
  ) {
    const where: any = { sellerId };
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const skip = (page - 1) * limit;

    const [payouts, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.payout.count({ where }),
    ]);

    return {
      payouts,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  /**
   * Get seller's payout statistics
   */
  async getSellerPayoutStats(sellerId: string) {
    // Get seller's store
    const user = await this.prisma.user.findUnique({
      where: { id: sellerId },
      include: { store: { select: { id: true } } },
    });

    if (!user?.store) {
      throw new NotFoundException('Store not found for seller');
    }

    const storeId = user.store.id;

    // Fetch all data in parallel
    const [completedPayouts, pendingPayouts, unpaidCommissions, lastPayout, frequencySetting] =
      await Promise.all([
        this.prisma.payout.aggregate({
          where: { sellerId, status: PayoutStatus.COMPLETED },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.payout.aggregate({
          where: {
            sellerId,
            status: { in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] },
          },
          _sum: { amount: true },
        }),
        this.prisma.commission.aggregate({
          where: {
            sellerId,
            paidOut: false,
            status: CommissionStatus.CONFIRMED,
          },
          _sum: { commissionAmount: true },
        }),
        this.prisma.payout.findFirst({
          where: { sellerId, status: PayoutStatus.COMPLETED },
          orderBy: { processedAt: 'desc' },
          select: { processedAt: true, amount: true, currency: true },
        }),
        this.settingsService
          .getSetting('payout_default_frequency')
          .catch(() => ({ value: 'WEEKLY' })),
      ]);

    const payoutSchedule = String(frequencySetting.value);
    const currency = await this.getPayoutCurrency(sellerId, storeId);

    return {
      totalPaidAllTime: Number(completedPayouts._sum.amount || 0),
      totalPayoutsCount: completedPayouts._count,
      pendingAmount: Number(pendingPayouts._sum.amount || 0),
      nextPayoutAmount: Number(unpaidCommissions._sum.commissionAmount || 0),
      lastPayoutDate: lastPayout?.processedAt?.toISOString() || null,
      lastPayoutAmount: Number(lastPayout?.amount || 0),
      lastPayoutCurrency: lastPayout?.currency || currency,
      payoutSchedule,
      nextPayoutDate: this.calculateNextPayoutDate(payoutSchedule),
      currency,
    };
  }

  /**
   * Get eligible commissions for next payout
   */
  async getEligibleCommissions(sellerId: string) {
    const commissions = await this.prisma.commission.findMany({
      where: {
        sellerId,
        paidOut: false,
        status: CommissionStatus.CONFIRMED,
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            currency: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent 100
    });

    const total = commissions.reduce((sum, c) => sum + Number(c.commissionAmount || 0), 0);

    return {
      commissions,
      total,
      count: commissions.length,
    };
  }

  /**
   * Request manual payout (seller-initiated)
   */
  async requestManualPayout(sellerId: string) {
    // Check if manual requests are enabled
    const enabled = await this.settingsService
      .getSetting('payout_manual_request_enabled')
      .catch(() => ({ value: true }));

    if (!enabled.value) {
      throw new BadRequestException('Manual payout requests are currently disabled');
    }

    // Get seller's store and payout settings
    const user = await this.prisma.user.findUnique({
      where: { id: sellerId },
      include: {
        store: true,
        payoutSettings: { select: { paymentMethod: true, verified: true } },
      },
    });

    if (!user?.store) {
      throw new NotFoundException('Store not found for seller');
    }

    if (!user.payoutSettings?.verified) {
      throw new BadRequestException(
        'Your payout settings must be configured and verified before requesting a payout'
      );
    }

    const storeId = user.store.id;

    // Get minimum payout amount
    const minAmountSetting = await this.settingsService
      .getSetting('payout_minimum_amount')
      .catch(() => ({ value: 50 }));
    const minAmount = Number(minAmountSetting.value);

    // Get eligible commissions
    const eligible = await this.getEligibleCommissions(sellerId);

    if (eligible.total < minAmount) {
      throw new BadRequestException(
        `Minimum payout amount is ${minAmount}. Your eligible amount is ${eligible.total.toFixed(2)}.`
      );
    }

    // Get seller currency
    const currency = await this.getPayoutCurrency(sellerId, storeId);

    // Create payout request
    const payout = await this.prisma.$transaction(async (prisma) => {
      const newPayout = await prisma.payout.create({
        data: {
          sellerId,
          storeId,
          amount: new Decimal(eligible.total),
          currency,
          status: PayoutStatus.PENDING,
          commissionCount: eligible.count,
          paymentMethod: user.payoutSettings?.paymentMethod || 'bank_transfer',
          periodStart: new Date(),
          periodEnd: new Date(),
          scheduledAt: new Date(),
          notes: 'Manual payout request by seller',
        },
      });

      // Link commissions to payout
      const commissionIds = eligible.commissions.map((c) => c.id);
      if (commissionIds.length > 0) {
        await prisma.commission.updateMany({
          where: { id: { in: commissionIds } },
          data: {
            payoutId: newPayout.id,
            paidOut: true,
            paidOutAt: new Date(),
          },
        });
      }

      return newPayout;
    });

    // Send notification email (non-blocking)
    try {
      await this.emailService.sendPayoutScheduled(user.email, {
        sellerName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        storeName: user.store.name,
        payoutId: payout.id,
        amount: Number(payout.amount),
        currency: payout.currency,
        commissionsCount: eligible.count,
        periodStart: new Date().toISOString(),
        periodEnd: new Date().toISOString(),
        scheduledDate: new Date().toISOString(),
        estimatedArrival: await this.getEstimatedArrival(),
        paymentMethod: 'Manual Request',
        sellerId,
      });
    } catch (emailErr) {
      this.logger.error('Failed to send manual payout request email', emailErr);
    }

    return payout;
  }

  /**
   * Calculate next payout date based on frequency
   */
  private calculateNextPayoutDate(frequency: string): string {
    const now = new Date();
    switch (frequency.toUpperCase()) {
      case 'DAILY':
        now.setDate(now.getDate() + 1);
        break;
      case 'WEEKLY':
        now.setDate(now.getDate() + (7 - now.getDay()));
        break;
      case 'BIWEEKLY':
        now.setDate(now.getDate() + 14);
        break;
      case 'MONTHLY':
        now.setMonth(now.getMonth() + 1, 1);
        break;
      default:
        now.setDate(now.getDate() + 7);
    }
    return now.toISOString();
  }

  /**
   * Get payout statistics
   */
  async getPayoutStatistics(filters?: { startDate?: Date; endDate?: Date; sellerId?: string }) {
    const where: any = {};

    if (filters?.startDate) {
      where.createdAt = { ...where.createdAt, gte: filters.startDate };
    }
    if (filters?.endDate) {
      where.createdAt = { ...where.createdAt, lte: filters.endDate };
    }
    if (filters?.sellerId) {
      where.sellerId = filters.sellerId;
    }

    const [pending, processing, completed, failed] = await Promise.all([
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
      total: {
        amount:
          Number(pending._sum.amount || 0) +
          Number(processing._sum.amount || 0) +
          Number(completed._sum.amount || 0) +
          Number(failed._sum.amount || 0),
        count: pending._count + processing._count + completed._count + failed._count,
      },
    };
  }
}
