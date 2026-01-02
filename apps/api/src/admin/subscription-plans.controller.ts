import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, SubscriptionTier } from '@prisma/client';

@Controller('admin/subscription-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class SubscriptionPlansController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAll() {
    const data = await this.prisma.subscriptionPlan.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });
    return { success: true, data };
  }

  @Get(':tier')
  async getByTier(@Param('tier') tier: SubscriptionTier) {
    const data = await this.prisma.subscriptionPlan.findUnique({
      where: { tier },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });
    return { success: true, data };
  }

  @Patch(':tier')
  async update(@Param('tier') tier: SubscriptionTier, @Body() updateData: any) {
    const data = await this.prisma.subscriptionPlan.update({
      where: { tier },
      data: updateData,
    });
    return { success: true, data, message: 'Plan updated successfully' };
  }

  @Post(':tier/toggle-active')
  @HttpCode(HttpStatus.OK)
  async toggleActive(@Param('tier') tier: SubscriptionTier) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { tier },
    });

    if (!plan) {
      return { success: false, message: 'Plan not found' };
    }

    const data = await this.prisma.subscriptionPlan.update({
      where: { tier },
      data: { isActive: !plan.isActive },
    });

    return {
      success: true,
      data,
      message: `Plan ${data.isActive ? 'activated' : 'deactivated'}`,
    };
  }
}
