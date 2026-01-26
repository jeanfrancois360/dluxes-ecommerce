import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DeliveryStatus, DeliveryConfirmationType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { DeliveryAssignmentService } from './delivery-assignment.service';
import { DeliveryAuditService } from './delivery-audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DhlTrackingService } from '../integrations/dhl/dhl-tracking.service';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly assignmentService: DeliveryAssignmentService,
    private readonly auditService: DeliveryAuditService,
    private readonly notificationsService: NotificationsService,
    private readonly dhlTrackingService: DhlTrackingService,
  ) {}

  /**
   * Create delivery record for an order
   */
  async createDelivery(data: {
    orderId: string;
    providerId?: string;
    deliveryPartnerId?: string;
    pickupAddress: any;
    deliveryAddress: any;
    trackingNumber?: string;
    expectedDeliveryDate?: Date;
    deliveryFee: number;
    partnerCommission: number;
    platformFee: number;
  }) {
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const delivery = await this.prisma.delivery.create({
      data: {
        orderId: data.orderId,
        providerId: data.providerId,
        deliveryPartnerId: data.deliveryPartnerId,
        pickupAddress: data.pickupAddress,
        deliveryAddress: data.deliveryAddress,
        trackingNumber: data.trackingNumber || `TRK${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        expectedDeliveryDate: data.expectedDeliveryDate,
        deliveryFee: new Decimal(data.deliveryFee),
        partnerCommission: new Decimal(data.partnerCommission),
        platformFee: new Decimal(data.platformFee),
        currentStatus: 'PENDING_PICKUP',
      },
      include: {
        provider: true,
        deliveryPartner: true,
        order: true,
      },
    });

    this.logger.log(`Created delivery for order ${order.orderNumber}: ${delivery.trackingNumber}`);

    return delivery;
  }

  /**
   * Auto-create delivery for order with intelligent provider selection
   */
  async autoCreateDeliveryForOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shippingAddress: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if delivery already exists
    const existingDelivery = await this.prisma.delivery.findUnique({
      where: { orderId },
    });

    if (existingDelivery) {
      this.logger.warn(`Delivery already exists for order ${order.orderNumber}`);
      return existingDelivery;
    }

    // Use auto-assignment to select best provider
    const selectedProvider = await this.assignmentService.autoAssignProvider({
      destinationCountry: order.shippingAddress.country,
      orderValue: Number(order.total),
      urgency: 'standard',
    });

    if (!selectedProvider) {
      this.logger.error(`No suitable provider found for order ${order.orderNumber}`);
      throw new BadRequestException('No delivery provider available for this destination');
    }

    // Calculate expected delivery date
    const expectedDeliveryDate = this.assignmentService.calculateExpectedDelivery(
      selectedProvider,
      order.shippingAddress.country
    );

    // Calculate commission
    const deliveryFee = Number(order.shipping);
    const commissionRate = Number(selectedProvider.commissionRate);
    const partnerCommission =
      selectedProvider.commissionType === 'PERCENTAGE'
        ? (deliveryFee * commissionRate) / 100
        : commissionRate;
    const platformFee = 2.5; // Fixed platform fee

    // Prepare addresses
    const pickupAddress = {
      name: 'NextPik Warehouse', // TODO: Get from seller/store
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

    // Create delivery with selected provider
    const delivery = await this.createDelivery({
      orderId,
      providerId: selectedProvider.id,
      pickupAddress,
      deliveryAddress,
      expectedDeliveryDate,
      deliveryFee,
      partnerCommission,
      platformFee,
    });

    this.logger.log(
      `Auto-created delivery for order ${order.orderNumber} with provider ${selectedProvider.name}`
    );

    // Send delivery assigned notification to buyer
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: order.userId },
        select: { email: true, firstName: true, lastName: true },
      });

      if (user?.email) {
        await this.notificationsService.sendDeliveryAssigned({
          customerEmail: user.email,
          customerName: `${user.firstName} ${user.lastName}`.trim() || 'Customer',
          orderNumber: order.orderNumber,
          trackingNumber: delivery.trackingNumber,
          providerName: selectedProvider.name,
          expectedDeliveryDate: expectedDeliveryDate
            ? new Date(expectedDeliveryDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : undefined,
        });
        this.logger.log(`Sent delivery assigned notification to ${user.email}`);
      }
    } catch (error) {
      this.logger.error('Failed to send delivery assigned notification:', error);
      // Don't throw - notification failure shouldn't block delivery creation
    }

    return delivery;
  }

  /**
   * Assign delivery to provider and/or partner
   */
  async assignDelivery(
    deliveryId: string,
    data: {
      providerId?: string;
      deliveryPartnerId?: string;
      assignedBy: string;
    }
  ) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        providerId: data.providerId || delivery.providerId,
        deliveryPartnerId: data.deliveryPartnerId || delivery.deliveryPartnerId,
        assignedBy: data.assignedBy,
        assignedAt: new Date(),
      },
      include: {
        provider: true,
        deliveryPartner: true,
        order: true,
      },
    });

    this.logger.log(`Assigned delivery ${delivery.trackingNumber} to provider/partner`);

    return updated;
  }

  /**
   * Update delivery status
   */
  async updateStatus(
    deliveryId: string,
    status: DeliveryStatus,
    updatedBy: string,
    notes?: string
  ) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    const updateData: any = {
      currentStatus: status,
    };

    // Update timestamps based on status
    switch (status) {
      case 'PICKUP_SCHEDULED':
        updateData.pickupScheduledAt = new Date();
        break;
      case 'PICKED_UP':
        updateData.pickedUpAt = new Date();
        break;
      case 'IN_TRANSIT':
        updateData.inTransitAt = new Date();
        break;
      case 'OUT_FOR_DELIVERY':
        updateData.outForDeliveryAt = new Date();
        break;
      case 'DELIVERED':
        updateData.deliveredAt = new Date();
        break;
    }

    if (notes) {
      updateData.internalNotes = notes;
    }

    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
    });

    // Create order timeline entry
    await this.prisma.orderTimeline.create({
      data: {
        orderId: delivery.orderId,
        status: this.mapDeliveryStatusToOrderStatus(status),
        title: this.getStatusTitle(status),
        description: notes || `Delivery status updated to ${status}`,
        icon: this.getStatusIcon(status),
      },
    });

    this.logger.log(`Updated delivery ${delivery.trackingNumber} status to ${status}`);

    // Send notification when delivery status changes to DELIVERED
    if (status === 'DELIVERED') {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: delivery.order.userId },
          select: { email: true, firstName: true, lastName: true },
        });

        if (user?.email) {
          await this.notificationsService.sendDeliveryDelivered({
            customerEmail: user.email,
            customerName: `${user.firstName} ${user.lastName}`.trim() || 'Customer',
            orderNumber: delivery.order.orderNumber,
            trackingNumber: delivery.trackingNumber,
          });
          this.logger.log(`Sent delivery delivered notification to ${user.email}`);
        }
      } catch (error) {
        this.logger.error('Failed to send delivery delivered notification:', error);
        // Don't throw - notification failure shouldn't block status update
      }
    }

    return updated;
  }

  /**
   * Confirm delivery with proof
   */
  async confirmDelivery(
    deliveryId: string,
    data: {
      confirmedBy: string;
      confirmationType: DeliveryConfirmationType;
      proofOfDelivery?: {
        signature?: string;
        photos?: string[];
        notes?: string;
        gps?: { latitude: number; longitude: number };
      };
      customerRating?: number;
      customerFeedback?: string;
    }
  ) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.currentStatus !== 'DELIVERED' && delivery.currentStatus !== 'OUT_FOR_DELIVERY') {
      throw new BadRequestException('Delivery must be marked as delivered or out for delivery first');
    }

    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        currentStatus: 'DELIVERED',
        deliveredAt: new Date(),
        confirmedBy: data.confirmedBy,
        confirmationType: data.confirmationType,
        proofOfDelivery: data.proofOfDelivery || {},
        customerRating: data.customerRating,
        customerFeedback: data.customerFeedback,
      },
    });

    // Update escrow transaction if exists
    const escrow = await this.prisma.escrowTransaction.findUnique({
      where: { orderId: delivery.orderId },
    });

    if (escrow && !escrow.deliveryConfirmed) {
      const holdPeriodDays = escrow.holdPeriodDays || 7;
      const autoReleaseAt = new Date(Date.now() + holdPeriodDays * 24 * 60 * 60 * 1000);

      await this.prisma.escrowTransaction.update({
        where: { orderId: delivery.orderId },
        data: {
          deliveryConfirmed: true,
          deliveryConfirmedAt: new Date(),
          deliveryConfirmedBy: data.confirmedBy,
          status: 'PENDING_RELEASE',
          autoReleaseAt,
        },
      });

      this.logger.log(
        `Delivery confirmed for order ${delivery.order.orderNumber}. Escrow will auto-release on ${autoReleaseAt.toISOString()}`
      );
    }

    // Create order timeline entry
    await this.prisma.orderTimeline.create({
      data: {
        orderId: delivery.orderId,
        status: 'DELIVERED',
        title: 'Delivery Confirmed',
        description: `Delivery confirmed by ${data.confirmationType}`,
        icon: 'check-circle',
      },
    });

    this.logger.log(`Confirmed delivery ${delivery.trackingNumber}`);

    return updated;
  }

  /**
   * Report delivery issue
   */
  async reportIssue(
    deliveryId: string,
    data: {
      issueDescription: string;
      reportedBy: string;
    }
  ) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        hasIssue: true,
        issueDescription: data.issueDescription,
        issueReportedAt: new Date(),
      },
    });

    this.logger.log(`Issue reported for delivery ${delivery.trackingNumber}`);

    return updated;
  }

  /**
   * Track delivery by tracking number (public endpoint)
   * DHL API Integration - Enhanced with DHL tracking events
   */
  async trackByTrackingNumber(trackingNumber: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { trackingNumber },
      include: {
        order: {
          select: {
            orderNumber: true,
            status: true,
            createdAt: true,
          },
        },
        provider: {
          select: {
            name: true,
            logo: true,
          },
        },
        trackingEvents: {
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException('Tracking number not found');
    }

    // Build timeline from DHL tracking events if available
    let timeline;
    if (delivery.carrier === 'DHL' && delivery.trackingEvents.length > 0) {
      // Use DHL tracking events for timeline
      timeline = delivery.trackingEvents.map((event) => ({
        status: event.status,
        statusDescription: event.statusDescription,
        timestamp: event.timestamp,
        location: event.location,
        completed: true,
      }));
    } else {
      // Fallback to basic timeline from timestamp fields
      timeline = [
        { status: 'PENDING_PICKUP', timestamp: delivery.createdAt, completed: true },
        delivery.pickupScheduledAt && { status: 'PICKUP_SCHEDULED', timestamp: delivery.pickupScheduledAt, completed: true },
        delivery.pickedUpAt && { status: 'PICKED_UP', timestamp: delivery.pickedUpAt, completed: true },
        delivery.inTransitAt && { status: 'IN_TRANSIT', timestamp: delivery.inTransitAt, completed: true },
        delivery.outForDeliveryAt && { status: 'OUT_FOR_DELIVERY', timestamp: delivery.outForDeliveryAt, completed: true },
        delivery.deliveredAt && { status: 'DELIVERED', timestamp: delivery.deliveredAt, completed: true },
      ].filter(Boolean);
    }

    // Generate DHL tracking URL if carrier is DHL
    const trackingUrl = delivery.carrier === 'DHL'
      ? this.dhlTrackingService.generateTrackingUrl(trackingNumber)
      : null;

    return {
      trackingNumber: delivery.trackingNumber,
      carrier: delivery.carrier,
      currentStatus: delivery.currentStatus,
      currentLocation: delivery.currentLocation,
      expectedDeliveryDate: delivery.expectedDeliveryDate || delivery.dhlEstimatedDelivery,
      shippedAt: delivery.shippedAt,
      provider: delivery.provider,
      dhlServiceType: delivery.dhlServiceType,
      dhlLastSyncedAt: delivery.dhlLastSyncedAt,
      trackingUrl,
      timeline,
      order: {
        orderNumber: delivery.order.orderNumber,
        status: delivery.order.status,
        createdAt: delivery.order.createdAt,
      },
    };
  }

  /**
   * Get all deliveries with filters
   */
  async getAllDeliveries(filters?: {
    status?: DeliveryStatus;
    providerId?: string;
    deliveryPartnerId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(filters?.status && { currentStatus: filters.status }),
      ...(filters?.providerId && { providerId: filters.providerId }),
      ...(filters?.deliveryPartnerId && { deliveryPartnerId: filters.deliveryPartnerId }),
    };

    const [deliveries, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              total: true,
              status: true,
            },
          },
          provider: {
            select: {
              name: true,
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

  // Helper methods
  private mapDeliveryStatusToOrderStatus(deliveryStatus: DeliveryStatus): any {
    const statusMap: Record<DeliveryStatus, string> = {
      PENDING_PICKUP: 'PROCESSING',
      PICKUP_SCHEDULED: 'PROCESSING',
      PICKED_UP: 'SHIPPED',
      IN_TRANSIT: 'SHIPPED',
      OUT_FOR_DELIVERY: 'SHIPPED',
      DELIVERED: 'DELIVERED',
      FAILED_DELIVERY: 'PROCESSING',
      RETURNED: 'CANCELLED',
      CANCELLED: 'CANCELLED',
      EXCEPTION: 'PROCESSING',
    };

    return statusMap[deliveryStatus] || 'PROCESSING';
  }

  private getStatusTitle(status: DeliveryStatus): string {
    const titles: Record<DeliveryStatus, string> = {
      PENDING_PICKUP: 'Pending Pickup',
      PICKUP_SCHEDULED: 'Pickup Scheduled',
      PICKED_UP: 'Picked Up',
      IN_TRANSIT: 'In Transit',
      OUT_FOR_DELIVERY: 'Out for Delivery',
      DELIVERED: 'Delivered',
      FAILED_DELIVERY: 'Delivery Failed',
      RETURNED: 'Returned',
      CANCELLED: 'Cancelled',
      EXCEPTION: 'Exception',
    };

    return titles[status] || status;
  }

  private getStatusIcon(status: DeliveryStatus): string {
    const icons: Record<DeliveryStatus, string> = {
      PENDING_PICKUP: 'clock',
      PICKUP_SCHEDULED: 'calendar',
      PICKED_UP: 'package',
      IN_TRANSIT: 'truck',
      OUT_FOR_DELIVERY: 'map-pin',
      DELIVERED: 'check-circle',
      FAILED_DELIVERY: 'x-circle',
      RETURNED: 'arrow-left',
      CANCELLED: 'x',
      EXCEPTION: 'alert-triangle',
    };

    return icons[status] || 'circle';
  }

  /**
   * Buyer confirms receipt of delivery
   * This marks the delivery as confirmed and makes it eligible for payout
   */
  async buyerConfirmDelivery(deliveryId: string, buyerId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    // Verify buyer owns this order
    if (delivery.order.userId !== buyerId) {
      throw new BadRequestException('You can only confirm your own deliveries');
    }

    // Check delivery status
    if (delivery.currentStatus !== 'DELIVERED') {
      throw new BadRequestException('Delivery must be marked as delivered before confirmation');
    }

    if (delivery.buyerConfirmed) {
      throw new BadRequestException('Delivery has already been confirmed');
    }

    // Update delivery
    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        buyerConfirmed: true,
        buyerConfirmedAt: new Date(),
      },
    });

    // Create audit log
    await this.auditService.log({
      deliveryId,
      action: 'BUYER_CONFIRMED',
      performedBy: buyerId,
      userRole: 'BUYER',
      notes: 'Buyer confirmed receipt of delivery',
    });

    // Create order timeline entry
    await this.prisma.orderTimeline.create({
      data: {
        orderId: delivery.orderId,
        status: 'DELIVERED',
        title: 'Receipt Confirmed',
        description: 'You have confirmed receipt of your order',
        icon: 'check-circle',
      },
    });

    this.logger.log(
      `Buyer ${buyerId} confirmed delivery ${delivery.trackingNumber}`
    );

    // Send notification to admin and seller about confirmed delivery
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: buyerId },
        select: { email: true, firstName: true, lastName: true },
      });

      // Get admin email from settings or env
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@luxuryecommerce.com';

      // Get seller information from order
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

      // Get seller email (from first item's product store)
      const sellerEmail = orderWithSeller?.items[0]?.product?.store?.user?.email;
      const sellerName = orderWithSeller?.items[0]?.product?.store?.user
        ? `${orderWithSeller.items[0].product.store.user.firstName} ${orderWithSeller.items[0].product.store.user.lastName}`.trim()
        : undefined;

      await this.notificationsService.sendBuyerConfirmedNotification({
        adminEmail,
        sellerEmail: sellerEmail || undefined,
        orderNumber: delivery.order.orderNumber,
        trackingNumber: delivery.trackingNumber,
        customerName: user ? `${user.firstName} ${user.lastName}`.trim() || 'Customer' : 'Customer',
        sellerName,
      });

      this.logger.log(`Sent buyer confirmed notifications to admin${sellerEmail ? ' and seller' : ''}`);
    } catch (error) {
      this.logger.error('Failed to send buyer confirmed notification:', error);
      // Don't throw - notification failure shouldn't block confirmation
    }

    return updated;
  }

  /**
   * Upload proof of delivery
   * Called by delivery partner or admin after delivery is completed
   */
  async uploadProofOfDelivery(deliveryId: string, proofUrl: string, uploadedBy: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    // Only allow upload if delivery is OUT_FOR_DELIVERY or DELIVERED
    if (delivery.currentStatus !== 'OUT_FOR_DELIVERY' && delivery.currentStatus !== 'DELIVERED') {
      throw new BadRequestException(
        'Proof of delivery can only be uploaded when delivery is out for delivery or delivered'
      );
    }

    // Update delivery with proof URL
    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        proofOfDeliveryUrl: proofUrl,
      },
    });

    // Create audit log
    await this.auditService.log({
      deliveryId,
      action: 'PROOF_UPLOADED',
      performedBy: uploadedBy,
      userRole: 'DELIVERY_PARTNER',
      notes: 'Proof of delivery uploaded',
      metadata: {
        proofUrl,
      },
    });

    // Create order timeline entry
    await this.prisma.orderTimeline.create({
      data: {
        orderId: delivery.orderId,
        status: 'DELIVERED',
        title: 'Proof of Delivery Uploaded',
        description: 'Delivery partner uploaded proof of delivery',
        icon: 'file-text',
      },
    });

    this.logger.log(`Proof of delivery uploaded for ${delivery.trackingNumber}`);

    return updated;
  }

  /**
   * Get delivery by order ID (for buyer to confirm)
   */
  async getDeliveryByOrder(orderId: string, userId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { orderId },
      include: {
        order: true,
        provider: {
          select: {
            name: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found for this order');
    }

    // Verify user owns this order
    if (delivery.order.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return delivery;
  }
}
