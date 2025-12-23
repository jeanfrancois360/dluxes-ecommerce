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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DeliveryService } from './delivery.service';
import { UploadService } from '../upload/upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DeliveryStatus, DeliveryConfirmationType } from '@prisma/client';

@Controller('deliveries')
export class DeliveryController {
  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly uploadService: UploadService,
  ) {}

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
   * Upload proof of delivery (image or PDF)
   * @route POST /deliveries/:id/upload-proof
   */
  @Post(':id/upload-proof')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'DELIVERY_PARTNER')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProofOfDelivery(
    @Param('id') deliveryId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    try {
      if (!file) {
        return {
          success: false,
          message: 'No file provided',
        };
      }

      // Upload file to Supabase (allows images and PDFs)
      const uploadResult = await this.uploadService.uploadFile(
        file,
        'proof-of-delivery',
        { allowPdf: true }
      );

      // Update delivery with proof URL
      const delivery = await this.deliveryService.uploadProofOfDelivery(
        deliveryId,
        uploadResult.url,
        req.user.userId
      );

      return {
        success: true,
        data: {
          delivery,
          fileUrl: uploadResult.url,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.size,
          mimeType: uploadResult.mimeType,
        },
        message: 'Proof of delivery uploaded successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload proof',
      };
    }
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

  /**
   * Buyer confirms receipt of delivery
   * @route POST /deliveries/:id/buyer-confirm
   */
  @Post(':id/buyer-confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER', 'CUSTOMER')
  async buyerConfirmDelivery(@Param('id') id: string, @Request() req) {
    try {
      const data = await this.deliveryService.buyerConfirmDelivery(id, req.user.userId);
      return {
        success: true,
        data,
        message: 'Delivery confirmed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to confirm delivery',
      };
    }
  }

  /**
   * Get delivery for an order (for buyer)
   * @route GET /deliveries/order/:orderId
   */
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async getDeliveryByOrder(@Param('orderId') orderId: string, @Request() req) {
    try {
      const data = await this.deliveryService.getDeliveryByOrder(orderId, req.user.userId);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch delivery',
      };
    }
  }
}
