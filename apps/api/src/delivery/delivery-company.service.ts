import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DeliveryStatus } from '@prisma/client';

@Injectable()
export class DeliveryCompanyService {
  private readonly logger = new Logger(DeliveryCompanyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all deliveries for a specific delivery company
   * Only accessible by DELIVERY_PROVIDER_ADMIN users linked to that company
   */
  async getCompanyDeliveries(
    userId: string,
    filters?: {
      status?: DeliveryStatus;
      dateFrom?: Date;
      dateTo?: Date;
      country?: string;
      page?: number;
      limit?: number;
    }
  ) {
    // Get user's delivery provider
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { deliveryProvider: true },
    });

    if (!user || !user.deliveryProviderId) {
      throw new ForbiddenException('User is not associated with a delivery provider');
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      providerId: user.deliveryProviderId,
      ...(filters?.status && { currentStatus: filters.status }),
    };

    // Date range filter
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters?.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters?.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    // Country filter on delivery address
    if (filters?.country) {
      where.deliveryAddress = {
        path: ['country'],
        equals: filters.country,
      };
    }

    const [deliveries, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              status: true,
              createdAt: true,
            },
          },
          deliveryPartner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
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
      provider: {
        id: user.deliveryProvider.id,
        name: user.deliveryProvider.name,
      },
    };
  }

  /**
   * Get delivery company statistics/KPIs
   */
  async getCompanyStatistics(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { deliveryProvider: true },
    });

    if (!user || !user.deliveryProviderId) {
      throw new ForbiddenException('User is not associated with a delivery provider');
    }

    const providerId = user.deliveryProviderId;

    // Get counts by status
    const [
      totalAssigned,
      pendingPickup,
      inTransit,
      delivered,
      averageRating,
      totalEarnings,
    ] = await Promise.all([
      this.prisma.delivery.count({ where: { providerId } }),
      this.prisma.delivery.count({
        where: { providerId, currentStatus: 'PENDING_PICKUP' },
      }),
      this.prisma.delivery.count({
        where: {
          providerId,
          currentStatus: {
            in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'],
          },
        },
      }),
      this.prisma.delivery.count({
        where: { providerId, currentStatus: 'DELIVERED' },
      }),
      this.prisma.delivery.aggregate({
        where: { providerId, customerRating: { not: null } },
        _avg: { customerRating: true },
      }),
      this.prisma.delivery.aggregate({
        where: { providerId },
        _sum: { partnerCommission: true },
      }),
    ]);

    // Get delivery times (average days to deliver)
    const deliveredOrders = await this.prisma.delivery.findMany({
      where: {
        providerId,
        currentStatus: 'DELIVERED',
        deliveredAt: { not: null },
      },
      select: {
        createdAt: true,
        deliveredAt: true,
      },
      take: 100, // Sample of recent deliveries
    });

    let averageDeliveryTime = 0;
    if (deliveredOrders.length > 0) {
      const totalDays = deliveredOrders.reduce((sum, delivery) => {
        if (delivery.deliveredAt) {
          const days =
            (delivery.deliveredAt.getTime() - delivery.createdAt.getTime()) /
            (1000 * 60 * 60 * 24);
          return sum + days;
        }
        return sum;
      }, 0);
      averageDeliveryTime = totalDays / deliveredOrders.length;
    }

    return {
      provider: {
        id: user.deliveryProvider.id,
        name: user.deliveryProvider.name,
        logo: user.deliveryProvider.logo,
      },
      kpis: {
        totalAssigned,
        pendingPickup,
        inTransit,
        delivered,
        averageRating: averageRating._avg.customerRating || 0,
        totalEarnings: Number(totalEarnings._sum.partnerCommission || 0),
        averageDeliveryTime: Math.round(averageDeliveryTime * 10) / 10,
        deliveryRate: totalAssigned > 0 ? (delivered / totalAssigned) * 100 : 0,
      },
    };
  }

  /**
   * Assign delivery to a driver within the company
   */
  async assignDeliveryToDriver(
    userId: string,
    deliveryId: string,
    driverId: string
  ) {
    // Verify user is a company admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { deliveryProvider: true },
    });

    if (!user || !user.deliveryProviderId) {
      throw new ForbiddenException('User is not associated with a delivery provider');
    }

    // Verify delivery belongs to this company
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.providerId !== user.deliveryProviderId) {
      throw new ForbiddenException('Delivery does not belong to your company');
    }

    // Verify driver belongs to this company
    const driver = await this.prisma.user.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (driver.deliveryProviderId !== user.deliveryProviderId) {
      throw new BadRequestException('Driver does not belong to your company');
    }

    if (driver.role !== 'DELIVERY_PARTNER') {
      throw new BadRequestException('User is not a delivery driver');
    }

    // Assign the delivery
    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        deliveryPartnerId: driverId,
        assignedBy: userId,
        assignedAt: new Date(),
      },
      include: {
        order: {
          select: {
            orderNumber: true,
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
    });

    this.logger.log(
      `Delivery ${delivery.trackingNumber} assigned to driver ${driver.email} by company admin ${user.email}`
    );

    return updated;
  }

  /**
   * Get all drivers belonging to this delivery company
   */
  async getCompanyDrivers(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { deliveryProvider: true },
    });

    if (!user || !user.deliveryProviderId) {
      throw new ForbiddenException('User is not associated with a delivery provider');
    }

    const drivers = await this.prisma.user.findMany({
      where: {
        deliveryProviderId: user.deliveryProviderId,
        role: 'DELIVERY_PARTNER',
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        createdAt: true,
        deliveryAssignments: {
          select: {
            id: true,
            currentStatus: true,
            trackingNumber: true,
          },
          where: {
            currentStatus: {
              notIn: ['DELIVERED', 'CANCELLED', 'RETURNED'],
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats for each driver
    const driversWithStats = await Promise.all(
      drivers.map(async (driver) => {
        const stats = await this.prisma.delivery.aggregate({
          where: {
            deliveryPartnerId: driver.id,
          },
          _count: { id: true },
          _avg: { customerRating: true },
        });

        const delivered = await this.prisma.delivery.count({
          where: {
            deliveryPartnerId: driver.id,
            currentStatus: 'DELIVERED',
          },
        });

        return {
          ...driver,
          stats: {
            totalAssigned: stats._count.id,
            activeDeliveries: driver.deliveryAssignments.length,
            deliveredCount: delivered,
            averageRating: stats._avg.customerRating || 0,
          },
        };
      })
    );

    return {
      data: driversWithStats,
      provider: {
        id: user.deliveryProvider.id,
        name: user.deliveryProvider.name,
      },
    };
  }

  /**
   * Get single delivery details (company view)
   */
  async getDeliveryDetails(userId: string, deliveryId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.deliveryProviderId) {
      throw new ForbiddenException('User is not associated with a delivery provider');
    }

    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    heroImage: true,
                  },
                },
              },
            },
            shippingAddress: true,
          },
        },
        deliveryPartner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.providerId !== user.deliveryProviderId) {
      throw new ForbiddenException('Delivery does not belong to your company');
    }

    return delivery;
  }
}
