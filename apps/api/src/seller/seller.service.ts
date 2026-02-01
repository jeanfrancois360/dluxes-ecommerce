import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { CreditsService } from '../credits/credits.service';
import { DhlTrackingService } from '../integrations/dhl/dhl-tracking.service';
import { SettingsService } from '../settings/settings.service';
import { ProductStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SellerService {
  private readonly logger = new Logger(SellerService.name);

  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
    private creditsService: CreditsService,
    private dhlTrackingService: DhlTrackingService,
    private settingsService: SettingsService,
  ) {}

  /**
   * Get seller's products
   */
  async getMyProducts(userId: string, query: any) {
    const { page = 1, limit = 20, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    // Get seller's store
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found. Please create a store first.');
    }

    const where: any = {
      storeId: store.id,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            orderBy: {
              displayOrder: 'asc',
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get seller's product statistics
   */
  async getProductStats(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const products = await this.prisma.product.findMany({
      where: { storeId: store.id },
      select: {
        status: true,
        inventory: true,
        viewCount: true,
        likeCount: true,
      },
    });

    const total = products.length;
    const active = products.filter((p) => p.status === 'ACTIVE').length;
    const draft = products.filter((p) => p.status === 'DRAFT').length;
    const outOfStock = products.filter((p) => p.inventory === 0).length;
    const lowStock = products.filter((p) => p.inventory > 0 && p.inventory <= 10).length;
    const totalViews = products.reduce((sum, p) => sum + p.viewCount, 0);
    const totalLikes = products.reduce((sum, p) => sum + p.likeCount, 0);

    return {
      total,
      active,
      draft,
      outOfStock,
      lowStock,
      totalViews,
      totalLikes,
    };
  }

  /**
   * Get products with low stock (inventory <= threshold)
   */
  async getLowStockProducts(userId: string, threshold: number = 10, limit: number = 10) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const products = await this.prisma.product.findMany({
      where: {
        storeId: store.id,
        inventory: {
          gt: 0,
          lte: threshold,
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        heroImage: true,
        inventory: true,
        price: true,
      },
      orderBy: {
        inventory: 'asc',
      },
      take: limit,
    });

    return products;
  }

  /**
   * Get reviews for seller's products
   */
  async getMyReviews(userId: string, query: any) {
    const { page = 1, limit = 20, rating, productId } = query;
    const skip = (page - 1) * Number(limit);

    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const where: any = {
      product: {
        storeId: store.id,
      },
    };

    if (rating) {
      where.rating = Number(rating);
    }

    if (productId) {
      where.productId = productId;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              heroImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  /**
   * Get review statistics for seller's products
   */
  async getReviewStats(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const reviews = await this.prisma.review.findMany({
      where: {
        product: {
          storeId: store.id,
        },
      },
      select: {
        rating: true,
        isApproved: true,
      },
    });

    const total = reviews.length;
    const approved = reviews.filter((r) => r.isApproved).length;
    const pending = reviews.filter((r) => !r.isApproved).length;

    // Rating distribution
    const ratingDistribution = {
      1: reviews.filter((r) => r.rating === 1).length,
      2: reviews.filter((r) => r.rating === 2).length,
      3: reviews.filter((r) => r.rating === 3).length,
      4: reviews.filter((r) => r.rating === 4).length,
      5: reviews.filter((r) => r.rating === 5).length,
    };

    // Average rating
    const averageRating =
      total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;

    return {
      total,
      approved,
      pending,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
    };
  }

  /**
   * Get seller's orders
   */
  async getMyOrders(userId: string, query: any) {
    const { page = 1, limit = 20, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const where: any = {
      items: {
        some: {
          product: {
            storeId: store.id,
          },
        },
      },
    };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          items: {
            where: {
              product: {
                storeId: store.id,
              },
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  heroImage: true,
                },
              },
            },
          },
          shippingAddress: true,
          paymentTransactions: {
            select: {
              id: true,
              status: true,
              paymentMethod: true,
              processingFeeAmount: true,
              processingFeePercent: true,
              processingFeeFixed: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    // Transform orders to include seller-specific totals
    const ordersWithSellerTotals = await Promise.all(
      orders.map(async (order) => {
        const sellerTotals = await this.calculateSellerOrderTotals(order);

        return {
          ...order,
          sellerTotals, // Add seller-specific breakdown
          originalTotal: Number(order.total), // Keep original for reference
        };
      })
    );

    return {
      data: ordersWithSellerTotals,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Calculate seller-specific totals with proportional cost allocation
   * Including platform commission and net earnings
   * @private
   */
  private async calculateSellerOrderTotals(order: any) {
    // Calculate subtotal from seller's items only
    const sellerSubtotal = order.items.reduce(
      (sum: Decimal, item: any) => sum.plus(new Decimal(item.total)),
      new Decimal(0)
    );

    // Get order-level totals
    const orderSubtotal = new Decimal(order.subtotal);
    const orderShipping = new Decimal(order.shipping);
    const orderTax = new Decimal(order.tax);
    const orderDiscount = new Decimal(order.discount || 0);

    // Calculate proportion (seller's items / total items)
    const proportion = orderSubtotal.isZero()
      ? new Decimal(0)
      : sellerSubtotal.div(orderSubtotal);

    // Allocate shipping, tax, and discount proportionally
    const sellerShipping = orderShipping.mul(proportion);
    const sellerTax = orderTax.mul(proportion);
    const sellerDiscount = orderDiscount.mul(proportion);

    // Calculate seller's gross total (before commission)
    const sellerTotal = sellerSubtotal
      .plus(sellerShipping)
      .plus(sellerTax)
      .minus(sellerDiscount);

    // Get commission rate from settings (default 10%)
    let commissionRate = new Decimal(10); // Default 10%
    try {
      const setting = await this.settingsService.getSetting('global_commission_rate');
      if (setting && setting.value) {
        commissionRate = new Decimal(Number(setting.value));
      }
    } catch (error) {
      this.logger.warn('Commission rate not found, using default 10%');
    }

    // Calculate platform commission
    const platformCommission = sellerTotal.mul(commissionRate).div(100);

    // Get payment processing fees (Stripe/PayPal) if transaction exists
    let paymentProcessingFee = new Decimal(0);
    let processingFeeRate = 0;
    let paymentProcessor = 'Unknown';

    if (order.paymentTransactions && order.paymentTransactions.length > 0) {
      // Find successful transaction
      const transaction = order.paymentTransactions.find(
        (t: any) => t.status === 'SUCCEEDED' || t.status === 'CAPTURED'
      );

      if (transaction?.processingFeeAmount) {
        // Use actual fees from payment processor
        const totalProcessingFee = new Decimal(transaction.processingFeeAmount);

        // Allocate proportionally to this seller
        // (Multi-vendor orders: split fees based on seller's percentage of order)
        paymentProcessingFee = totalProcessingFee.mul(proportion);

        // Get fee rate for display
        if (transaction.processingFeePercent) {
          processingFeeRate = Number(transaction.processingFeePercent) * 100; // Convert 0.029 to 2.9%
        }

        // Get payment processor name
        paymentProcessor = transaction.paymentMethod || 'Unknown';

        this.logger.log(
          `Order ${order.id}: Using actual ${paymentProcessor} fee: ` +
          `${totalProcessingFee.toFixed(2)} (seller portion: ${paymentProcessingFee.toFixed(2)})`
        );
      } else {
        // Estimate if not yet retrieved (should be rare after webhook)
        const method = transaction?.paymentMethod || 'STRIPE';
        paymentProcessingFee = await this.estimateProcessingFee(sellerTotal, order.currency, method);

        // Get fee rate from settings for display
        try {
          const feePercentageSetting = await this.settingsService.getSetting(
            method === 'PAYPAL' ? 'paypal_fee_percentage' : 'stripe_fee_percentage'
          );
          processingFeeRate = feePercentageSetting?.value
            ? Number(feePercentageSetting.value)
            : method === 'PAYPAL' ? 3.49 : 2.9;
        } catch {
          processingFeeRate = method === 'PAYPAL' ? 3.49 : 2.9;
        }

        paymentProcessor = `${method} (estimated)`;

        this.logger.log(
          `Order ${order.id}: Estimated processing fee: ${paymentProcessingFee.toFixed(2)} ` +
          `(will update with actual after webhook)`
        );
      }
    }

    // Calculate net earnings (what seller actually receives after ALL fees)
    const netEarnings = sellerTotal
      .minus(platformCommission)
      .minus(paymentProcessingFee);

    return {
      subtotal: sellerSubtotal.toNumber(),
      shipping: sellerShipping.toNumber(),
      tax: sellerTax.toNumber(),
      discount: sellerDiscount.toNumber(),
      total: sellerTotal.toNumber(), // Gross total
      platformCommission: platformCommission.toNumber(),
      commissionRate: commissionRate.toNumber(),
      paymentProcessingFee: paymentProcessingFee.toNumber(), // NEW!
      processingFeeRate: processingFeeRate, // NEW! (e.g., 2.9 for 2.9%)
      paymentProcessor: paymentProcessor, // NEW! (e.g., 'STRIPE', 'PAYPAL')
      netEarnings: netEarnings.toNumber(), // Amount seller receives after ALL fees
      itemCount: order.items.length,
      proportion: proportion.toNumber(), // Percentage of order value (0-1)
    };
  }

  /**
   * Estimate processing fee when actual not yet available
   * Fetches fee rates from system settings (configurable by admin)
   */
  private async estimateProcessingFee(
    amount: Decimal,
    currency: string,
    paymentMethod: string = 'STRIPE'
  ): Promise<Decimal> {
    const currencyUpper = currency.toUpperCase();
    const processor = paymentMethod === 'PAYPAL' ? 'PAYPAL' : 'STRIPE';

    try {
      // Get fee rates from system settings
      const feePercentageSetting = await this.settingsService.getSetting(
        processor === 'STRIPE' ? 'stripe_fee_percentage' : 'paypal_fee_percentage'
      );
      const feeFixedSetting = await this.settingsService.getSetting(
        processor === 'STRIPE'
          ? `stripe_fee_fixed_${currencyUpper.toLowerCase()}`
          : `paypal_fee_fixed_${currencyUpper.toLowerCase()}`
      );

      // Get values from settings or use defaults
      const feePercentValue = feePercentageSetting?.value
        ? Number(feePercentageSetting.value)
        : processor === 'STRIPE' ? 2.9 : 3.49;

      const feeFixedValue = feeFixedSetting?.value
        ? Number(feeFixedSetting.value)
        : this.getDefaultFixedFee(currencyUpper, processor);

      const percentFee = amount.mul(feePercentValue).div(100);
      const totalFee = percentFee.add(feeFixedValue);

      this.logger.log(
        `Estimated ${processor} fee from settings: ${feePercentValue}% + ${feeFixedValue} ${currencyUpper} = ${totalFee.toFixed(2)}`
      );

      return totalFee;
    } catch (error) {
      this.logger.warn(`Failed to get fee settings, using defaults: ${error.message}`);

      // Fallback to hardcoded defaults
      const percent = processor === 'STRIPE' ? 2.9 : 3.49;
      const fixed = this.getDefaultFixedFee(currencyUpper, processor);
      const percentFee = amount.mul(percent).div(100);
      const totalFee = percentFee.add(fixed);

      return totalFee;
    }
  }

  /**
   * Get default fixed fee for currency and payment processor
   */
  private getDefaultFixedFee(currency: string, processor: string): number {
    if (processor === 'STRIPE') {
      return currency === 'GBP' ? 0.20 : 0.30;
    } else {
      return currency === 'EUR' ? 0.35 : 0.30;
    }
  }

  /**
   * Get seller's order statistics
   */
  async getOrderStats(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const orders = await this.prisma.order.findMany({
      where: {
        items: {
          some: {
            product: {
              storeId: store.id,
            },
          },
        },
      },
      include: {
        items: {
          where: {
            product: {
              storeId: store.id,
            },
          },
        },
      },
    });

    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
    const processing = orders.filter((o) => o.status === 'PROCESSING').length;
    const shipped = orders.filter((o) => o.status === 'SHIPPED').length;
    const delivered = orders.filter((o) => o.status === 'DELIVERED').length;
    const cancelled = orders.filter((o) => o.status === 'CANCELLED').length;

    const totalRevenue = orders.reduce((sum, order) => {
      const orderItemsTotal = order.items.reduce((itemSum, item) => {
        return itemSum + Number(item.total);
      }, 0);
      return sum + orderItemsTotal;
    }, 0);

    return {
      total,
      pending,
      processing,
      shipped,
      delivered,
      cancelled,
      totalRevenue,
      averageOrderValue: total > 0 ? totalRevenue / total : 0,
    };
  }

  /**
   * Get single order details for seller
   */
  async getOrder(userId: string, orderId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        items: {
          some: {
            product: {
              storeId: store.id,
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          where: {
            product: {
              storeId: store.id,
            },
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                heroImage: true,
              },
            },
          },
        },
        shippingAddress: true,
        paymentTransactions: {
          select: {
            id: true,
            status: true,
            paymentMethod: true,
            processingFeeAmount: true,
            processingFeePercent: true,
            processingFeeFixed: true,
          },
        },
        delivery: {
          include: {
            deliveryPartner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            provider: {
              select: {
                id: true,
                name: true,
                contactPhone: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found or does not belong to your store');
    }

    // Apply seller-specific totals calculation
    const sellerTotals = await this.calculateSellerOrderTotals(order);

    return {
      ...order,
      sellerTotals, // Seller-specific breakdown
      originalTotal: Number(order.total), // Full order total for reference
    };
  }

  /**
   * Update order status
   * Sellers can only update to: PROCESSING, SHIPPED, DELIVERED
   */
  async updateOrderStatus(userId: string, orderId: string, status: string, notes?: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Verify order belongs to seller's store
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        items: {
          some: {
            product: {
              storeId: store.id,
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found or does not belong to your store');
    }

    // Validate allowed status transitions
    const allowedStatuses = ['PROCESSING', 'SHIPPED', 'DELIVERED'];
    if (!allowedStatuses.includes(status)) {
      throw new ForbiddenException(`Sellers can only update order status to: ${allowedStatuses.join(', ')}`);
    }

    // Validate status transition logic
    if (status === 'SHIPPED' && !['PROCESSING', 'CONFIRMED'].includes(order.status)) {
      throw new ForbiddenException('Order must be in PROCESSING or CONFIRMED status to mark as SHIPPED');
    }

    if (status === 'DELIVERED' && order.status !== 'SHIPPED') {
      throw new ForbiddenException('Order must be SHIPPED before marking as DELIVERED');
    }

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as any, // Cast to satisfy Prisma type
        notes: notes ? `${order.notes || ''}\n[${new Date().toISOString()}] ${notes}` : order.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          where: {
            product: {
              storeId: store.id,
            },
          },
          include: {
            product: true,
          },
        },
      },
    });

    return {
      message: `Order status updated to ${status}`,
      order: updatedOrder,
    };
  }

  /**
   * Update shipping information
   */
  async updateShippingInfo(userId: string, orderId: string, data: { trackingNumber?: string; carrier?: string; notes?: string }) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Verify order belongs to seller's store
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        items: {
          some: {
            product: {
              storeId: store.id,
            },
          },
        },
      },
      include: {
        delivery: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found or does not belong to your store');
    }

    // Update delivery tracking information if delivery exists
    if (order.delivery && data.trackingNumber) {
      await this.prisma.delivery.update({
        where: { id: order.delivery.id },
        data: {
          trackingNumber: data.trackingNumber,
          trackingUrl: data.carrier ? `https://${data.carrier}.com/track/${data.trackingNumber}` : undefined,
        },
      });
    }

    // Update order notes if provided
    if (data.notes) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          notes: `${order.notes || ''}\n[${new Date().toISOString()}] ${data.notes}`,
        },
      });
    }

    // Fetch updated order with delivery
    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        delivery: true,
      },
    });

    return {
      message: 'Shipping information updated successfully',
      order: updatedOrder,
    };
  }

  /**
   * Get seller's dashboard summary
   */
  async getDashboardSummary(userId: string) {
    console.log('[DASHBOARD] Starting getDashboardSummary for userId:', userId);

    try {
      // First check if store exists
      console.log('[DASHBOARD] Step 1: Fetching store...');
      const store = await this.prisma.store.findUnique({
        where: { userId },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          verified: true,
          rating: true,
          totalSales: true,
          totalOrders: true,
          totalProducts: true,
          createdAt: true,
        },
      });
      console.log('[DASHBOARD] Store fetched:', store ? 'Found' : 'Not found');

      if (!store) {
        throw new NotFoundException('Store not found. Please create a store first.');
      }

      // Now get all stats in parallel (store exists, safe to proceed)
      console.log('[DASHBOARD] Step 2: Fetching product and order stats...');
      let productStats, orderStats;
      try {
        productStats = await this.getProductStats(userId);
        console.log('[DASHBOARD] Product stats fetched successfully');
      } catch (error) {
        console.error('[DASHBOARD] ERROR in getProductStats:', error.message);
        throw error;
      }

      try {
        orderStats = await this.getOrderStats(userId);
        console.log('[DASHBOARD] Order stats fetched successfully');
      } catch (error) {
        console.error('[DASHBOARD] ERROR in getOrderStats:', error.message);
        throw error;
      }
      console.log('[DASHBOARD] Stats fetched successfully');

      // Get recent activity (might be empty for new stores)
      console.log('[DASHBOARD] Step 3: Fetching recent activity...');
      let recentActivity = [];
      try {
        recentActivity = await this.getRecentActivity(userId, 5);
        console.log('[DASHBOARD] Activity fetched:', recentActivity.length, 'items');
      } catch (activityError) {
        console.warn('[DASHBOARD] Failed to fetch recent activity:', activityError);
        recentActivity = [];
      }

      // Calculate payouts data
      console.log('[DASHBOARD] Step 4: Calculating payouts...');
      const payouts = {
        totalEarnings: Number(orderStats.totalRevenue) || 0,
        pendingBalance: Number(orderStats.totalRevenue) * 0.3 || 0,
        availableBalance: Number(orderStats.totalRevenue) * 0.7 || 0,
        nextPayoutDate: null,
      };

      // Convert Decimal fields to numbers for JSON serialization
      console.log('[DASHBOARD] Step 5: Preparing response...');
      const response = {
        store: {
          ...store,
          rating: store.rating ? Number(store.rating) : null,
          totalSales: store.totalSales ? Number(store.totalSales) : 0,
        },
        products: productStats,
        orders: orderStats,
        payouts,
        recentActivity,
      };

      console.log('[DASHBOARD] Response prepared successfully');
      console.log('[DASHBOARD] Full response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('[DASHBOARD] ERROR in getDashboardSummary:', error.message);
      console.error('[DASHBOARD] Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Create product for seller's store
   */
  async createProduct(userId: string, data: any) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found. Please create a store first.');
    }

    if (store.status !== 'ACTIVE') {
      throw new ForbiddenException('Your store must be approved before you can add products.');
    }

    // Check subscription requirements for subscription-based product types
    const subscriptionTypes = ['SERVICE', 'RENTAL', 'VEHICLE', 'REAL_ESTATE'];
    const productType = data.productType;

    if (productType && subscriptionTypes.includes(productType)) {
      const check = await this.subscriptionService.canListProductType(
        userId,
        productType,
      );

      if (!check.canList) {
        const messages: string[] = [];
        if (!check.reasons.productTypeAllowed) {
          messages.push(`Your plan does not allow ${productType} listings`);
        }
        if (!check.reasons.meetsTierRequirement) {
          messages.push(
            `Upgrade your subscription to list ${productType} products`,
          );
        }
        if (!check.reasons.hasListingCapacity) {
          messages.push('You have reached your maximum listing limit');
        }
        if (!check.reasons.hasCredits) {
          messages.push('Insufficient credits for this listing');
        }

        throw new BadRequestException(messages.join('. '));
      }
    }

    // Create product with seller's store ID
    const product = await this.prisma.product.create({
      data: {
        ...data,
        storeId: store.id,
        status: data.status || 'DRAFT',
      },
      include: {
        category: true,
        images: true,
      },
    });

    // Deduct credits for subscription-based product types
    if (productType && subscriptionTypes.includes(productType)) {
      try {
        const action = `list_${productType.toLowerCase()}`;
        await this.creditsService.debitCredits(
          userId,
          action,
          `Listed ${productType} product`,
          product.id,
        );
      } catch (error) {
        // Log but don't fail - product is already created
        this.logger.warn(
          `Failed to deduct credits for product ${product.id}: ${error.message}`,
        );
      }
    }

    // Update store product count
    await this.prisma.store.update({
      where: { id: store.id },
      data: {
        totalProducts: {
          increment: 1,
        },
      },
    });

    return product;
  }

  /**
   * Update seller's product
   */
  async updateProduct(userId: string, productId: string, data: any) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Verify product belongs to seller's store
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        storeId: store.id,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found or does not belong to your store');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data,
      include: {
        category: true,
        images: true,
      },
    });
  }

  /**
   * Delete seller's product
   */
  async deleteProduct(userId: string, productId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Verify product belongs to seller's store
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        storeId: store.id,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found or does not belong to your store');
    }

    await this.prisma.product.delete({
      where: { id: productId },
    });

    // Update store product count
    await this.prisma.store.update({
      where: { id: store.id },
      data: {
        totalProducts: {
          decrement: 1,
        },
      },
    });

    return { message: 'Product deleted successfully' };
  }

  /**
   * Get single product by ID (seller's product)
   */
  async getProduct(userId: string, productId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        storeId: store.id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
        variants: true,
        tags: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Bulk update product status
   */
  async bulkUpdateStatus(userId: string, productIds: string[], status: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Update only products that belong to seller's store
    const result = await this.prisma.product.updateMany({
      where: {
        id: { in: productIds },
        storeId: store.id,
      },
      data: { status: status as ProductStatus },
    });

    return {
      message: `${result.count} products updated successfully`,
      count: result.count,
    };
  }

  /**
   * Bulk delete products
   */
  async bulkDelete(userId: string, productIds: string[]) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Delete only products that belong to seller's store
    const result = await this.prisma.product.deleteMany({
      where: {
        id: { in: productIds },
        storeId: store.id,
      },
    });

    // Update store product count
    await this.prisma.store.update({
      where: { id: store.id },
      data: {
        totalProducts: {
          decrement: result.count,
        },
      },
    });

    return {
      message: `${result.count} products deleted successfully`,
      count: result.count,
    };
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  /**
   * Get revenue analytics with trend data
   */
  async getRevenueAnalytics(userId: string, period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    try {
      const store = await this.prisma.store.findUnique({
        where: { userId },
      });

      if (!store) {
        throw new NotFoundException('Store not found');
      }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let groupByFormat: string;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        groupByFormat = 'day';
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // Last 12 weeks
        groupByFormat = 'week';
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000); // Last 12 months
        groupByFormat = 'month';
        break;
    }

    // Get orders within date range
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        items: {
          some: {
            product: {
              storeId: store.id,
            },
          },
        },
        status: {
          notIn: ['CANCELLED'],
        },
      },
      include: {
        items: {
          where: {
            product: {
              storeId: store.id,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group orders by period and calculate revenue
    const revenueMap = new Map<string, { amount: number; orders: number }>();

    orders.forEach((order) => {
      const orderRevenue = order.items.reduce((sum, item) => sum + Number(item.total), 0);
      const dateKey = this.formatDateForPeriod(order.createdAt, groupByFormat);

      const existing = revenueMap.get(dateKey) || { amount: 0, orders: 0 };
      revenueMap.set(dateKey, {
        amount: existing.amount + orderRevenue,
        orders: existing.orders + 1,
      });
    });

    // Convert to array and fill gaps
    const data = this.fillRevenueDateGaps(revenueMap, startDate, now, period);

      // Calculate total and trend
      const total = data.reduce((sum, item) => sum + item.amount, 0);
      const trend = this.calculateRevenueTrend(data, period);

      return {
        period,
        data,
        total,
        trend,
      };
    } catch (error) {
      console.error('Error in getRevenueAnalytics:', error);
      // Return empty data instead of throwing
      return {
        period,
        data: [],
        total: 0,
        trend: { value: 0, isPositive: true },
      };
    }
  }

  /**
   * Get top performing products
   */
  async getTopProducts(userId: string, limit: number = 5) {
    try {
      const store = await this.prisma.store.findUnique({
        where: { userId },
      });

      if (!store) {
        throw new NotFoundException('Store not found');
      }

      // Get all order items for this store's products
      const orderItems = await this.prisma.orderItem.findMany({
        where: {
          product: {
            storeId: store.id,
          },
          order: {
            status: {
              notIn: ['CANCELLED'],
            },
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              heroImage: true,
              viewCount: true,
            },
          },
        },
      });

      // Group by product and calculate metrics
      const productMetrics = new Map<string, any>();

      orderItems.forEach((item) => {
        const productId = item.product.id;
        const existing = productMetrics.get(productId);

        if (existing) {
          existing.sales += item.quantity;
          existing.revenue += Number(item.total);
        } else {
          productMetrics.set(productId, {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            image: item.product.heroImage,
            sales: item.quantity,
            revenue: Number(item.total),
            views: item.product.viewCount,
          });
        }
      });

      // Convert to array, sort by revenue, and return top N
      const topProducts = Array.from(productMetrics.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);

      return topProducts;
    } catch (error) {
      console.error('Error in getTopProducts:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Get recent activity feed
   */
  async getRecentActivity(userId: string, limit: number = 10) {
    try {
      const store = await this.prisma.store.findUnique({
        where: { userId },
      });

      if (!store) {
        throw new NotFoundException('Store not found');
      }

      const activities: any[] = [];

      // Get recent orders
      const recentOrders = await this.prisma.order.findMany({
        where: {
          items: {
            some: {
              product: {
                storeId: store.id,
              },
            },
          },
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      });

      recentOrders.forEach((order) => {
        activities.push({
          id: `order-${order.id}`,
          type: 'order',
          title: 'New Order',
          description: `Order #${order.orderNumber} from ${order.user.firstName} ${order.user.lastName}`,
          timestamp: order.createdAt.toISOString(),
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
          },
        });
      });

      // Get recent products
      const recentProducts = await this.prisma.product.findMany({
        where: {
          storeId: store.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      });

      recentProducts.forEach((product) => {
        activities.push({
          id: `product-${product.id}`,
          type: 'product',
          title: 'Product Created',
          description: `${product.name} was added to your store`,
          timestamp: product.createdAt.toISOString(),
          metadata: {
            productId: product.id,
            productName: product.name,
            status: product.status,
          },
        });
      });

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error in getRecentActivity:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Get order status breakdown for analytics
   */
  async getOrderStatusBreakdown(userId: string) {
    try {
      const orderStats = await this.getOrderStats(userId);

      return {
        pending: orderStats.pending,
        processing: orderStats.processing,
        shipped: orderStats.shipped,
        delivered: orderStats.delivered,
        cancelled: orderStats.cancelled,
        total: orderStats.total,
      };
    } catch (error) {
      console.error('Error in getOrderStatusBreakdown:', error);
      // Return empty breakdown on error
      return {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        total: 0,
      };
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Format date based on period
   */
  private formatDateForPeriod(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (format) {
      case 'day':
        return `${year}-${month}-${day}`;
      case 'week':
        const weekNumber = this.getWeekNumber(date);
        return `${year}-W${String(weekNumber).padStart(2, '0')}`;
      case 'month':
        return `${year}-${month}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }

  /**
   * Get ISO week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Fill gaps in revenue data
   */
  private fillRevenueDateGaps(
    revenueMap: Map<string, { amount: number; orders: number }>,
    startDate: Date,
    endDate: Date,
    period: string,
  ) {
    const data: Array<{ date: string; amount: number; orders: number }> = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateKey = this.formatDateForPeriod(current, period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month');
      const revenueData = revenueMap.get(dateKey) || { amount: 0, orders: 0 };

      data.push({
        date: dateKey,
        amount: revenueData.amount,
        orders: revenueData.orders,
      });

      // Increment date based on period
      if (period === 'daily') {
        current.setDate(current.getDate() + 1);
      } else if (period === 'weekly') {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return data;
  }

  /**
   * Calculate revenue trend
   */
  private calculateRevenueTrend(data: Array<{ amount: number }>, period: string) {
    if (data.length < 2) {
      return { value: 0, isPositive: true };
    }

    const halfPoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, halfPoint);
    const secondHalf = data.slice(halfPoint);

    const firstHalfTotal = firstHalf.reduce((sum, item) => sum + item.amount, 0);
    const secondHalfTotal = secondHalf.reduce((sum, item) => sum + item.amount, 0);

    if (firstHalfTotal === 0) {
      return { value: 0, isPositive: true };
    }

    const percentChange = ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100;

    return {
      value: Math.abs(Math.round(percentChange * 10) / 10),
      isPositive: percentChange >= 0,
    };
  }

  // ============================================================================
  // Seller Application
  // ============================================================================

  /**
   * Apply to become a seller
   */
  async applyToBecomeSeller(userId: string, data: {
    storeName: string;
    storeDescription?: string;
    businessType: string;
    businessName?: string;
    taxId?: string;
    phone: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    productCategories?: string[];
    monthlyVolume?: string;
  }) {
    // Check if user already has a store
    const existingStore = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (existingStore) {
      if (existingStore.status === 'ACTIVE') {
        throw new ForbiddenException('You are already a seller');
      }
      if (existingStore.status === 'PENDING') {
        throw new ForbiddenException('Your seller application is already pending review');
      }
      if (existingStore.status === 'REJECTED') {
        // Allow re-application by updating the existing store
        const updatedStore = await this.prisma.store.update({
          where: { userId },
          data: {
            name: data.storeName,
            slug: this.generateSlug(data.storeName),
            description: data.storeDescription,
            phone: data.phone,
            website: data.website,
            taxId: data.taxId,
            address1: data.address,
            city: data.city,
            province: data.state,
            postalCode: data.zipCode,
            country: data.country,
            status: 'PENDING',
          },
        });

        return {
          success: true,
          message: 'Seller application resubmitted successfully. We will review your application and get back to you soon.',
          store: {
            id: updatedStore.id,
            name: updatedStore.name,
            status: updatedStore.status,
          },
        };
      }
    }

    // Check if user is a buyer or customer
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'BUYER' && user.role !== 'CUSTOMER') {
      throw new ForbiddenException('Only buyers can apply to become sellers');
    }

    // Create the store with PENDING status
    const store = await this.prisma.store.create({
      data: {
        userId,
        name: data.storeName,
        slug: this.generateSlug(data.storeName),
        description: data.storeDescription,
        email: user.email,
        phone: data.phone,
        website: data.website,
        taxId: data.taxId,
        address1: data.address,
        city: data.city,
        province: data.state,
        postalCode: data.zipCode,
        country: data.country,
        status: 'PENDING',
      },
    });

    return {
      success: true,
      message: 'Seller application submitted successfully. We will review your application and get back to you soon.',
      store: {
        id: store.id,
        name: store.name,
        status: store.status,
      },
    };
  }

  /**
   * Get seller application status
   */
  async getApplicationStatus(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        verifiedAt: true,
      },
    });

    if (!store) {
      return {
        success: true,
        data: {
          hasApplication: false,
          status: null,
        },
      };
    }

    return {
      success: true,
      data: {
        hasApplication: true,
        store: {
          id: store.id,
          name: store.name,
          status: store.status,
          appliedAt: store.createdAt,
          approvedAt: store.verifiedAt,
        },
      },
    };
  }

  /**
   * Confirm shipment with DHL tracking number
   * DHL API Integration - Day 1-2 Implementation
   */
  async confirmShipment(
    userId: string,
    orderId: string,
    data: {
      trackingNumber: string;
      dhlServiceType?: string;
      packageWeight?: string;
      packageDimensions?: string;
      recipientPostalCode?: string;
      originCountryCode?: string;
      language?: string;
    },
  ) {
    // Get seller's store
    const store = await this.prisma.store.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Find order and verify seller owns it
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                storeId: true,
              },
            },
          },
        },
        delivery: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify seller owns at least one item in the order
    const sellerOwnsOrder = order.items.some(
      (item) => item.product.storeId === store.id,
    );

    if (!sellerOwnsOrder) {
      throw new ForbiddenException('You do not have permission to ship this order');
    }

    // Validate order status
    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      throw new BadRequestException('Cannot ship a cancelled or refunded order');
    }

    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      throw new BadRequestException('Order has already been shipped');
    }

    try {
      // Update order status to SHIPPED
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'SHIPPED',
        },
      });

      // Create or update delivery record
      let delivery;
      if (order.delivery) {
        // Update existing delivery
        delivery = await this.prisma.delivery.update({
          where: { id: order.delivery.id },
          data: {
            trackingNumber: data.trackingNumber,
            carrier: 'DHL',
            currentStatus: 'PICKED_UP',
            dhlServiceType: data.dhlServiceType || null,
            packageWeight: data.packageWeight || null,
            packageDimensions: data.packageDimensions || null,
            shippedAt: new Date(),
          },
        });
      } else {
        // Create new delivery (requires pickup and delivery addresses)
        // Get order with shipping address
        const orderWithAddress = await this.prisma.order.findUnique({
          where: { id: orderId },
          include: {
            shippingAddress: true,
          },
        });

        if (!orderWithAddress?.shippingAddress) {
          throw new BadRequestException('Order must have a shipping address to create delivery');
        }

        delivery = await this.prisma.delivery.create({
          data: {
            order: {
              connect: { id: orderId },
            },
            trackingNumber: data.trackingNumber,
            carrier: 'DHL',
            currentStatus: 'PICKED_UP',
            dhlServiceType: data.dhlServiceType || null,
            packageWeight: data.packageWeight || null,
            packageDimensions: data.packageDimensions || null,
            shippedAt: new Date(),
            pickupAddress: {}, // TODO: Get seller/warehouse address
            deliveryAddress: {
              address1: orderWithAddress.shippingAddress.address1,
              address2: orderWithAddress.shippingAddress.address2 || '',
              city: orderWithAddress.shippingAddress.city,
              province: orderWithAddress.shippingAddress.province,
              postalCode: orderWithAddress.shippingAddress.postalCode,
              country: orderWithAddress.shippingAddress.country,
            },
          },
        });
      }

      // Fetch initial DHL tracking data (async, non-blocking)
      this.fetchInitialDhlTracking(delivery.id, data).catch((error) => {
        this.logger.error(
          `Failed to fetch initial DHL tracking for delivery ${delivery.id}`,
          error.message,
        );
      });

      // Generate tracking URL
      const trackingUrl = this.dhlTrackingService.generateTrackingUrl(
        data.trackingNumber,
      );

      this.logger.log(
        `Order ${orderId} shipped successfully with DHL tracking ${data.trackingNumber}`,
      );

      return {
        success: true,
        message: 'Shipment confirmed successfully',
        data: {
          orderId: order.id,
          deliveryId: delivery.id,
          trackingNumber: data.trackingNumber,
          trackingUrl,
          status: delivery.currentStatus,
          shippedAt: delivery.shippedAt,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to confirm shipment for order ${orderId}`, error.message);
      throw new BadRequestException('Failed to confirm shipment');
    }
  }

  /**
   * Fetch initial DHL tracking data (private helper method)
   * Runs asynchronously to avoid blocking the confirmation response
   */
  private async fetchInitialDhlTracking(
    deliveryId: string,
    data: {
      dhlServiceType?: string;
      recipientPostalCode?: string;
      originCountryCode?: string;
      language?: string;
    },
  ): Promise<void> {
    try {
      // ✅ Pass optional parameters to DHL API for better tracking accuracy
      const trackingOptions = {
        service: data.dhlServiceType,
        recipientPostalCode: data.recipientPostalCode,
        originCountryCode: data.originCountryCode || 'RW', // Default to Rwanda
        language: data.language || 'en',
      };

      await this.dhlTrackingService.updateDeliveryFromDhl(
        deliveryId,
        trackingOptions,
      );

      this.logger.log(`Initial DHL tracking data fetched for delivery ${deliveryId}`);
    } catch (error) {
      this.logger.warn(
        `Could not fetch initial DHL tracking for delivery ${deliveryId}: ${error.message}`,
      );
      // Non-critical error, don't throw
    }
  }

  /**
   * Generate unique slug from store name
   */
  private generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const uniqueSuffix = Date.now().toString(36).slice(-6);
    return `${baseSlug}-${uniqueSuffix}`;
  }
}
