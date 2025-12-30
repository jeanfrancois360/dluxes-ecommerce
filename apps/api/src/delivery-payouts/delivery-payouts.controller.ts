import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DeliveryPayoutsService } from './delivery-payouts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PayoutStatus } from '@prisma/client';

@Controller('delivery-payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliveryPayoutsController {
  constructor(private readonly deliveryPayoutsService: DeliveryPayoutsService) {}

  /**
   * Get all delivery provider payouts
   */
  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findAll(
    @Query('status') status?: PayoutStatus,
    @Query('providerId') providerId?: string
  ) {
    return this.deliveryPayoutsService.findAll({ status, providerId });
  }

  /**
   * Get payout statistics
   */
  @Get('stats')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getStats() {
    return this.deliveryPayoutsService.getStats();
  }

  /**
   * Get a single payout
   */
  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findOne(@Param('id') id: string) {
    return this.deliveryPayoutsService.findOne(id);
  }

  /**
   * Process a pending payout (mark as processing)
   */
  @Post(':id/process')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async processPayout(
    @Param('id') id: string,
    @Body()
    body: {
      paymentMethod: string;
      paymentReference?: string;
      notes?: string;
    },
    @Request() req
  ) {
    return this.deliveryPayoutsService.processPayout(id, body, req.user.id);
  }

  /**
   * Complete a payout
   */
  @Post(':id/complete')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async completePayout(@Param('id') id: string) {
    return this.deliveryPayoutsService.completePayout(id);
  }

  /**
   * Cancel a payout
   */
  @Post(':id/cancel')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async cancelPayout(
    @Param('id') id: string,
    @Body() body?: { reason?: string }
  ) {
    return this.deliveryPayoutsService.cancelPayout(id, body?.reason);
  }

  /**
   * Create a new payout (for testing or manual creation)
   */
  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createPayout(
    @Body()
    body: {
      providerId: string;
      amount: number;
      periodStart: string;
      periodEnd: string;
      deliveryCount: number;
      currency?: string;
    }
  ) {
    return this.deliveryPayoutsService.createPayout({
      ...body,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
    });
  }
}
