import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { StoreStatus, SellerCreditTransactionType } from '@prisma/client';

/**
 * Service for managing seller credits (monthly subscription)
 */
@Injectable()
export class SellerCreditsService {
  private readonly logger = new Logger(SellerCreditsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly paymentService: PaymentService,
  ) {}


  /**
   * Get credit balance and status for a seller
   */
  async getCreditBalance(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        status: true,
        creditsBalance: true,
        creditsLastDeducted: true,
        creditsExpiresAt: true,
        creditsGraceEndsAt: true,
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found. Apply to become a seller first.');
    }

    const inGracePeriod =
      store.creditsBalance === 0 &&
      store.creditsGraceEndsAt &&
      new Date() < store.creditsGraceEndsAt;

    const canPublish =
      store.status === StoreStatus.ACTIVE &&
      (store.creditsBalance > 0 || inGracePeriod);

    // Can purchase if store is ACTIVE (approved)
    const canPurchase = store.status === StoreStatus.ACTIVE;

    return {
      success: true,
      data: {
        storeId: store.id,
        storeName: store.name,
        storeStatus: store.status,
        creditsBalance: store.creditsBalance,
        lastDeductedAt: store.creditsLastDeducted,
        expiresAt: store.creditsExpiresAt,
        graceEndsAt: store.creditsGraceEndsAt,
        inGracePeriod,
        canPublish,
        canPurchase,
      },
    };
  }

  /**
   * Get credit transaction history with pagination
   */
  async getCreditHistory(userId: string, page = 1, limit = 20) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.sellerCreditTransaction.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sellerCreditTransaction.count({
        where: { storeId: store.id },
      }),
    ]);

    return {
      success: true,
      data: {
        transactions: transactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          balanceBefore: tx.balanceBefore,
          balanceAfter: tx.balanceAfter,
          amountPaid: tx.amountPaid,
          currency: tx.currency,
          description: tx.description,
          notes: tx.notes,
          performedBy: tx.performedBy,
          createdAt: tx.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * Get credit price from settings
   */
  async getCreditPrice(): Promise<number> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'seller_monthly_credit_price' },
      });

      if (!setting) {
        // Default fallback
        return 29.99;
      }

      return parseFloat(setting.value as string) || 29.99;
    } catch (error) {
      this.logger.warn('Failed to fetch credit price from settings, using default');
      return 29.99;
    }
  }

  /**
   * Get grace period days from settings
   */
  async getGracePeriodDays(): Promise<number> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'seller_credit_grace_period_days' },
      });

      if (!setting) {
        return 3; // Default
      }

      return parseInt(setting.value as string, 10) || 3;
    } catch (error) {
      this.logger.warn('Failed to fetch grace period, using default');
      return 3;
    }
  }

  /**
   * Create Stripe Checkout Session for credit purchase
   */
  async createCheckoutSession(userId: string, months: number) {
    // Get Stripe client from PaymentService
    const stripe = await this.paymentService.getStripe();

    // Validate months range
    const minMonths = await this.getSettingNumber('seller_min_credit_purchase', 1);
    const maxMonths = await this.getSettingNumber('seller_max_credit_purchase', 12);

    if (months < minMonths || months > maxMonths) {
      throw new BadRequestException(
        `Months must be between ${minMonths} and ${maxMonths}`,
      );
    }

    // Get store
    const store = await this.prisma.store.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Check if approved
    if (store.status !== StoreStatus.ACTIVE) {
      throw new ForbiddenException(
        'Your store must be approved before purchasing credits. Please wait for admin approval.',
      );
    }

    // Get price
    const pricePerMonth = await this.getCreditPrice();
    const totalAmount = pricePerMonth * months;

    // Convert to cents for Stripe
    const amountInCents = Math.round(totalAmount * 100);

    // Get frontend URL for redirects
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: store.user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${months} Month${months > 1 ? 's' : ''} of Selling Credits`,
              description: `Subscription for ${store.name} - ${months} months at $${pricePerMonth}/month`,
              images: [
                `${frontendUrl}/images/logo-icon.png`, // Platform logo
              ],
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'seller_credits',
        userId: store.userId,
        storeId: store.id,
        months: months.toString(),
        pricePerMonth: pricePerMonth.toString(),
      },
      success_url: `${frontendUrl}/seller/selling-credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/seller/selling-credits?canceled=true`,
    });

    return {
      success: true,
      data: {
        sessionId: session.id,
        sessionUrl: session.url,
        months,
        pricePerMonth,
        totalAmount,
      },
    };
  }

  /**
   * Verify Stripe session and process if not already done
   */
  async verifyAndProcessSession(userId: string, stripeSessionId: string) {
    try {
      // Get Stripe client
      const stripe = await this.paymentService.getStripe();

      // Retrieve session from Stripe
      const session = await stripe.checkout.sessions.retrieve(stripeSessionId, {
        expand: ['payment_intent'],
      });

      // Verify this session belongs to this user
      if (session.metadata.userId !== userId) {
        throw new ForbiddenException('This session does not belong to you');
      }

      // Check payment status
      if (session.payment_status !== 'paid') {
        return {
          success: false,
          message: 'Payment not completed yet',
          data: {
            paymentStatus: session.payment_status,
          },
        };
      }

      // Check if already processed
      const existingTransaction =
        await this.prisma.sellerCreditTransaction.findUnique({
          where: { stripeSessionId },
        });

      if (!existingTransaction) {
        // Not processed yet, process it now
        this.logger.log(
          `Manually processing credit purchase: ${stripeSessionId}`,
        );
        await this.processSuccessfulPurchase(stripeSessionId);
      }

      // Get updated balance
      const balance = await this.getCreditBalance(userId);

      // Get purchase details from session
      const monthsPurchased = parseInt(session.metadata.months, 10);

      return {
        success: true,
        data: {
          ...balance.data,
          purchaseDetails: {
            monthsPurchased,
            pricePerMonth: parseFloat(session.metadata.pricePerMonth),
            totalPaid: session.amount_total / 100, // Convert from cents
            sessionId: stripeSessionId,
            alreadyProcessed: !!existingTransaction,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to verify session ${stripeSessionId}:`,
        error.stack,
      );
      throw new BadRequestException('Failed to verify purchase session');
    }
  }

  /**
   * Process successful credit purchase (called from webhook)
   */
  async processSuccessfulPurchase(stripeSessionId: string) {
    // Get Stripe client from PaymentService
    const stripe = await this.paymentService.getStripe();

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId, {
      expand: ['payment_intent'],
    });

    // Verify payment succeeded
    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Payment has not been completed');
    }

    // Extract metadata
    const { userId, storeId, months, pricePerMonth } = session.metadata;

    if (!userId || !storeId || !months || !pricePerMonth) {
      throw new BadRequestException('Invalid session metadata');
    }

    const monthsNum = parseInt(months, 10);
    const pricePerMonthNum = parseFloat(pricePerMonth);
    const totalAmountPaid = pricePerMonthNum * monthsNum;

    // Check if already processed
    const existingTransaction =
      await this.prisma.sellerCreditTransaction.findUnique({
        where: { stripeSessionId },
      });

    if (existingTransaction) {
      this.logger.warn(
        `Credit purchase already processed: ${stripeSessionId}`,
      );
      return {
        success: true,
        message: 'Credit purchase already processed',
        data: { alreadyProcessed: true },
      };
    }

    // Get store
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const now = new Date();
    const balanceBefore = store.creditsBalance;
    const balanceAfter = balanceBefore + monthsNum;

    // Calculate new expiry date
    let newExpiryDate: Date;
    if (store.creditsExpiresAt && store.creditsExpiresAt > now) {
      // Add months to existing expiry
      newExpiryDate = new Date(store.creditsExpiresAt);
      newExpiryDate.setMonth(newExpiryDate.getMonth() + monthsNum);
    } else {
      // Set expiry from now
      newExpiryDate = new Date(now);
      newExpiryDate.setMonth(newExpiryDate.getMonth() + monthsNum);
    }

    // Transaction: Update store + create transaction record
    await this.prisma.$transaction([
      // Update store balance and expiry
      this.prisma.store.update({
        where: { id: storeId },
        data: {
          creditsBalance: balanceAfter,
          creditsExpiresAt: newExpiryDate,
          creditsGraceEndsAt: null, // Clear grace period
        },
      }),
      // Create transaction record
      this.prisma.sellerCreditTransaction.create({
        data: {
          userId,
          storeId,
          type: SellerCreditTransactionType.PURCHASE,
          amount: monthsNum,
          balanceBefore,
          balanceAfter,
          amountPaid: totalAmountPaid,
          currency: 'USD',
          stripeSessionId,
          stripePaymentId:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id,
          description: `Purchased ${monthsNum} month${monthsNum > 1 ? 's' : ''} of selling credits`,
        },
      }),
      // If was in grace period, reactivate products
      ...(store.creditsGraceEndsAt
        ? [
            this.prisma.product.updateMany({
              where: {
                storeId,
                status: 'ARCHIVED',
              },
              data: {
                status: 'ACTIVE',
              },
            }),
          ]
        : []),
    ]);

    this.logger.log(
      `✅ Credit purchase processed: Store ${storeId}, ${monthsNum} months, $${totalAmountPaid}`,
    );

    return {
      success: true,
      message: `Successfully added ${monthsNum} months of credits`,
      data: {
        storeId,
        monthsPurchased: monthsNum,
        amountPaid: totalAmountPaid,
        balanceBefore,
        balanceAfter,
        expiresAt: newExpiryDate,
      },
    };
  }

  /**
   * Deduct 1 credit from a store (called by cron job monthly)
   */
  async deductMonthlyCredit(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Check if already deducted this month
    const now = new Date();
    if (store.creditsLastDeducted) {
      const lastDeduction = new Date(store.creditsLastDeducted);
      if (
        lastDeduction.getMonth() === now.getMonth() &&
        lastDeduction.getFullYear() === now.getFullYear()
      ) {
        this.logger.warn(
          `Store ${storeId} already deducted this month, skipping`,
        );
        return { success: true, message: 'Already deducted this month' };
      }
    }

    if (store.creditsBalance <= 0) {
      this.logger.warn(
        `Store ${storeId} has no credits to deduct, skipping`,
      );
      return { success: true, message: 'No credits to deduct' };
    }

    const balanceBefore = store.creditsBalance;
    const balanceAfter = balanceBefore - 1;

    // Calculate grace period end date if balance reaches zero
    let graceEndsAt: Date | null = null;
    if (balanceAfter === 0) {
      const graceDays = await this.getGracePeriodDays();
      graceEndsAt = new Date(now);
      graceEndsAt.setDate(graceEndsAt.getDate() + graceDays);
    }

    // Transaction: Update store + create deduction record
    await this.prisma.$transaction([
      this.prisma.store.update({
        where: { id: storeId },
        data: {
          creditsBalance: balanceAfter,
          creditsLastDeducted: now,
          creditsGraceEndsAt: graceEndsAt,
        },
      }),
      this.prisma.sellerCreditTransaction.create({
        data: {
          userId: store.userId,
          storeId,
          type: SellerCreditTransactionType.DEDUCTION,
          amount: -1,
          balanceBefore,
          balanceAfter,
          description: `Monthly credit deduction - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        },
      }),
    ]);

    this.logger.log(
      `✅ Credit deducted: Store ${storeId}, Balance: ${balanceBefore} → ${balanceAfter}${graceEndsAt ? `, Grace period until ${graceEndsAt.toISOString()}` : ''}`,
    );

    return {
      success: true,
      message: 'Monthly credit deducted',
      data: {
        storeId,
        balanceBefore,
        balanceAfter,
        graceEndsAt,
      },
    };
  }

  /**
   * Suspend products for stores with expired grace period
   */
  async suspendExpiredGracePeriodStores() {
    const now = new Date();

    // Find stores with expired grace period
    const stores = await this.prisma.store.findMany({
      where: {
        status: StoreStatus.ACTIVE,
        creditsBalance: 0,
        creditsGraceEndsAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        name: true,
        userId: true,
      },
    });

    if (stores.length === 0) {
      this.logger.log('No stores with expired grace period found');
      return {
        success: true,
        message: 'No stores to suspend',
        data: { suspendedCount: 0 },
      };
    }

    let suspendedCount = 0;

    for (const store of stores) {
      try {
        // Suspend all active products
        await this.prisma.product.updateMany({
          where: {
            storeId: store.id,
            status: 'ACTIVE',
          },
          data: {
            status: 'ARCHIVED',
          },
        });

        suspendedCount++;
        this.logger.log(
          `⚠️  Grace period expired: Store ${store.id} (${store.name}) - Products suspended`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to suspend products for store ${store.id}:`,
          error,
        );
      }
    }

    return {
      success: true,
      message: `Suspended products for ${suspendedCount} stores`,
      data: {
        suspendedCount,
        storeIds: stores.map((s) => s.id),
      },
    };
  }

  /**
   * Admin: Adjust credits manually (bonus, refund, adjustment)
   */
  async adjustCredits(
    storeId: string,
    amount: number,
    adminId: string,
    notes: string,
    type: SellerCreditTransactionType = SellerCreditTransactionType.ADJUSTMENT,
  ) {
    if (amount === 0) {
      throw new BadRequestException('Amount cannot be zero');
    }

    if (!notes || notes.trim().length === 0) {
      throw new BadRequestException('Notes are required for manual adjustments');
    }

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const balanceBefore = store.creditsBalance;
    const balanceAfter = Math.max(0, balanceBefore + amount); // Prevent negative balance

    // Calculate new expiry if adding credits
    let newExpiryDate = store.creditsExpiresAt;
    if (amount > 0) {
      const now = new Date();
      if (store.creditsExpiresAt && store.creditsExpiresAt > now) {
        newExpiryDate = new Date(store.creditsExpiresAt);
        newExpiryDate.setMonth(newExpiryDate.getMonth() + amount);
      } else {
        newExpiryDate = new Date(now);
        newExpiryDate.setMonth(newExpiryDate.getMonth() + amount);
      }
    }

    // Transaction: Update store + create transaction record
    await this.prisma.$transaction([
      this.prisma.store.update({
        where: { id: storeId },
        data: {
          creditsBalance: balanceAfter,
          creditsExpiresAt: newExpiryDate,
          creditsGraceEndsAt: balanceAfter > 0 ? null : store.creditsGraceEndsAt,
        },
      }),
      this.prisma.sellerCreditTransaction.create({
        data: {
          userId: store.userId,
          storeId,
          type,
          amount,
          balanceBefore,
          balanceAfter,
          description: `Manual ${type.toLowerCase()} by admin`,
          notes,
          performedBy: adminId,
        },
      }),
    ]);

    this.logger.log(
      `✅ Credits adjusted: Store ${storeId}, ${amount > 0 ? '+' : ''}${amount}, Balance: ${balanceBefore} → ${balanceAfter}, Admin: ${adminId}`,
    );

    return {
      success: true,
      message: `Credits ${amount > 0 ? 'added' : 'removed'} successfully`,
      data: {
        storeId,
        amount,
        balanceBefore,
        balanceAfter,
        expiresAt: newExpiryDate,
        adjustedBy: adminId,
      },
    };
  }

  /**
   * Get stores needing attention (low credits, in grace period, etc.)
   */
  async getStoresNeedingAttention() {
    const threshold = await this.getSettingNumber(
      'seller_low_credit_warning_threshold',
      2,
    );
    const now = new Date();

    const [lowCredits, inGracePeriod] = await Promise.all([
      this.prisma.store.findMany({
        where: {
          status: StoreStatus.ACTIVE,
          creditsBalance: { lte: threshold, gt: 0 },
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { creditsBalance: 'asc' },
        take: 50,
      }),
      this.prisma.store.findMany({
        where: {
          status: StoreStatus.ACTIVE,
          creditsBalance: 0,
          creditsGraceEndsAt: { gte: now },
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { creditsGraceEndsAt: 'asc' },
        take: 50,
      }),
    ]);

    return {
      success: true,
      data: {
        lowCredits: lowCredits.map((store) => ({
          storeId: store.id,
          storeName: store.name,
          ownerEmail: store.user.email,
          ownerName: `${store.user.firstName} ${store.user.lastName}`,
          creditsBalance: store.creditsBalance,
          expiresAt: store.creditsExpiresAt,
        })),
        inGracePeriod: inGracePeriod.map((store) => ({
          storeId: store.id,
          storeName: store.name,
          ownerEmail: store.user.email,
          ownerName: `${store.user.firstName} ${store.user.lastName}`,
          graceEndsAt: store.creditsGraceEndsAt,
        })),
      },
    };
  }

  /**
   * Helper: Get setting as number
   */
  private async getSettingNumber(key: string, defaultValue: number): Promise<number> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key },
      });

      if (!setting) {
        return defaultValue;
      }

      const parsed = parseFloat(setting.value as string);
      return isNaN(parsed) ? defaultValue : parsed;
    } catch (error) {
      this.logger.warn(`Failed to fetch setting ${key}, using default`);
      return defaultValue;
    }
  }
}
