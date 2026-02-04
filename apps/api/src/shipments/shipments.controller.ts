import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { ShipmentsService } from './shipments.service';
import { DhlShipmentService, DhlAddress, DhlPackage } from '../integrations/dhl/dhl-shipment.service';
import { DhlRatesService } from '../integrations/dhl/dhl-rates.service';
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
  ValidateNested,
  IsObject,
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

// DHL Shipment DTOs
class DhlAddressDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsString()
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  stateOrProvince?: string;

  @IsString()
  postalCode: string;

  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

class DhlPackageDto {
  @IsNumber()
  @Min(0.1)
  @Type(() => Number)
  weight: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  length: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  width: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  height: number;
}

class CreateDhlShipmentDto {
  @IsString()
  orderId: string;

  @IsString()
  storeId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  itemIds: string[];

  @IsObject()
  @ValidateNested()
  @Type(() => DhlAddressDto)
  shipperAddress: DhlAddressDto;

  @IsObject()
  @ValidateNested()
  @Type(() => DhlAddressDto)
  receiverAddress: DhlAddressDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DhlPackageDto)
  packages: DhlPackageDto[];

  @IsString()
  productCode: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  plannedShippingDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  declaredValue?: number;

  @IsOptional()
  @IsString()
  declaredValueCurrency?: string;

  @IsOptional()
  @IsString()
  customerReference?: string;
}

class GetDhlRatesDto {
  @IsString()
  originCountryCode: string;

  @IsString()
  originPostalCode: string;

  @IsString()
  destinationCountryCode: string;

  @IsString()
  destinationPostalCode: string;

  @IsNumber()
  @Min(0.1)
  @Type(() => Number)
  weight: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  length?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  height?: number;
}

@Controller('shipments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShipmentsController {
  constructor(
    private readonly shipmentsService: ShipmentsService,
    private readonly dhlShipmentService: DhlShipmentService,
    private readonly dhlRatesService: DhlRatesService,
  ) {}

  // ============================================================================
  // DHL EXPRESS ENDPOINTS
  // ============================================================================

  /**
   * Get DHL shipping rates for a shipment
   * POST /api/v1/shipments/dhl/rates
   */
  @Post('dhl/rates')
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getDhlRates(@Body() dto: GetDhlRatesDto) {
    if (!this.dhlRatesService.isApiEnabled()) {
      throw new HttpException(
        'DHL API is not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const rates = await this.dhlRatesService.getSimplifiedRates({
      originCountryCode: dto.originCountryCode,
      originPostalCode: dto.originPostalCode,
      destinationCountryCode: dto.destinationCountryCode,
      destinationPostalCode: dto.destinationPostalCode,
      weight: dto.weight,
      length: dto.length,
      width: dto.width,
      height: dto.height,
    });

    return {
      success: true,
      data: rates,
      message: `Found ${rates.length} DHL shipping options`,
    };
  }

  /**
   * Get DHL API health status
   * GET /api/v1/shipments/dhl/health
   */
  @Get('dhl/health')
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getDhlHealth() {
    const ratesHealth = await this.dhlRatesService.getHealthStatus();
    const shipmentHealth = await this.dhlShipmentService.getHealthStatus();

    return {
      success: true,
      data: {
        rates: ratesHealth,
        shipments: shipmentHealth,
      },
    };
  }

  /**
   * Create a DHL Express shipment with label
   * POST /api/v1/shipments/dhl/create
   */
  @Post('dhl/create')
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createDhlShipment(@Request() req, @Body() dto: CreateDhlShipmentDto) {
    if (!this.dhlShipmentService.isApiEnabled()) {
      throw new HttpException(
        'DHL API is not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // Create DHL shipment
    const dhlResult = await this.dhlShipmentService.createShipment({
      shipperAddress: dto.shipperAddress as DhlAddress,
      receiverAddress: dto.receiverAddress as DhlAddress,
      packages: dto.packages as DhlPackage[],
      productCode: dto.productCode,
      plannedShippingDate: dto.plannedShippingDate || new Date().toISOString().split('T')[0],
      description: dto.description,
      declaredValue: dto.declaredValue,
      declaredValueCurrency: dto.declaredValueCurrency,
      customerReference: dto.customerReference,
    });

    // Create internal shipment record with DHL tracking info
    const shipment = await this.shipmentsService.createShipment(
      {
        orderId: dto.orderId,
        storeId: dto.storeId,
        itemIds: dto.itemIds,
        carrier: 'DHL Express',
        trackingNumber: dhlResult.shipmentTrackingNumber,
        shippingCost: dhlResult.totalPrice?.price,
        weight: dto.packages.reduce((sum, pkg) => sum + pkg.weight, 0),
        notes: `DHL ${this.dhlShipmentService.getProductDescription(dto.productCode)}`,
      },
      req.user.id,
    );

    // Update shipment with tracking URL
    await this.shipmentsService.updateShipment(
      shipment.id,
      {
        trackingUrl: dhlResult.trackingUrl,
        status: ShipmentStatus.LABEL_CREATED,
      },
      req.user.id,
    );

    return {
      success: true,
      data: {
        shipment: {
          id: shipment.id,
          shipmentNumber: shipment.shipmentNumber,
        },
        dhl: {
          trackingNumber: dhlResult.shipmentTrackingNumber,
          trackingUrl: dhlResult.trackingUrl,
          estimatedDelivery: dhlResult.estimatedDeliveryDate,
          totalPrice: dhlResult.totalPrice,
          packages: dhlResult.packages,
        },
        labels: dhlResult.documents.filter(doc => doc.typeCode === 'label'),
        documents: dhlResult.documents.filter(doc => doc.typeCode !== 'label'),
      },
      message: 'DHL shipment created successfully',
    };
  }

  /**
   * Get DHL shipment label (PDF)
   * GET /api/v1/shipments/dhl/:trackingNumber/label
   */
  @Get('dhl/:trackingNumber/label')
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getDhlLabel(
    @Param('trackingNumber') trackingNumber: string,
    @Res() res: Response,
  ) {
    const label = await this.dhlShipmentService.getShipmentLabel(trackingNumber);

    if (!label.content) {
      throw new HttpException('Label not found', HttpStatus.NOT_FOUND);
    }

    // Decode base64 and send as PDF
    const buffer = Buffer.from(label.content, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="DHL-Label-${trackingNumber}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  /**
   * Cancel a DHL shipment
   * DELETE /api/v1/shipments/dhl/:trackingNumber
   */
  @Delete('dhl/:trackingNumber')
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async cancelDhlShipment(@Param('trackingNumber') trackingNumber: string) {
    const cancelled = await this.dhlShipmentService.cancelShipment(trackingNumber);

    return {
      success: cancelled,
      message: cancelled
        ? 'DHL shipment cancelled successfully'
        : 'Failed to cancel DHL shipment',
    };
  }

  // ============================================================================
  // STANDARD SHIPMENT ENDPOINTS
  // ============================================================================

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
}
