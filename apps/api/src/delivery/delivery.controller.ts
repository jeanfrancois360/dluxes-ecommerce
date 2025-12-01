import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DeliveryStatus, DeliveryConfirmationType } from '@prisma/client';

@Controller('deliveries')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  /**
   * Create delivery for an order (Admin/Seller)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'SELLER')
  async createDelivery(
    @Body()
    body: {
      orderId: string;
      providerId?: string;
      deliveryPartnerId?: string;
      pickupAddress: any;
      deliveryAddress: any;
      trackingNumber?: string;
      expectedDeliveryDate?: string;
      deliveryFee: number;
      partnerCommission: number;
      platformFee: number;
    }
  ) {
    return this.deliveryService.createDelivery({
      ...body,
      expectedDeliveryDate: body.expectedDeliveryDate
        ? new Date(body.expectedDeliveryDate)
        : undefined,
    });
  }

  /**
   * Assign delivery to provider/partner (Admin only)
   */
  @Put(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async assignDelivery(
    @Param('id') deliveryId: string,
    @Body()
    body: {
      providerId?: string;
      deliveryPartnerId?: string;
    },
    @Request() req
  ) {
    const assignedBy = req.user.userId;
    return this.deliveryService.assignDelivery(deliveryId, {
      ...body,
      assignedBy,
    });
  }

  /**
   * Update delivery status (Admin/Delivery Partner)
   */
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'DELIVERY_PARTNER')
  async updateStatus(
    @Param('id') deliveryId: string,
    @Body()
    body: {
      status: DeliveryStatus;
      notes?: string;
    },
    @Request() req
  ) {
    const updatedBy = req.user.userId;
    return this.deliveryService.updateStatus(
      deliveryId,
      body.status,
      updatedBy,
      body.notes
    );
  }

  /**
   * Confirm delivery with proof (Admin/Delivery Partner/Customer)
   */
  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'DELIVERY_PARTNER', 'BUYER', 'CUSTOMER')
  async confirmDelivery(
    @Param('id') deliveryId: string,
    @Body()
    body: {
      confirmationType: DeliveryConfirmationType;
      proofOfDelivery?: {
        signature?: string;
        photos?: string[];
        notes?: string;
        gps?: { latitude: number; longitude: number };
      };
      customerRating?: number;
      customerFeedback?: string;
    },
    @Request() req
  ) {
    const confirmedBy = req.user.userId;
    return this.deliveryService.confirmDelivery(deliveryId, {
      ...body,
      confirmedBy,
    });
  }

  /**
   * Report delivery issue
   */
  @Post(':id/report-issue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'DELIVERY_PARTNER', 'BUYER', 'CUSTOMER', 'SELLER')
  async reportIssue(
    @Param('id') deliveryId: string,
    @Body() body: { issueDescription: string },
    @Request() req
  ) {
    const reportedBy = req.user.userId;
    return this.deliveryService.reportIssue(deliveryId, {
      issueDescription: body.issueDescription,
      reportedBy,
    });
  }

  /**
   * Get all deliveries (Admin only)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllDeliveries(
    @Query('status') status?: DeliveryStatus,
    @Query('providerId') providerId?: string,
    @Query('deliveryPartnerId') deliveryPartnerId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.deliveryService.getAllDeliveries({
      status,
      providerId,
      deliveryPartnerId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * Get delivery by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'DELIVERY_PARTNER', 'SELLER')
  async getDeliveryById(@Param('id') id: string) {
    return this.deliveryService.trackByTrackingNumber(id);
  }

  /**
   * Track delivery by tracking number (Public - no auth required)
   */
  @Get('track/:trackingNumber')
  async trackDelivery(@Param('trackingNumber') trackingNumber: string) {
    return this.deliveryService.trackByTrackingNumber(trackingNumber);
  }
}
