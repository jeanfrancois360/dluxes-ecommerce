import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { EasyPostService } from './easypost.service';
import { EasyPostRatesService } from './easypost-rates.service';
import { EasyPostShipmentService } from './easypost-shipment.service';
import { EasyPostTrackingService } from './easypost-tracking.service';
import { EasyPostAddressService } from './easypost-address.service';
import { GetRatesDto } from './dto/get-rates.dto';
import { PurchaseLabelDto } from './dto/purchase-label.dto';
import { AddressDto } from './dto/address.dto';

@Controller('easypost')
export class EasyPostController {
  constructor(
    private readonly easypostService: EasyPostService,
    private readonly ratesService: EasyPostRatesService,
    private readonly shipmentService: EasyPostShipmentService,
    private readonly trackingService: EasyPostTrackingService,
    private readonly addressService: EasyPostAddressService
  ) {}

  /**
   * Test EasyPost connection
   * GET /easypost/test
   */
  @Get('test')
  async testConnection() {
    try {
      const isEnabled = this.easypostService.isEnabled();
      if (!isEnabled) {
        return {
          success: false,
          message: 'EasyPost is not enabled or API key is not configured',
        };
      }

      // Create a test address to verify credentials (works with test keys)
      const client = this.easypostService.getClient();
      const testAddress = await client.Address.create({
        name: 'Test User',
        street1: '388 Townsend St',
        street2: 'Apt 20',
        city: 'San Francisco',
        state: 'CA',
        zip: '94107',
        country: 'US',
        phone: '555-555-5555',
      });

      return {
        success: true,
        message: 'EasyPost API connection successful ✅',
        data: {
          testMode: true,
          testAddressId: testAddress.id,
          apiKeyFormat: 'Valid EasyPost test key',
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'EasyPost API connection failed',
        error: error.message,
      };
    }
  }

  /**
   * Get shipping rates for a package
   * POST /easypost/rates
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('rates')
  @Roles('SELLER', 'ADMIN')
  async getRates(@Body() dto: GetRatesDto) {
    return this.ratesService.getRates(dto);
  }

  /**
   * Get lowest rate for a package
   * POST /easypost/rates/lowest
   */
  @Post('rates/lowest')
  @Roles('SELLER', 'ADMIN')
  async getLowestRate(
    @Body() dto: GetRatesDto,
    @Query('carriers') carriers?: string,
    @Query('services') services?: string
  ) {
    const carriersList = carriers ? carriers.split(',') : undefined;
    const servicesList = services ? services.split(',') : undefined;
    return this.ratesService.getLowestRate(dto, carriersList, servicesList);
  }

  /**
   * Purchase a shipping label
   * POST /easypost/purchase
   */
  @Post('purchase')
  @Roles('SELLER', 'ADMIN')
  async purchaseLabel(@Body() dto: PurchaseLabelDto, @Req() req) {
    // Ensure seller can only purchase labels for their own orders
    if (req.user.role === 'SELLER' && dto.sellerId !== req.user.id) {
      throw new Error('Unauthorized: Cannot purchase labels for other sellers');
    }
    return this.shipmentService.purchaseLabel(dto);
  }

  /**
   * Create a return label
   * POST /easypost/return-label
   */
  @Post('return-label')
  @Roles('SELLER', 'ADMIN')
  async createReturnLabel(@Body() dto: PurchaseLabelDto, @Req() req) {
    if (req.user.role === 'SELLER' && dto.sellerId !== req.user.id) {
      throw new Error('Unauthorized: Cannot create return labels for other sellers');
    }
    return this.shipmentService.createReturnLabel(dto);
  }

  /**
   * Refund a shipping label
   * POST /easypost/refund/:shipmentId
   */
  @Post('refund/:shipmentId')
  @Roles('SELLER', 'ADMIN')
  async refundLabel(@Param('shipmentId') shipmentId: string, @Req() req) {
    // TODO: Add authorization check to ensure seller owns this shipment
    return this.shipmentService.refundLabel(shipmentId);
  }

  /**
   * Convert label format
   * POST /easypost/convert/:shipmentId
   */
  @Post('convert/:shipmentId')
  @Roles('SELLER', 'ADMIN')
  async convertLabelFormat(
    @Param('shipmentId') shipmentId: string,
    @Body('format') format: 'PDF' | 'ZPL' | 'EPL2'
  ) {
    return this.shipmentService.convertLabelFormat(shipmentId, format);
  }

  /**
   * Get shipment details
   * GET /easypost/shipment/:id
   */
  @Get('shipment/:id')
  @Roles('SELLER', 'ADMIN', 'BUYER')
  async getShipment(@Param('id') id: string) {
    return this.shipmentService.getShipment(id);
  }

  /**
   * Get shipments for an order
   * GET /easypost/order/:orderId/shipments
   */
  @Get('order/:orderId/shipments')
  @Roles('SELLER', 'ADMIN', 'BUYER')
  async getOrderShipments(@Param('orderId') orderId: string) {
    return this.shipmentService.getOrderShipments(orderId);
  }

  /**
   * Get tracking information
   * GET /easypost/tracking/:shipmentId
   */
  @Get('tracking/:shipmentId')
  @Roles('SELLER', 'ADMIN', 'BUYER')
  async getTracking(@Param('shipmentId') shipmentId: string) {
    return this.trackingService.getTracking(shipmentId);
  }

  /**
   * Create a tracker for external tracking number
   * POST /easypost/tracker
   */
  @Post('tracker')
  @Roles('SELLER', 'ADMIN')
  async createTracker(
    @Body('trackingNumber') trackingNumber: string,
    @Body('carrier') carrier?: string
  ) {
    return this.trackingService.createTracker(trackingNumber, carrier);
  }

  /**
   * Verify an address
   * POST /easypost/verify-address
   */
  @Post('verify-address')
  @Roles('SELLER', 'ADMIN', 'BUYER')
  async verifyAddress(@Body() address: AddressDto, @Query('strict') strict?: boolean) {
    return this.addressService.verifyAddress(address, strict === true);
  }
}
