import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DeliveryAuditService } from './delivery-audit.service';
import { Decimal } from '@prisma/client/runtime/library';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Admin Delivery Management Service
 * Handles admin-only operations: assign delivery, release payout, etc.
 */
@Injectable()
export class AdminDeliveryService {
  private readonly logger = new Logger(AdminDeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: DeliveryAuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Assign delivery company to an order
   * Creates a Delivery record with tracking number
   */
  async assignDeliveryToOrder(
    orderId: string,
    providerId: string,
    adminId: string,
    options?: {
      driverId?: string;
      expectedDeliveryDate?: Date;
      notes?: string;
    }
  ) {
    // Verify order exists and doesn't already have delivery
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shippingAddress: true,
        delivery: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.delivery) {
      throw new BadRequestException('Order already has a delivery assigned');
    }

    // Verify provider exists
    const provider = await this.prisma.deliveryProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Delivery provider not found');
    }

    if (!provider.isActive) {
      throw new BadRequestException('Delivery provider is not active');
    }

    // Generate tracking number
    const trackingNumber = `TRK${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate fees
    const deliveryFee = Number(order.shipping) || 15.0;
    const commissionRate = Number(provider.commissionRate);
    const partnerCommission =
      provider.commissionType === 'PERCENTAGE'
        ? (deliveryFee * commissionRate) / 100
        : commissionRate;
    const platformFee = 2.5;

    // Prepare addresses
    const pickupAddress = {
      name: 'NextPik Warehouse',
      address1: 'KG 123 St',
      city: 'Kigali',
      country: 'Rwanda',
      postalCode: '00000',
    };

    const deliveryAddress = {
      name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
      address1: order.shippingAddress.address1,
      address2: order.shippingAddress.address2,
      city: order.shippingAddress.city,
      province: order.shippingAddress.province,
      country: order.shippingAddress.country,
      postalCode: order.shippingAddress.postalCode,
    };

    // Calculate expected delivery date
    const expectedDeliveryDate =
      options?.expectedDeliveryDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days default

    // Create delivery
    const delivery = await this.prisma.delivery.create({
      data: {
        orderId,
        providerId,
        deliveryPartnerId: options?.driverId,
        trackingNumber,
        assignedBy: adminId,
        assignedAt: new Date(),
        pickupAddress,
        deliveryAddress,
        expectedDeliveryDate,
        deliveryFee: new Decimal(deliveryFee),
        partnerCommission: new Decimal(partnerCommission),
        platformFee: new Decimal(platformFee),
        currentStatus: 'PENDING_PICKUP',
        internalNotes: options?.notes,
      },
      include: {
        provider: true,
        order: true,
      },
    });

    // Create audit log
    await this.auditService.log({
      deliveryId: delivery.id,
      action: 'ASSIGNED_PROVIDER',
      performedBy: adminId,
      userRole: 'ADMIN',
      newValue: {
        providerId,
        providerName: provider.name,
        trackingNumber,
      },
      notes: `Delivery assigned to ${provider.name}`,
    });

    // Update order status if needed
    if (order.status === 'CONFIRMED') {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PROCESSING' },
      });
    }

    // Create order timeline entry
    await this.prisma.orderTimeline.create({
      data: {
        orderId,
        status: 'PROCESSING',
        title: 'Delivery Assigned',
        description: `Delivery company ${provider.name} assigned. Tracking: ${trackingNumber}`,
        icon: 'truck',
      },
    });

    this.logger.log(
      `Delivery assigned to order ${order.orderNumber}: ${provider.name} (${trackingNumber})`
    );

    return delivery;
  }

  /**
   * Release payout for a delivery
   * Manually triggered by admin after buyer confirmation
   */
  async releasePayoutForDelivery(deliveryId: string, adminId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: {
            escrowTransaction: true,
          },
        },
        provider: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    // Validate preconditions
    if (delivery.currentStatus !== 'DELIVERED') {
      throw new BadRequestException('Delivery must be marked as delivered first');
    }

    if (!delivery.buyerConfirmed) {
      throw new BadRequestException('Buyer must confirm receipt before payout can be released');
    }

    if (delivery.payoutReleased) {
      throw new BadRequestException('Payout has already been released for this delivery');
    }

    // Update delivery record
    const updatedDelivery = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        payoutReleased: true,
        payoutReleasedAt: new Date(),
        payoutReleasedBy: adminId,
      },
    });

    // Create audit log
    await this.auditService.log({
      deliveryId,
      action: 'PAYOUT_RELEASED',
      performedBy: adminId,
      userRole: 'ADMIN',
      notes: 'Manual payout release by admin',
      metadata: {
        deliveryFee: Number(delivery.deliveryFee),
        partnerCommission: Number(delivery.partnerCommission),
      },
    });

    // Trigger escrow release if exists
    if (delivery.order.escrowTransaction && delivery.order.escrowTransaction.status !== 'RELEASED') {
      try {
        // Import escrow service dynamically to avoid circular dependency
        const { EscrowService } = await import('../escrow/escrow.service');
        const { SettingsService } = await import('../settings/settings.service');

        const settingsService = new SettingsService(this.prisma);
        const escrowService = new EscrowService(this.prisma, settingsService);

        await escrowService.releaseEscrow(
          delivery.order.escrowTransaction.id,
          adminId
        );

        this.logger.log(`Escrow released for order ${delivery.order.orderNumber}`);
      } catch (escrowError) {
        this.logger.error(
          `Error releasing escrow for delivery ${deliveryId}:`,
          escrowError
        );
        // Don't fail the payout release if escrow fails
      }
    }

    // Create order timeline entry
    await this.prisma.orderTimeline.create({
      data: {
        orderId: delivery.orderId,
        status: 'DELIVERED',
        title: 'Payout Released',
        description: 'Payment released to seller',
        icon: 'dollar-sign',
      },
    });

    this.logger.log(
      `Payout released for delivery ${delivery.trackingNumber} by admin ${adminId}`
    );

    // Send payout released notification to seller
    try {
      const orderWithSeller = await this.prisma.order.findUnique({
        where: { id: delivery.orderId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  store: {
                    include: {
                      user: {
                        select: {
                          email: true,
                          firstName: true,
                          lastName: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const sellerEmail = orderWithSeller?.items[0]?.product?.store?.user?.email;
      const sellerName = orderWithSeller?.items[0]?.product?.store?.user
        ? `${orderWithSeller.items[0].product.store.user.firstName} ${orderWithSeller.items[0].product.store.user.lastName}`.trim()
        : 'Seller';

      if (sellerEmail) {
        // Calculate payout amount (total minus platform fees, etc.)
        const payoutAmount = Number(delivery.order.escrowTransaction?.totalAmount || delivery.order.total);

        await this.notificationsService.sendPayoutReleasedNotification({
          sellerEmail,
          sellerName,
          orderNumber: delivery.order.orderNumber,
          trackingNumber: delivery.trackingNumber,
          payoutAmount,
          currency: 'USD',
        });

        this.logger.log(`Sent payout released notification to seller ${sellerEmail}`);
      }
    } catch (error) {
      this.logger.error('Failed to send payout released notification:', error);
      // Don't throw - notification failure shouldn't block payout release
    }

    return updatedDelivery;
  }

  /**
   * Get all deliveries with filters (admin view)
   */
  async getAllDeliveries(filters?: {
    status?: string;
    providerId?: string;
    buyerConfirmed?: boolean;
    payoutReleased?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) {
      where.currentStatus = filters.status;
    }

    if (filters?.providerId) {
      where.providerId = filters.providerId;
    }

    if (filters?.buyerConfirmed !== undefined) {
      where.buyerConfirmed = filters.buyerConfirmed;
    }

    if (filters?.payoutReleased !== undefined) {
      where.payoutReleased = filters.payoutReleased;
    }

    const [deliveries, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              total: true,
              status: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          provider: {
            select: {
              name: true,
              type: true,
            },
          },
          deliveryPartner: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.delivery.count({ where }),
    ]);

    return {
      data: deliveries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get delivery statistics for admin dashboard
   */
  async getDeliveryStatistics() {
    const [
      total,
      pending,
      inTransit,
      delivered,
      awaitingConfirmation,
      awaitingPayout,
      payoutReleased,
    ] = await Promise.all([
      this.prisma.delivery.count(),
      this.prisma.delivery.count({
        where: { currentStatus: { in: ['PENDING_PICKUP', 'PICKUP_SCHEDULED'] } },
      }),
      this.prisma.delivery.count({
        where: { currentStatus: { in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } },
      }),
      this.prisma.delivery.count({
        where: { currentStatus: 'DELIVERED' },
      }),
      this.prisma.delivery.count({
        where: {
          currentStatus: 'DELIVERED',
          buyerConfirmed: false,
        },
      }),
      this.prisma.delivery.count({
        where: {
          buyerConfirmed: true,
          payoutReleased: false,
        },
      }),
      this.prisma.delivery.count({
        where: { payoutReleased: true },
      }),
    ]);

    return {
      total,
      pending,
      inTransit,
      delivered,
      awaitingConfirmation,
      awaitingPayout,
      payoutReleased,
    };
  }
}
