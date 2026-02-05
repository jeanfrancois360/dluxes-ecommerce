import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateHotDealDto, HotDealStatus, UrgencyLevel, ContactMethod } from './dto/create-hot-deal.dto';
import { RespondToDealDto } from './dto/respond-to-deal.dto';
import { HotDealQueryDto } from './dto/hot-deal-query.dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class HotDealsService {
  private readonly logger = new Logger(HotDealsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Type assertion helper for HotDeal model (until migration is run)
  private get hotDeal() {
    return (this.prisma as any).hotDeal;
  }

  // Type assertion helper for HotDealResponse model (until migration is run)
  private get hotDealResponse() {
    return (this.prisma as any).hotDealResponse;
  }

  /**
   * Create a new hot deal (status: PENDING until payment is confirmed)
   */
  async create(userId: string, dto: CreateHotDealDto) {
    // Calculate expiry time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const hotDeal = await this.hotDeal.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        urgency: dto.urgency || UrgencyLevel.NORMAL,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        preferredContact: dto.preferredContact || ContactMethod.PHONE,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        status: HotDealStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        expiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(`Hot deal created: ${hotDeal.id} by user ${userId}`);
    return hotDeal;
  }

  /**
   * Get all active hot deals with optional filters
   */
  async findAll(query: HotDealQueryDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      status: HotDealStatus.ACTIVE,
      expiresAt: {
        gt: new Date(),
      },
    };

    if (query.category) {
      where.category = query.category;
    }

    if (query.city) {
      where.city = {
        contains: query.city,
        mode: 'insensitive',
      };
    }

    const [deals, total] = await Promise.all([
      this.hotDeal.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              responses: true,
            },
          },
        },
        orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.hotDeal.count({ where }),
    ]);

    return {
      deals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single hot deal by ID
   */
  async findOne(id: string, requestingUserId?: string) {
    const deal = await this.hotDeal.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        responses: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });

    if (!deal) {
      throw new NotFoundException('Hot deal not found');
    }

    // Filter responses: only show to owner or if user responded
    if (requestingUserId && requestingUserId !== deal.userId) {
      deal.responses = deal.responses.filter(
        (r) => r.userId === requestingUserId,
      );
    }

    return deal;
  }

  /**
   * Get hot deals posted by a specific user
   */
  async getMyDeals(userId: string) {
    const deals = await this.hotDeal.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            responses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return deals;
  }

  /**
   * Respond to a hot deal
   */
  async respondToDeal(
    hotDealId: string,
    userId: string,
    dto: RespondToDealDto,
  ) {
    const deal = await this.hotDeal.findUnique({
      where: { id: hotDealId },
    });

    if (!deal) {
      throw new NotFoundException('Hot deal not found');
    }

    if (deal.status !== HotDealStatus.ACTIVE) {
      throw new BadRequestException('This hot deal is no longer accepting responses');
    }

    if (deal.userId === userId) {
      throw new BadRequestException('You cannot respond to your own hot deal');
    }

    if (deal.expiresAt < new Date()) {
      throw new BadRequestException('This hot deal has expired');
    }

    // Check if user has already responded
    const existingResponse = await this.hotDealResponse.findFirst({
      where: {
        hotDealId,
        userId,
      },
    });

    if (existingResponse) {
      throw new BadRequestException('You have already responded to this hot deal');
    }

    const response = await this.hotDealResponse.create({
      data: {
        hotDealId,
        userId,
        message: dto.message,
        contactInfo: dto.contactInfo,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(
      `Response created for hot deal ${hotDealId} by user ${userId}`,
    );
    return response;
  }

  /**
   * Confirm payment and activate the hot deal
   */
  async confirmPayment(hotDealId: string, userId: string, paymentIntentId: string) {
    const deal = await this.hotDeal.findUnique({
      where: { id: hotDealId },
    });

    if (!deal) {
      throw new NotFoundException('Hot deal not found');
    }

    if (deal.userId !== userId) {
      throw new ForbiddenException('You are not authorized to confirm this payment');
    }

    if (deal.status !== HotDealStatus.PENDING) {
      throw new BadRequestException('This hot deal has already been processed');
    }

    // Update deal to ACTIVE
    const updatedDeal = await this.hotDeal.update({
      where: { id: hotDealId },
      data: {
        status: HotDealStatus.ACTIVE,
        paymentStatus: PaymentStatus.PAID,
        paymentIntentId,
        publishedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(`Hot deal ${hotDealId} activated after payment confirmation`);
    return updatedDeal;
  }

  /**
   * Mark a hot deal as fulfilled
   */
  async markAsFulfilled(hotDealId: string, userId: string) {
    const deal = await this.hotDeal.findUnique({
      where: { id: hotDealId },
    });

    if (!deal) {
      throw new NotFoundException('Hot deal not found');
    }

    if (deal.userId !== userId) {
      throw new ForbiddenException('You are not authorized to update this hot deal');
    }

    if (deal.status !== HotDealStatus.ACTIVE) {
      throw new BadRequestException('Only active hot deals can be marked as fulfilled');
    }

    const updatedDeal = await this.hotDeal.update({
      where: { id: hotDealId },
      data: {
        status: HotDealStatus.FULFILLED,
      },
    });

    this.logger.log(`Hot deal ${hotDealId} marked as fulfilled`);
    return updatedDeal;
  }

  /**
   * Cancel a pending hot deal (before payment)
   */
  async cancel(hotDealId: string, userId: string) {
    const deal = await this.hotDeal.findUnique({
      where: { id: hotDealId },
    });

    if (!deal) {
      throw new NotFoundException('Hot deal not found');
    }

    if (deal.userId !== userId) {
      throw new ForbiddenException('You are not authorized to cancel this hot deal');
    }

    if (deal.status !== HotDealStatus.PENDING && deal.status !== HotDealStatus.ACTIVE) {
      throw new BadRequestException('This hot deal cannot be cancelled');
    }

    const updatedDeal = await this.hotDeal.update({
      where: { id: hotDealId },
      data: {
        status: HotDealStatus.CANCELLED,
      },
    });

    this.logger.log(`Hot deal ${hotDealId} cancelled`);
    return updatedDeal;
  }

  /**
   * Expire old deals (called by cron job)
   */
  async expireOldDeals() {
    const result = await this.hotDeal.updateMany({
      where: {
        status: HotDealStatus.ACTIVE,
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: HotDealStatus.EXPIRED,
      },
    });

    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} hot deals`);
    }

    return result;
  }

  /**
   * Get category statistics for filters
   */
  async getCategoryStats() {
    const stats = await this.hotDeal.groupBy({
      by: ['category'],
      where: {
        status: HotDealStatus.ACTIVE,
        expiresAt: {
          gt: new Date(),
        },
      },
      _count: {
        category: true,
      },
    });

    return stats.map((s) => ({
      category: s.category,
      count: s._count.category,
    }));
  }
}
