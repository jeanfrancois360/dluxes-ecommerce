import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DeliveryProviderType, ProviderVerificationStatus, Prisma } from '@prisma/client';

@Injectable()
export class DeliveryProviderService {
  private readonly logger = new Logger(DeliveryProviderService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new delivery provider
   */
  async createProvider(data: {
    name: string;
    slug: string;
    type: DeliveryProviderType;
    description?: string;
    contactEmail: string;
    contactPhone?: string;
    website?: string;
    apiEnabled?: boolean;
    apiKey?: string;
    apiSecret?: string;
    apiEndpoint?: string;
    webhookUrl?: string;
    countries: string[];
    commissionType?: 'PERCENTAGE' | 'FIXED';
    commissionRate?: number;
    logo?: string;
    coverImage?: string;
  }) {
    // Check if slug already exists
    const existing = await this.prisma.deliveryProvider.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictException(`Provider with slug "${data.slug}" already exists`);
    }

    const provider = await this.prisma.deliveryProvider.create({
      data: {
        name: data.name,
        slug: data.slug,
        type: data.type,
        description: data.description,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        website: data.website,
        apiEnabled: data.apiEnabled || false,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        apiEndpoint: data.apiEndpoint,
        webhookUrl: data.webhookUrl,
        countries: data.countries,
        commissionType: data.commissionType as any || 'PERCENTAGE',
        commissionRate: data.commissionRate || 5.0,
        logo: data.logo,
        coverImage: data.coverImage,
        verificationStatus: 'PENDING',
      },
    });

    this.logger.log(`Created delivery provider: ${provider.name} (${provider.id})`);

    return provider;
  }

  /**
   * Get all delivery providers with filtering
   */
  async getAllProviders(filters?: {
    type?: DeliveryProviderType;
    isActive?: boolean;
    verificationStatus?: ProviderVerificationStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.DeliveryProviderWhereInput = {
      ...(filters?.type && { type: filters.type }),
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters?.verificationStatus && { verificationStatus: filters.verificationStatus }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { contactEmail: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [providers, total] = await Promise.all([
      this.prisma.deliveryProvider.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              deliveries: true,
              payouts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.deliveryProvider.count({ where }),
    ]);

    return {
      data: providers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get provider by ID
   */
  async getProviderById(id: string) {
    const provider = await this.prisma.deliveryProvider.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            deliveries: true,
            payouts: true,
          },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Delivery provider not found');
    }

    return provider;
  }

  /**
   * Update delivery provider
   */
  async updateProvider(id: string, data: Partial<{
    name: string;
    type: DeliveryProviderType;
    description: string;
    contactEmail: string;
    contactPhone: string;
    website: string;
    apiEnabled: boolean;
    apiKey: string;
    apiSecret: string;
    apiEndpoint: string;
    webhookUrl: string;
    countries: string[];
    commissionType: 'PERCENTAGE' | 'FIXED';
    commissionRate: number;
    isActive: boolean;
    logo: string;
    coverImage: string;
  }>) {
    const provider = await this.prisma.deliveryProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('Delivery provider not found');
    }

    const updated = await this.prisma.deliveryProvider.update({
      where: { id },
      data: {
        ...data,
        commissionType: data.commissionType as any,
      },
    });

    this.logger.log(`Updated delivery provider: ${updated.name} (${updated.id})`);

    return updated;
  }

  /**
   * Delete delivery provider
   */
  async deleteProvider(id: string) {
    const provider = await this.prisma.deliveryProvider.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            deliveries: true,
            payouts: true,
          },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Delivery provider not found');
    }

    if (provider._count.deliveries > 0) {
      throw new BadRequestException(
        `Cannot delete provider with ${provider._count.deliveries} deliveries. Deactivate instead.`
      );
    }

    await this.prisma.deliveryProvider.delete({
      where: { id },
    });

    this.logger.log(`Deleted delivery provider: ${provider.name} (${provider.id})`);

    return { message: 'Provider deleted successfully' };
  }

  /**
   * Verify delivery provider
   */
  async verifyProvider(id: string, verifiedBy: string) {
    const provider = await this.prisma.deliveryProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('Delivery provider not found');
    }

    const updated = await this.prisma.deliveryProvider.update({
      where: { id },
      data: {
        verificationStatus: 'VERIFIED',
        isActive: true,
      },
    });

    this.logger.log(`Verified delivery provider: ${updated.name} by ${verifiedBy}`);

    return updated;
  }

  /**
   * Suspend/Reject delivery provider
   */
  async updateVerificationStatus(
    id: string,
    status: ProviderVerificationStatus,
    adminId: string
  ) {
    const provider = await this.prisma.deliveryProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('Delivery provider not found');
    }

    const updated = await this.prisma.deliveryProvider.update({
      where: { id },
      data: {
        verificationStatus: status,
        isActive: status === 'VERIFIED',
      },
    });

    this.logger.log(
      `Updated provider ${updated.name} verification status to ${status} by admin ${adminId}`
    );

    return updated;
  }

  /**
   * Toggle provider active status
   */
  async toggleActiveStatus(id: string) {
    const provider = await this.prisma.deliveryProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('Delivery provider not found');
    }

    const updated = await this.prisma.deliveryProvider.update({
      where: { id },
      data: {
        isActive: !provider.isActive,
      },
    });

    this.logger.log(
      `Toggled provider ${updated.name} active status to ${updated.isActive}`
    );

    return updated;
  }

  /**
   * Get provider statistics
   */
  async getProviderStatistics(id: string) {
    const provider = await this.prisma.deliveryProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('Delivery provider not found');
    }

    const [
      totalDeliveries,
      activeDeliveries,
      completedDeliveries,
      totalEarnings,
      pendingPayouts,
    ] = await Promise.all([
      this.prisma.delivery.count({
        where: { providerId: id },
      }),
      this.prisma.delivery.count({
        where: {
          providerId: id,
          currentStatus: { in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
        },
      }),
      this.prisma.delivery.count({
        where: { providerId: id, currentStatus: 'DELIVERED' },
      }),
      this.prisma.delivery.aggregate({
        where: { providerId: id, currentStatus: 'DELIVERED' },
        _sum: { partnerCommission: true },
      }),
      this.prisma.deliveryProviderPayout.aggregate({
        where: { providerId: id, status: 'PENDING' },
        _sum: { amount: true },
      }),
    ]);

    return {
      providerId: id,
      providerName: provider.name,
      totalDeliveries,
      activeDeliveries,
      completedDeliveries,
      totalEarnings: totalEarnings._sum.partnerCommission || 0,
      pendingPayouts: pendingPayouts._sum.amount || 0,
      commissionRate: provider.commissionRate,
      isActive: provider.isActive,
      verificationStatus: provider.verificationStatus,
    };
  }

  /**
   * Assign delivery partner (user) to provider
   */
  async assignDeliveryPartner(providerId: string, userId: string) {
    const provider = await this.prisma.deliveryProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Delivery provider not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'DELIVERY_PARTNER') {
      throw new BadRequestException('User must have DELIVERY_PARTNER role');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        deliveryProviderId: providerId,
      },
    });

    this.logger.log(
      `Assigned delivery partner ${user.email} to provider ${provider.name}`
    );

    return updated;
  }

  /**
   * Remove delivery partner from provider
   */
  async removeDeliveryPartner(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        deliveryProviderId: null,
      },
    });

    this.logger.log(`Removed delivery partner ${user.email} from provider`);

    return updated;
  }
}
