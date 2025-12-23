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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DeliveryCompanyService } from './delivery-company.service';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DeliveryStatus, DeliveryConfirmationType } from '@prisma/client';

/**
 * Delivery Company Controller
 * Endpoints for delivery company admins to manage their assigned deliveries
 */
@Controller('delivery-company')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DELIVERY_PROVIDER_ADMIN')
export class DeliveryCompanyController {
  constructor(
    private readonly deliveryCompanyService: DeliveryCompanyService,
    private readonly deliveryService: DeliveryService
  ) {}

  /**
   * Get company dashboard statistics
   * @route GET /delivery-company/statistics
   */
  @Get('statistics')
  async getStatistics(@Request() req) {
    return this.deliveryCompanyService.getCompanyStatistics(req.user.userId);
  }

  /**
   * Get all deliveries assigned to this company
   * @route GET /delivery-company/deliveries
   */
  @Get('deliveries')
  async getCompanyDeliveries(
    @Request() req,
    @Query('status') status?: DeliveryStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('country') country?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.deliveryCompanyService.getCompanyDeliveries(req.user.userId, {
      status,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      country,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * Get single delivery details
   * @route GET /delivery-company/deliveries/:id
   */
  @Get('deliveries/:id')
  async getDeliveryDetails(@Request() req, @Param('id') id: string) {
    return this.deliveryCompanyService.getDeliveryDetails(req.user.userId, id);
  }

  /**
   * Assign delivery to a driver
   * @route POST /delivery-company/deliveries/:id/assign-driver
   */
  @Post('deliveries/:id/assign-driver')
  @HttpCode(HttpStatus.OK)
  async assignDriver(
    @Request() req,
    @Param('id') deliveryId: string,
    @Body('driverId') driverId: string
  ) {
    return this.deliveryCompanyService.assignDeliveryToDriver(
      req.user.userId,
      deliveryId,
      driverId
    );
  }

  /**
   * Update delivery status
   * @route PUT /delivery-company/deliveries/:id/status
   */
  @Put('deliveries/:id/status')
  async updateStatus(
    @Request() req,
    @Param('id') deliveryId: string,
    @Body() body: { status: DeliveryStatus; notes?: string }
  ) {
    return this.deliveryService.updateStatus(
      deliveryId,
      body.status,
      req.user.userId,
      body.notes
    );
  }

  /**
   * Confirm delivery with proof
   * @route POST /delivery-company/deliveries/:id/confirm
   */
  @Post('deliveries/:id/confirm')
  async confirmDelivery(
    @Request() req,
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
    }
  ) {
    return this.deliveryService.confirmDelivery(deliveryId, {
      ...body,
      confirmedBy: req.user.userId,
    });
  }

  /**
   * Report delivery issue
   * @route POST /delivery-company/deliveries/:id/report-issue
   */
  @Post('deliveries/:id/report-issue')
  async reportIssue(
    @Request() req,
    @Param('id') deliveryId: string,
    @Body('issueDescription') issueDescription: string
  ) {
    return this.deliveryService.reportIssue(deliveryId, {
      issueDescription,
      reportedBy: req.user.userId,
    });
  }

  /**
   * Get all drivers in this company
   * @route GET /delivery-company/drivers
   */
  @Get('drivers')
  async getDrivers(@Request() req) {
    return this.deliveryCompanyService.getCompanyDrivers(req.user.userId);
  }

  /**
   * Upload proof of delivery
   * @route POST /delivery-company/deliveries/:id/proof
   */
  @Post('deliveries/:id/proof')
  async uploadProof(
    @Request() req,
    @Param('id') deliveryId: string,
    @Body()
    body: {
      signature?: string;
      photos?: string[];
      notes?: string;
      gps?: { latitude: number; longitude: number };
    }
  ) {
    // First verify the delivery belongs to this company
    await this.deliveryCompanyService.getDeliveryDetails(req.user.userId, deliveryId);

    // Update the proof of delivery
    const delivery = await this.deliveryService['prisma'].delivery.update({
      where: { id: deliveryId },
      data: {
        proofOfDelivery: body,
      },
    });

    return {
      success: true,
      message: 'Proof of delivery uploaded successfully',
      data: delivery,
    };
  }
}
