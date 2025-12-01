import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DeliveryStatus, DeliveryConfirmationType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(private readonly prisma: PrismaService) {}

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
      },
    });

    if (!delivery) {
      throw new NotFoundException('Tracking number not found');
    }

    return {
      trackingNumber: delivery.trackingNumber,
      currentStatus: delivery.currentStatus,
      expectedDeliveryDate: delivery.expectedDeliveryDate,
      provider: delivery.provider,
      timeline: [
        { status: 'PENDING_PICKUP', timestamp: delivery.createdAt, completed: true },
        delivery.pickupScheduledAt && { status: 'PICKUP_SCHEDULED', timestamp: delivery.pickupScheduledAt, completed: true },
        delivery.pickedUpAt && { status: 'PICKED_UP', timestamp: delivery.pickedUpAt, completed: true },
        delivery.inTransitAt && { status: 'IN_TRANSIT', timestamp: delivery.inTransitAt, completed: true },
        delivery.outForDeliveryAt && { status: 'OUT_FOR_DELIVERY', timestamp: delivery.outForDeliveryAt, completed: true },
        delivery.deliveredAt && { status: 'DELIVERED', timestamp: delivery.deliveredAt, completed: true },
      ].filter(Boolean),
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
    };

    return icons[status] || 'circle';
  }
}
