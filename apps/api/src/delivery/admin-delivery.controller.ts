import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminDeliveryService } from './admin-delivery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Admin Delivery Controller
 * Handles admin-only delivery management operations
 * Only accessible by ADMIN and SUPER_ADMIN roles
 */
@Controller('admin/deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminDeliveryController {
  constructor(private readonly adminDeliveryService: AdminDeliveryService) {}

  /**
   * Assign delivery company to an order
   * @route POST /api/admin/deliveries/assign
   * @access ADMIN, SUPER_ADMIN
   */
  @Post('assign')
  @HttpCode(HttpStatus.CREATED)
  async assignDeliveryToOrder(
    @Body()
    body: {
      orderId: string;
      providerId: string;
      driverId?: string;
      expectedDeliveryDate?: string;
      notes?: string;
    },
    @Request() req
  ) {
    const adminId = req.user.userId;

    try {
      const delivery = await this.adminDeliveryService.assignDeliveryToOrder(
        body.orderId,
        body.providerId,
        adminId,
        {
          driverId: body.driverId,
          expectedDeliveryDate: body.expectedDeliveryDate
            ? new Date(body.expectedDeliveryDate)
            : undefined,
          notes: body.notes,
        }
      );

      return {
        success: true,
        data: delivery,
        message: 'Delivery assigned successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to assign delivery',
      };
    }
  }

  /**
   * Release payout for a delivery
   * Manual release after buyer confirmation
   * @route POST /api/admin/deliveries/:id/release-payout
   * @access ADMIN, SUPER_ADMIN
   */
  @Post(':id/release-payout')
  @HttpCode(HttpStatus.OK)
  async releasePayoutForDelivery(@Param('id') deliveryId: string, @Request() req) {
    const adminId = req.user.userId;

    try {
      const delivery = await this.adminDeliveryService.releasePayoutForDelivery(
        deliveryId,
        adminId
      );

      return {
        success: true,
        data: delivery,
        message: 'Payout released successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to release payout',
      };
    }
  }

  /**
   * Get all deliveries with filters
   * Admin view of all deliveries in the system
   * @route GET /api/admin/deliveries
   * @access ADMIN, SUPER_ADMIN
   */
  @Get()
  async getAllDeliveries(
    @Query('status') status?: string,
    @Query('providerId') providerId?: string,
    @Query('buyerConfirmed') buyerConfirmed?: string,
    @Query('payoutReleased') payoutReleased?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    try {
      const filters: any = {};

      if (status) filters.status = status;
      if (providerId) filters.providerId = providerId;
      if (buyerConfirmed !== undefined) {
        filters.buyerConfirmed = buyerConfirmed === 'true';
      }
      if (payoutReleased !== undefined) {
        filters.payoutReleased = payoutReleased === 'true';
      }
      if (page) filters.page = parseInt(page, 10);
      if (limit) filters.limit = parseInt(limit, 10);

      const result = await this.adminDeliveryService.getAllDeliveries(filters);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch deliveries',
      };
    }
  }

  /**
   * Get delivery statistics for admin dashboard
   * KPIs: total, pending, in transit, delivered, awaiting confirmation, awaiting payout
   * @route GET /api/admin/deliveries/statistics
   * @access ADMIN, SUPER_ADMIN
   */
  @Get('statistics')
  async getDeliveryStatistics() {
    try {
      const stats = await this.adminDeliveryService.getDeliveryStatistics();

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch statistics',
      };
    }
  }

  /**
   * Get audit logs for a specific delivery
   * Shows complete history of all actions
   * @route GET /api/admin/deliveries/:id/audit-logs
   * @access ADMIN, SUPER_ADMIN
   */
  @Get(':id/audit-logs')
  async getDeliveryAuditLogs(@Param('id') deliveryId: string) {
    try {
      // This will be handled by DeliveryAuditService
      // We need to inject it or call it through AdminDeliveryService
      return {
        success: true,
        message: 'Audit logs endpoint - to be implemented',
        data: [],
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch audit logs',
      };
    }
  }
}
