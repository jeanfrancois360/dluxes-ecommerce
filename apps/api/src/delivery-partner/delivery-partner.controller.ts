import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../database/prisma.service';
import { DeliveryStatus, DeliveryConfirmationType } from '@prisma/client';

@Controller('delivery-partner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DELIVERY_PARTNER')
export class DeliveryPartnerController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get delivery partner dashboard statistics
   */
  @Get('dashboard')
  async getDashboard(@Request() req) {
    const partnerId = req.user.userId;
    const [
      assignedDeliveries,
      completedToday,
      totalEarnings,
      activeDeliveries,
      avgRating,
    ] = await Promise.all([
      // Total assigned deliveries
      this.prisma.delivery.count({
        where: { deliveryPartnerId: partnerId },
      }),
      // Completed today
      this.prisma.delivery.count({
        where: {
          deliveryPartnerId: partnerId,
          currentStatus: 'DELIVERED',
          deliveredAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      // Total earnings
      this.prisma.delivery.aggregate({
        where: {
          deliveryPartnerId: partnerId,
          currentStatus: 'DELIVERED',
        },
        _sum: { partnerCommission: true },
      }),
      // Active deliveries
      this.prisma.delivery.count({
        where: {
          deliveryPartnerId: partnerId,
          currentStatus: {
            in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'],
          },
        },
      }),
      // Average rating
      this.prisma.delivery.aggregate({
        where: {
          deliveryPartnerId: partnerId,
          customerRating: { not: null },
        },
        _avg: { customerRating: true },
      }),
    ]);

    return {
      statistics: {
        totalDeliveries: assignedDeliveries,
        completedToday,
        totalEarnings: totalEarnings._sum.partnerCommission || 0,
        activeDeliveries,
        averageRating: avgRating._avg.customerRating || 0,
      },
    };
  }

  /**
   * Get assigned deliveries
   */
  @Get('deliveries')
  async getAssignedDeliveries(
    @Request() req,
    @Query('status') status?: DeliveryStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const partnerId = req.user.userId;
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      deliveryPartnerId: partnerId,
      ...(status && { currentStatus: status }),
    };

    const [deliveries, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              total: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
          provider: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      this.prisma.delivery.count({ where }),
    ]);

    return {
      data: deliveries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Get delivery details
   */
  @Get('deliveries/:id')
  async getDeliveryDetails(
    @Param('id') deliveryId: string,
    @Request() req
  ) {
    const partnerId = req.user.userId;
    const delivery = await this.prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        deliveryPartnerId: partnerId,
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            createdAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        provider: {
          select: {
            name: true,
            contactPhone: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new Error('Delivery not found or not assigned to you');
    }

    return delivery;
  }

  /**
   * Update delivery status
   */
  @Put('deliveries/:id/status')
  async updateDeliveryStatus(
    @Param('id') deliveryId: string,
    @Request() req,
    @Body()
    body: {
      status: DeliveryStatus;
      notes?: string;
      location?: { latitude: number; longitude: number };
    }
  ) {
    const partnerId = req.user.userId;
    // Verify delivery belongs to partner
    const delivery = await this.prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        deliveryPartnerId: partnerId,
      },
    });

    if (!delivery) {
      throw new Error('Delivery not found or not assigned to you');
    }

    const updateData: any = {
      currentStatus: body.status,
    };

    // Update timestamps based on status
    switch (body.status) {
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

    if (body.notes) {
      updateData.internalNotes = body.notes;
    }

    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
    });

    // Create order timeline entry
    await this.prisma.orderTimeline.create({
      data: {
        orderId: delivery.orderId,
        status: this.mapDeliveryStatusToOrderStatus(body.status),
        title: this.getStatusTitle(body.status),
        description: body.notes || `Delivery status updated to ${body.status}`,
        icon: this.getStatusIcon(body.status),
      },
    });

    return updated;
  }

  /**
   * Confirm delivery with proof
   */
  @Post('deliveries/:id/confirm')
  async confirmDelivery(
    @Param('id') deliveryId: string,
    @Request() req,
    @Body()
    body: {
      signature?: string;
      photos?: string[];
      notes?: string;
      gps?: { latitude: number; longitude: number };
    }
  ) {
    const partnerId = req.user.userId;
    // Verify delivery belongs to partner
    const delivery = await this.prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        deliveryPartnerId: partnerId,
      },
      include: { order: true },
    });

    if (!delivery) {
      throw new Error('Delivery not found or not assigned to you');
    }

    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        currentStatus: 'DELIVERED',
        deliveredAt: new Date(),
        confirmedBy: partnerId,
        confirmationType: 'COURIER_CONFIRMED',
        proofOfDelivery: {
          signature: body.signature,
          photos: body.photos || [],
          notes: body.notes,
          gps: body.gps,
        },
      },
    });

    // Update escrow transaction if exists
    const escrow = await this.prisma.escrowTransaction.findUnique({
      where: { orderId: delivery.orderId },
    });

    if (escrow && !escrow.deliveryConfirmed) {
      const holdPeriodDays = escrow.holdPeriodDays || 7;
      const autoReleaseAt = new Date(
        Date.now() + holdPeriodDays * 24 * 60 * 60 * 1000
      );

      await this.prisma.escrowTransaction.update({
        where: { orderId: delivery.orderId },
        data: {
          deliveryConfirmed: true,
          deliveryConfirmedAt: new Date(),
          deliveryConfirmedBy: partnerId,
          status: 'PENDING_RELEASE',
          autoReleaseAt,
        },
      });
    }

    // Create order timeline entry
    await this.prisma.orderTimeline.create({
      data: {
        orderId: delivery.orderId,
        status: 'DELIVERED',
        title: 'Delivery Confirmed',
        description: 'Delivery confirmed by delivery partner with proof',
        icon: 'check-circle',
      },
    });

    return updated;
  }

  /**
   * Report delivery issue
   */
  @Post('deliveries/:id/report-issue')
  async reportIssue(
    @Param('id') deliveryId: string,
    @Request() req,
    @Body() body: { issueDescription: string }
  ) {
    const partnerId = req.user.userId;
    const delivery = await this.prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        deliveryPartnerId: partnerId,
      },
    });

    if (!delivery) {
      throw new Error('Delivery not found or not assigned to you');
    }

    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        hasIssue: true,
        issueDescription: body.issueDescription,
        issueReportedAt: new Date(),
      },
    });
  }

  /**
   * Get earnings summary
   */
  @Get('earnings')
  async getEarnings(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const partnerId = req.user.userId;
    const where: any = {
      deliveryPartnerId: partnerId,
      currentStatus: 'DELIVERED',
    };

    if (startDate || endDate) {
      where.deliveredAt = {};
      if (startDate) where.deliveredAt.gte = new Date(startDate);
      if (endDate) where.deliveredAt.lte = new Date(endDate);
    }

    const [totalEarnings, deliveries] = await Promise.all([
      this.prisma.delivery.aggregate({
        where,
        _sum: { partnerCommission: true },
        _count: true,
      }),
      this.prisma.delivery.findMany({
        where,
        select: {
          id: true,
          trackingNumber: true,
          deliveredAt: true,
          partnerCommission: true,
          order: {
            select: {
              orderNumber: true,
            },
          },
        },
        orderBy: { deliveredAt: 'desc' },
        take: 50,
      }),
    ]);

    return {
      summary: {
        totalEarnings: totalEarnings._sum.partnerCommission || 0,
        totalDeliveries: totalEarnings._count,
      },
      recentDeliveries: deliveries,
    };
  }

  /**
   * Get available deliveries for pickup (nearby deliveries not yet assigned)
   */
  @Get('available-deliveries')
  async getAvailableDeliveries(
    @Request() req,
    @Query('limit') limit?: string
  ) {
    const partnerId = req.user.userId;
    const user = await this.prisma.user.findUnique({
      where: { id: partnerId },
      include: { deliveryProvider: true },
    });

    if (!user || !user.deliveryProviderId) {
      return { data: [] };
    }

    const deliveries = await this.prisma.delivery.findMany({
      where: {
        providerId: user.deliveryProviderId,
        deliveryPartnerId: null,
        currentStatus: 'PENDING_PICKUP',
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit ? parseInt(limit) : 20,
    });

    return { data: deliveries };
  }

  /**
   * Accept available delivery
   */
  @Post('deliveries/:id/accept')
  async acceptDelivery(
    @Param('id') deliveryId: string,
    @Request() req
  ) {
    const partnerId = req.user.userId;
    const user = await this.prisma.user.findUnique({
      where: { id: partnerId },
    });

    if (!user || !user.deliveryProviderId) {
      throw new Error('You must be associated with a delivery provider');
    }

    const delivery = await this.prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        providerId: user.deliveryProviderId,
        deliveryPartnerId: null,
      },
    });

    if (!delivery) {
      throw new Error('Delivery not available');
    }

    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        deliveryPartnerId: partnerId,
        assignedAt: new Date(),
        assignedBy: partnerId,
      },
    });
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
