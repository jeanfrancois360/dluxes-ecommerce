import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateAdvertisementDto,
  UpdateAdvertisementDto,
  ApproveAdvertisementDto,
} from './dto/advertisement.dto';
import { AdStatus, AdEventType } from '@prisma/client';

@Injectable()
export class AdvertisementService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { status?: AdStatus; placement?: string; advertiserId?: string }) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.placement) where.placement = filters.placement;
    if (filters?.advertiserId) where.advertiserId = filters.advertiserId;

    return this.prisma.advertisement.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { analyticsEvents: true },
        },
      },
      orderBy: [{ position: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findActive(placement?: string) {
    const now = new Date();
    const where: any = {
      status: AdStatus.ACTIVE,
      startDate: { lte: now },
      endDate: { gte: now },
    };

    if (placement) where.placement = placement;

    return this.prisma.advertisement.findMany({
      where,
      orderBy: [{ position: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const ad = await this.prisma.advertisement.findUnique({
      where: { id },
      include: {
        category: true,
        analyticsEvents: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!ad) {
      throw new NotFoundException('Advertisement not found');
    }

    return ad;
  }

  async create(dto: CreateAdvertisementDto, advertiserId: string) {
    // HOMEPAGE_HERO is reserved for NextPik internal use only
    if (dto.placement === 'HOMEPAGE_HERO') {
      throw new BadRequestException(
        'HOMEPAGE_HERO placement is reserved for NextPik internal use only.'
      );
    }

    // Validate category if provided
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    return this.prisma.advertisement.create({
      data: {
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        videoUrl: dto.videoUrl,
        linkUrl: dto.linkUrl || '',
        linkText: dto.linkText,
        placement: dto.placement,
        pricingModel: dto.pricingModel,
        pricePerUnit: dto.price,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate
          ? new Date(dto.endDate)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        categoryId: dto.categoryId,
        position: dto.priority ?? 0,
        targetAudience: dto.targetAudience
          ? (() => {
              try {
                return JSON.parse(dto.targetAudience!);
              } catch {
                return undefined;
              }
            })()
          : undefined,
        advertiserId,
        status: AdStatus.PENDING_APPROVAL,
      },
      include: {
        category: true,
      },
    });
  }

  async update(id: string, dto: UpdateAdvertisementDto, userId: string, isAdmin = false) {
    const ad = await this.prisma.advertisement.findUnique({
      where: { id },
    });

    if (!ad) {
      throw new NotFoundException('Advertisement not found');
    }

    // Check ownership (unless admin)
    if (!isAdmin && ad.advertiserId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this advertisement');
    }

    const updateData: any = { ...dto };
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);
    if (dto.price) {
      updateData.pricePerUnit = dto.price;
      delete updateData.price;
    }
    if (dto.priority !== undefined) {
      updateData.position = dto.priority;
      delete updateData.priority;
    }

    return this.prisma.advertisement.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });
  }

  async approve(id: string, dto: ApproveAdvertisementDto) {
    const ad = await this.prisma.advertisement.findUnique({
      where: { id },
    });

    if (!ad) {
      throw new NotFoundException('Advertisement not found');
    }

    const status = dto.approved ? AdStatus.ACTIVE : AdStatus.REJECTED;

    return this.prisma.advertisement.update({
      where: { id },
      data: {
        status,
        rejectionReason: dto.approved ? null : dto.rejectionReason,
        approvedAt: dto.approved ? new Date() : null,
      },
    });
  }

  async delete(id: string, userId?: string, isAdmin = false) {
    const ad = await this.prisma.advertisement.findUnique({
      where: { id },
    });

    if (!ad) {
      throw new NotFoundException('Advertisement not found');
    }

    if (!isAdmin && userId && ad.advertiserId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this advertisement');
    }

    await this.prisma.advertisement.delete({
      where: { id },
    });

    return { message: 'Advertisement deleted successfully' };
  }

  async recordEvent(id: string, eventType: AdEventType, userId?: string, page?: string) {
    const ad = await this.prisma.advertisement.findUnique({
      where: { id },
    });

    if (!ad) {
      throw new NotFoundException('Advertisement not found');
    }

    // Update counters on the ad
    const updateData: any = {};
    if (eventType === AdEventType.IMPRESSION) {
      updateData.impressions = { increment: 1 };
    } else if (eventType === AdEventType.CLICK) {
      updateData.clicks = { increment: 1 };
    } else if (eventType === AdEventType.CONVERSION) {
      updateData.conversions = { increment: 1 };
    }

    await this.prisma.advertisement.update({
      where: { id },
      data: updateData,
    });

    // Record analytics event
    return this.prisma.adAnalytics.create({
      data: {
        advertisement: {
          connect: { id },
        },
        eventType,
        userId,
        page: page || 'unknown',
      },
    });
  }

  async getAnalytics(id: string, startDate?: Date, endDate?: Date) {
    const ad = await this.prisma.advertisement.findUnique({
      where: { id },
    });

    if (!ad) {
      throw new NotFoundException('Advertisement not found');
    }

    const where: any = { advertisementId: id };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const events = await this.prisma.adAnalytics.groupBy({
      by: ['eventType'],
      where,
      _count: true,
    });

    return {
      advertisement: ad,
      metrics: {
        impressions: ad.impressions,
        clicks: ad.clicks,
        conversions: ad.conversions,
        ctr: ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0,
        conversionRate: ad.clicks > 0 ? ((ad.conversions / ad.clicks) * 100).toFixed(2) : 0,
      },
      events,
    };
  }

  async getPendingAds() {
    return this.prisma.advertisement.findMany({
      where: { status: AdStatus.PENDING_APPROVAL },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async toggleActive(id: string, active: boolean) {
    const ad = await this.prisma.advertisement.findUnique({
      where: { id },
    });

    if (!ad) {
      throw new NotFoundException('Advertisement not found');
    }

    return this.prisma.advertisement.update({
      where: { id },
      data: { status: active ? AdStatus.ACTIVE : AdStatus.PAUSED },
    });
  }
}
