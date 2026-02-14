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
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ShipmentsService } from './shipments.service';
import {
  DhlShipmentService,
  DhlAddress,
  DhlPackage,
} from '../integrations/dhl/dhl-shipment.service';
import { DhlRatesService } from '../integrations/dhl/dhl-rates.service';
import { PrismaService } from '../database/prisma.service';
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
  IsBoolean,
  Min,
  ArrayMinSize,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTOs
class DimensionsDto {
  @IsNumber()
  @Type(() => Number)
  length: number;

  @IsNumber()
  @Type(() => Number)
  width: number;

  @IsNumber()
  @Type(() => Number)
  height: number;

  @IsString()
  unit: string;
}

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

  @IsOptional()
  @IsString()
  trackingUrl?: string;

  // DHL Auto-generation fields
  @IsOptional()
  @IsBoolean()
  generateTracking?: boolean;

  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsOptional()
  @Type(() => DimensionsDto)
  dimensions?: DimensionsDto;
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
  private readonly logger = new Logger(ShipmentsController.name);

  constructor(
    private readonly shipmentsService: ShipmentsService,
    private readonly dhlShipmentService: DhlShipmentService,
    private readonly dhlRatesService: DhlRatesService,
    private readonly prisma: PrismaService
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
      throw new HttpException('DHL API is not configured', HttpStatus.SERVICE_UNAVAILABLE);
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
      throw new HttpException('DHL API is not configured', HttpStatus.SERVICE_UNAVAILABLE);
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
      req.user.id
    );

    // Update shipment with tracking URL
    await this.shipmentsService.updateShipment(
      shipment.id,
      {
        trackingUrl: dhlResult.trackingUrl,
        status: ShipmentStatus.LABEL_CREATED,
      },
      req.user.id
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
        labels: dhlResult.documents.filter((doc) => doc.typeCode === 'label'),
        documents: dhlResult.documents.filter((doc) => doc.typeCode !== 'label'),
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
  async getDhlLabel(@Param('trackingNumber') trackingNumber: string, @Res() res: Response) {
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
      message: cancelled ? 'DHL shipment cancelled successfully' : 'Failed to cancel DHL shipment',
    };
  }

  // ============================================================================
  // STANDARD SHIPMENT ENDPOINTS
  // ============================================================================

  /**
   * Create a new shipment (Seller only)
   * POST /api/v1/shipments
   *
   * Supports two modes:
   * 1. Manual: Seller provides tracking number
   * 2. Auto-generate (DHL): System creates DHL shipment automatically
   */
  @Post()
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createShipment(@Request() req, @Body() dto: CreateShipmentDto) {
    // Check if auto-generate DHL tracking is requested
    if (dto.generateTracking && dto.carrier?.toUpperCase() === 'DHL') {
      return this.createDhlShipmentAuto(req, dto);
    }

    // Manual tracking flow
    const shipment = await this.shipmentsService.createShipment(
      {
        ...dto,
        estimatedDelivery: dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : undefined,
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
   * Auto-generate DHL shipment (internal helper)
   * Called when generateTracking=true and carrier=DHL
   */
  private async createDhlShipmentAuto(@Request() req, dto: CreateShipmentDto) {
    // Validate DHL API is configured
    if (!this.dhlShipmentService.isApiEnabled()) {
      throw new HttpException(
        'DHL API is not configured. Please add DHL_EXPRESS_API_KEY and DHL_EXPRESS_API_SECRET to .env file.',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    // Validate required fields for DHL
    if (!dto.weight) {
      throw new HttpException(
        'Weight is required for DHL shipment creation',
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      !dto.dimensions ||
      !dto.dimensions.length ||
      !dto.dimensions.width ||
      !dto.dimensions.height
    ) {
      throw new HttpException(
        'Package dimensions (length, width, height) are required for DHL shipment creation',
        HttpStatus.BAD_REQUEST
      );
    }

    // Fetch order with shipping address and user
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        shippingAddress: true,
        user: true, // Include user for email
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order || !order.shippingAddress) {
      throw new HttpException('Order or shipping address not found', HttpStatus.NOT_FOUND);
    }

    // Fetch store with address
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
    });

    if (!store) {
      throw new HttpException('Store not found', HttpStatus.NOT_FOUND);
    }

    // Validate store has complete address
    if (!store.address1 || !store.city || !store.country || !store.postalCode) {
      throw new HttpException(
        'Store address is incomplete. Please update your store settings with a complete address.',
        HttpStatus.BAD_REQUEST
      );
    }

    // Map store address to DHL shipper address
    const shipperAddress: DhlAddress = {
      name: store.name,
      company: store.name,
      addressLine1: store.address1,
      addressLine2: store.address2 || undefined,
      city: store.city,
      stateOrProvince: store.province || undefined,
      postalCode: store.postalCode,
      countryCode: this.getCountryCode(store.country),
      phone: store.phone || '',
      email: store.email,
    };

    // Map order shipping address to DHL receiver address
    const receiverAddress: DhlAddress = {
      name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
      company: order.shippingAddress.company || undefined,
      addressLine1: order.shippingAddress.address1,
      addressLine2: order.shippingAddress.address2 || undefined,
      city: order.shippingAddress.city,
      stateOrProvince: order.shippingAddress.province || undefined,
      postalCode: order.shippingAddress.postalCode || '',
      countryCode: this.getCountryCode(order.shippingAddress.country),
      phone: order.shippingAddress.phone || '',
      email: order.user?.email, // Add buyer's email
    };

    // Build package info
    const packages: DhlPackage[] = [
      {
        weight: dto.weight,
        length: dto.dimensions.length,
        width: dto.dimensions.width,
        height: dto.dimensions.height,
      },
    ];

    // Get available product codes from DHL Rating API first
    const shipperCountry = this.getCountryCode(store.country);
    const receiverCountry = this.getCountryCode(order.shippingAddress.country);

    this.logger.log('Querying DHL Rating API for available products...');
    let productCode: string;
    let rates: any[] = [];

    try {
      // Call Rating API to get available products for this route
      rates = await this.dhlRatesService.getSimplifiedRates({
        originCountryCode: shipperCountry,
        originPostalCode: store.postalCode || '1000',
        destinationCountryCode: receiverCountry,
        destinationPostalCode: order.shippingAddress.postalCode || '75008',
        weight: dto.weight,
        length: dto.dimensions?.length,
        width: dto.dimensions?.width,
        height: dto.dimensions?.height,
      });

      if (rates.length === 0) {
        throw new HttpException(
          'No DHL shipping options available for this route',
          HttpStatus.BAD_REQUEST
        );
      }

      // Log all available products
      this.logger.log(`DHL Rating API returned ${rates.length} products:`);
      rates.forEach((rate, index) => {
        this.logger.log(
          `  ${index + 1}. ${rate.productCode} - ${rate.name} (${rate.price} ${rate.currency})`
        );
      });

      // Use the first available product code
      productCode = rates[0].productCode;
      this.logger.log(`Selected product: ${productCode} (${rates[0].name})`);
    } catch (error) {
      this.logger.warn('Failed to get DHL rates, falling back to manual selection:', error.message);
      // Fallback to manual selection if Rating API fails
      productCode = this.mapServiceTypeToDhlProduct(
        dto.serviceType || 'express',
        shipperCountry,
        receiverCountry
      );
    }

    // Get product description for customs
    const itemNames = order.items
      .filter((item) => dto.itemIds.includes(item.id))
      .map((item) => item.product.name)
      .join(', ');
    const description = itemNames.substring(0, 50) || 'E-commerce Products';

    // Calculate declared value for customs (required for international shipments)
    const declaredValue = order.items
      .filter((item) => dto.itemIds.includes(item.id))
      .reduce((sum, item) => {
        const price = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price);
        return sum + price * item.quantity;
      }, 0);

    // Create DHL shipment with retry logic for different product codes
    let dhlResult: any;
    let lastError: any;

    // Get Belgium-specific manual product code as fallback
    const manualProductCode = this.mapServiceTypeToDhlProduct(
      dto.serviceType || 'express',
      shipperCountry,
      receiverCountry
    );

    // Build list of product codes to try
    let productCodesToTry: Array<{ code: string; name: string }> = [];

    if (rates && rates.length > 0) {
      // Add all products from Rating API (account-specific, should all be available)
      productCodesToTry = rates.map((r) => ({ code: r.productCode, name: r.name }));

      this.logger.log(`✅ Rating API returned ${rates.length} products available for this account`);

      // Only add manual fallback if Rating API returned no valid options
      // Rating API should be authoritative about account permissions
      const ratingApiCodes = rates.map((r) => r.productCode);
      if (rates.length < 3 && !ratingApiCodes.includes(manualProductCode)) {
        // If Rating API returned very few products, add manual selection as fallback
        productCodesToTry.push({
          code: manualProductCode,
          name: `Manual Selection (Belgium-specific: ${manualProductCode})`,
        });
        this.logger.log(
          `⚠️  Rating API returned only ${rates.length} products, adding manual code '${manualProductCode}' as fallback`
        );
      } else if (!ratingApiCodes.includes(manualProductCode)) {
        this.logger.log(
          `ℹ️  Belgium-specific code '${manualProductCode}' not in Rating API results - account may not support this product`
        );
      }
    } else {
      // No Rating API results, use manual selection only
      productCodesToTry = [{ code: productCode, name: 'Manual Selection' }];
      this.logger.warn(
        `⚠️  Rating API returned no products - falling back to manual selection: ${productCode}`
      );
    }

    this.logger.log(
      `Will try ${productCodesToTry.length} product codes: ${productCodesToTry.map((p) => p.code).join(', ')}`
    );
    this.logger.log(`Shipment route: ${shipperCountry} → ${receiverCountry}`);

    for (const product of productCodesToTry) {
      try {
        const dhlRequest = {
          shipperAddress,
          receiverAddress,
          packages,
          productCode: product.code,
          plannedShippingDate: new Date().toISOString().split('T')[0],
          description,
          declaredValue: declaredValue > 0 ? declaredValue : 100,
          declaredValueCurrency: 'USD',
          customerReference: `Order-${dto.orderId.substring(0, 10)}`,
        };

        this.logger.log(
          `Attempting shipment creation with product ${product.code} (${product.name})...`
        );

        dhlResult = await this.dhlShipmentService.createShipment(dhlRequest);

        // Success! Break out of loop
        this.logger.log(`✅ Shipment created successfully with product ${product.code}`);
        break;
      } catch (error) {
        lastError = error;
        this.logger.warn(`❌ Product ${product.code} failed: ${error.message}`);

        // If this is the last product to try, throw the error
        if (product === productCodesToTry[productCodesToTry.length - 1]) {
          throw error;
        }

        // Otherwise, try next product
        continue;
      }
    }

    if (!dhlResult) {
      throw (
        lastError ||
        new HttpException(
          'Failed to create DHL shipment with any available product',
          HttpStatus.BAD_REQUEST
        )
      );
    }

    // Shipment created successfully
    try {
      // Create internal shipment record with DHL tracking info
      const shipment = await this.shipmentsService.createShipment(
        {
          orderId: dto.orderId,
          storeId: dto.storeId,
          itemIds: dto.itemIds,
          carrier: 'DHL Express',
          trackingNumber: dhlResult.shipmentTrackingNumber,
          trackingUrl: dhlResult.trackingUrl,
          shippingCost: dhlResult.totalPrice?.price,
          weight: dto.weight,
          notes: `Auto-generated via DHL API - ${this.dhlShipmentService.getProductDescription(productCode)}`,
        },
        req.user.id
      );

      // Update shipment with label created status
      await this.shipmentsService.updateShipment(
        shipment.id,
        {
          status: ShipmentStatus.LABEL_CREATED,
        },
        req.user.id
      );

      return {
        success: true,
        data: {
          shipment: {
            id: shipment.id,
            shipmentNumber: shipment.shipmentNumber,
            trackingNumber: dhlResult.shipmentTrackingNumber,
            trackingUrl: dhlResult.trackingUrl,
            status: ShipmentStatus.LABEL_CREATED,
          },
          dhl: {
            trackingNumber: dhlResult.shipmentTrackingNumber,
            trackingUrl: dhlResult.trackingUrl,
            estimatedDelivery: dhlResult.estimatedDeliveryDate,
            totalPrice: dhlResult.totalPrice,
            packages: dhlResult.packages,
          },
          labels: dhlResult.documents.filter((doc) => doc.typeCode === 'label'),
        },
        message: 'DHL shipment created successfully with tracking number',
      };
    } catch (error) {
      this.logger.error('Failed to create DHL shipment:', error);

      // Log detailed DHL error for debugging
      if (error.response?.data) {
        this.logger.error('DHL API Response:', JSON.stringify(error.response.data, null, 2));
      }

      // Extract detailed error message from DHL response
      let errorMessage = error.message;
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.title) {
        errorMessage = error.response.data.title;
      }

      throw new HttpException(
        `Failed to create DHL shipment: ${errorMessage}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Convert country name to ISO 2-letter code
   * DHL requires ISO codes like US, CA, GB, etc.
   */
  private getCountryCode(country: string): string {
    const countryMap: Record<string, string> = {
      'United States': 'US',
      USA: 'US',
      Canada: 'CA',
      'United Kingdom': 'GB',
      UK: 'GB',
      Germany: 'DE',
      France: 'FR',
      Italy: 'IT',
      Spain: 'ES',
      Netherlands: 'NL',
      Belgium: 'BE',
      Switzerland: 'CH',
      Austria: 'AT',
      Australia: 'AU',
      'New Zealand': 'NZ',
      Japan: 'JP',
      China: 'CN',
      India: 'IN',
      Singapore: 'SG',
      'Hong Kong': 'HK',
      'South Korea': 'KR',
      Mexico: 'MX',
      Brazil: 'BR',
    };

    // If already a 2-letter code, return as-is
    if (country.length === 2) {
      return country.toUpperCase();
    }

    // Try to find in map
    return countryMap[country] || country.substring(0, 2).toUpperCase();
  }

  /**
   * Map service type to DHL product code based on origin and destination
   */
  private mapServiceTypeToDhlProduct(
    serviceType: string,
    originCountry: string,
    destinationCountry: string
  ): string {
    // EU member states (27 countries as of 2024)
    const euCountries = [
      'AT',
      'BE',
      'BG',
      'HR',
      'CY',
      'CZ',
      'DK',
      'EE',
      'FI',
      'FR',
      'DE',
      'GR',
      'HU',
      'IE',
      'IT',
      'LV',
      'LT',
      'LU',
      'MT',
      'NL',
      'PL',
      'PT',
      'RO',
      'SK',
      'SI',
      'ES',
      'SE',
    ];

    const isDomestic = originCountry === destinationCountry;
    const bothInEu =
      euCountries.includes(originCountry) && euCountries.includes(destinationCountry);
    const isInternationalEu = bothInEu && !isDomestic;

    // 1. Domestic shipments (same country) - Use product 'N'
    if (isDomestic) {
      const domesticMap: Record<string, string> = {
        express: 'N', // DHL Express Domestic
        standard: 'N', // DHL Express Domestic
        economy: 'G', // DHL Express Domestic Economy
        overnight: 'I', // DHL Express Domestic 9:00
        express_9: 'I', // DHL Express Domestic 9:00
        domestic: 'N', // DHL Express Domestic
      };
      return domesticMap[serviceType.toLowerCase()] || 'N';
    }

    // 2. International EU shipments (Belgium → France, etc.) - Use product 'U'
    if (isInternationalEu) {
      const euInternationalMap: Record<string, string> = {
        express: 'U', // DHL Express Worldwide (EU)
        standard: 'U', // DHL Express Worldwide (EU)
        economy: 'W', // DHL Express Economy Select (ESU)
        overnight: 'K', // DHL Express 9:00 (TDK for documents)
        express_9: 'K', // DHL Express 9:00
        express_10: 'L', // DHL Express 10:30 (TDL for documents)
        express_12: 'T', // DHL Express 12:00 (TDT for documents, Y for non-doc)
      };
      return euInternationalMap[serviceType.toLowerCase()] || 'U';
    }

    // 3. International NON-EU shipments (Belgium → USA, etc.)
    // NOTE: Belgium uses country-specific codes that differ from global codes!
    // - Global code 'P' → Belgium code 'S' for Express Worldwide Non-document
    // - Use Rating API for accurate product codes per account
    const internationalNonEuMap: Record<string, string> = {
      express: originCountry === 'BE' ? 'S' : 'P', // BE uses 'S', others use 'P'
      standard: originCountry === 'BE' ? 'S' : 'P',
      economy: 'W', // DHL Express Economy Select (ESI for non-doc)
      overnight: 'K', // DHL Express 9:00
      express_9: 'C', // DHL Express 9:00 Non-document (BE specific)
      express_10: 'X', // DHL Express 10:30 (only to USA for BE)
      express_12: 'Y', // DHL Express 12:00 Non-document
    };

    return internationalNonEuMap[serviceType.toLowerCase()] || (originCountry === 'BE' ? 'S' : 'P');
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
        estimatedDelivery: dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : undefined,
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
  async getShipmentsByOrder(@Request() req, @Param('orderId') orderId: string) {
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
    const result = await this.shipmentsService.getSellerShipments(req.user.id, query);

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
