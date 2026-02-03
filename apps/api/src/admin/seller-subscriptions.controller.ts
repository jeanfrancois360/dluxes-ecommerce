import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, SubscriptionStatus } from '@prisma/client';

@Controller('admin/seller-subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class SellerSubscriptionsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all seller subscriptions with filtering and pagination
   */
  @Get()
  async getAll(
    @Query('status') status?: SubscriptionStatus,
    @Query('planTier') planTier?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = parseInt(page || '1');
    const limitNum = parseInt(limit || '20');
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (planTier) {
      where.plan = { tier: planTier };
    }

    if (search) {
      where.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.sellerSubscription.findMany({
        where,
        include: {
          plan: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip,
      }),
      this.prisma.sellerSubscription.count({ where }),
    ]);

    return {
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Get subscription statistics
   */
  @Get('statistics')
  async getStatistics() {
    const [
      totalSubscriptions,
      activeSubscriptions,
      canceledSubscriptions,
      expiredSubscriptions,
      revenueData,
    ] = await Promise.all([
      this.prisma.sellerSubscription.count(),
      this.prisma.sellerSubscription.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.sellerSubscription.count({
        where: { status: 'CANCELLED' },
      }),
      this.prisma.sellerSubscription.count({
        where: { status: 'EXPIRED' },
      }),
      this.prisma.sellerSubscription.findMany({
        where: {
          status: 'ACTIVE',
        },
        include: { plan: true },
      }),
    ]);

    // Calculate monthly revenue
    const monthlyRevenue = revenueData.reduce((sum, sub) => {
      const price = sub.billingCycle === 'MONTHLY'
        ? Number(sub.plan.monthlyPrice)
        : Number(sub.plan.yearlyPrice) / 12;
      return sum + price;
    }, 0);

    return {
      success: true,
      data: {
        totalSubscriptions,
        activeSubscriptions,
        canceledSubscriptions,
        expiredSubscriptions,
        monthlyRevenue,
        yearlyRevenue: monthlyRevenue * 12,
      },
    };
  }

  /**
   * Get single subscription details
   */
  @Get(':id')
  async getById(@Param('id') id: string) {
    const data = await this.prisma.sellerSubscription.findUnique({
      where: { id },
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!data) {
      return { success: false, message: 'Subscription not found' };
    }

    return { success: true, data };
  }

  /**
   * Cancel a subscription
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(
    @Param('id') id: string,
    @Body() body?: { reason?: string }
  ) {
    const subscription = await this.prisma.sellerSubscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return { success: false, message: 'Subscription not found' };
    }

    const data = await this.prisma.sellerSubscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelAtPeriodEnd: true,
      },
    });

    return {
      success: true,
      data,
      message: 'Subscription cancelled successfully',
    };
  }

  /**
   * Reactivate a cancelled subscription
   */
  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  async reactivateSubscription(@Param('id') id: string) {
    const subscription = await this.prisma.sellerSubscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return { success: false, message: 'Subscription not found' };
    }

    const data = await this.prisma.sellerSubscription.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
      },
    });

    return {
      success: true,
      data,
      message: 'Subscription reactivated successfully',
    };
  }

  /**
   * Update subscription (change plan, etc.)
   */
  @Patch(':id')
  async updateSubscription(
    @Param('id') id: string,
    @Body() updateData: {
      planId?: string;
      billingCycle?: 'MONTHLY' | 'YEARLY';
      status?: SubscriptionStatus;
    },
  ) {
    const data = await this.prisma.sellerSubscription.update({
      where: { id },
      data: updateData,
      include: {
        plan: true,
        user: true,
      },
    });

    return {
      success: true,
      data,
      message: 'Subscription updated successfully',
    };
  }
}
