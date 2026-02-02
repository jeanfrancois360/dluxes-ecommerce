import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ShipmentStatus, UserRole } from '@prisma/client';
import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTOs
class CreateShipmentDto {
  @IsString()
  orderId: string;

  @IsString()
  storeId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  itemIds: string[];

  @IsOptional()
  @IsString()
  carrier?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsDateString()
  estimatedDelivery?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  shippingCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateShipmentDto {
  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @IsOptional()
  @IsString()
  carrier?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @IsOptional()
  @IsDateString()
  estimatedDelivery?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  shippingCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

class GetShipmentsQueryDto {
  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}

@Controller('shipments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  /**
   * Create a new shipment (Seller only)
   * POST /api/v1/shipments
   */
  @Post()
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createShipment(@Request() req, @Body() dto: CreateShipmentDto) {
    const shipment = await this.shipmentsService.createShipment(
      {
        ...dto,
        estimatedDelivery: dto.estimatedDelivery
          ? new Date(dto.estimatedDelivery)
          : undefined,
      },
      req.user.id
    );

    return {
      success: true,
      data: shipment,
      message: 'Shipment created successfully',
    };
  }

  /**
   * Update shipment (Seller only)
   * PATCH /api/v1/shipments/:id
   */
  @Patch(':id')
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateShipment(
    @Request() req,
    @Param('id') shipmentId: string,
    @Body() dto: UpdateShipmentDto
  ) {
    const shipment = await this.shipmentsService.updateShipment(
      shipmentId,
      {
        ...dto,
        estimatedDelivery: dto.estimatedDelivery
          ? new Date(dto.estimatedDelivery)
          : undefined,
      },
      req.user.id
    );

    return {
      success: true,
      data: shipment,
      message: 'Shipment updated successfully',
    };
  }

  /**
   * Get shipments for an order
   * GET /api/v1/shipments/order/:orderId
   * IMPORTANT: This must come BEFORE the :id route to avoid route conflicts
   */
  @Get('order/:orderId')
  async getShipmentsByOrder(
    @Request() req,
    @Param('orderId') orderId: string
  ) {
    const shipments = await this.shipmentsService.getShipmentsByOrder(
      orderId,
      req.user.id,
      req.user.role
    );

    return {
      success: true,
      data: shipments,
    };
  }

  /**
   * Get shipment by ID
   * GET /api/v1/shipments/:id
   * IMPORTANT: This must come AFTER more specific routes
   */
  @Get(':id')
  async getShipmentById(@Request() req, @Param('id') shipmentId: string) {
    const shipment = await this.shipmentsService.getShipmentById(
      shipmentId,
      req.user.id,
      req.user.role
    );

    if (!shipment) {
      return {
        success: false,
        data: null,
        message: 'Shipment not found',
      };
    }

    return {
      success: true,
      data: shipment,
    };
  }

  /**
   * Get seller's shipments with pagination and filters (Seller only)
   * GET /api/v1/shipments/seller/my-shipments
   */
  @Get('seller/my-shipments')
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getSellerShipments(@Request() req, @Query() query: GetShipmentsQueryDto) {
    const result = await this.shipmentsService.getSellerShipments(
      req.user.id,
      query
    );

    return {
      success: true,
      ...result,
    };
  }
}
