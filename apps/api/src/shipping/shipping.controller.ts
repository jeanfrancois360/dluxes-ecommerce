import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { DhlRatesService } from '../integrations/dhl/dhl-rates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('shipping')
export class ShippingController {
  constructor(
    private readonly shippingService: ShippingService,
    private readonly dhlRatesService: DhlRatesService
  ) {}

  /**
   * Get all shipping zones (Public - for checkout)
   */
  @Get('zones')
  async getAllZones(@Query('isActive') isActive?: string) {
    return this.shippingService.getAllZones({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  /**
   * Get shipping zone by code
   */
  @Get('zones/:code')
  async getZoneByCode(@Param('code') code: string) {
    return this.shippingService.getZoneByCode(code);
  }

  /**
   * Calculate shipping options for checkout
   */
  @Post('calculate')
  async calculateShipping(
    @Body()
    body: {
      country: string;
      state?: string;
      city?: string;
      postalCode?: string;
      orderTotal: number;
      weight?: number;
    }
  ) {
    return this.shippingService.getShippingOptions(
      {
        country: body.country,
        state: body.state,
        city: body.city,
        postalCode: body.postalCode,
      },
      body.orderTotal,
      body.weight
    );
  }

  /**
   * Create shipping zone (Admin only)
   */
  @Post('zones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createZone(
    @Body()
    body: {
      name: string;
      code: string;
      description?: string;
      countries: string[];
      states?: string[];
      cities?: string[];
      postalCodes?: string[];
      baseFee: number;
      perKgFee?: number;
      freeShippingThreshold?: number;
      minDeliveryDays?: number;
      maxDeliveryDays?: number;
      priority?: number;
    }
  ) {
    return this.shippingService.createZone(body);
  }

  /**
   * Update shipping zone (Admin only)
   */
  @Put('zones/:code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateZone(@Param('code') code: string, @Body() body: any) {
    return this.shippingService.updateZone(code, body);
  }

  /**
   * Delete shipping zone (Admin only)
   */
  @Delete('zones/:code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteZone(@Param('code') code: string) {
    return this.shippingService.deleteZone(code);
  }

  /**
   * Create shipping rate for a zone (Admin only)
   */
  @Post('zones/:zoneId/rates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createRate(
    @Param('zoneId') zoneId: string,
    @Body()
    body: {
      name: string;
      minOrderValue?: number;
      maxOrderValue?: number;
      rate: number;
      perKgRate?: number;
      minDeliveryDays?: number;
      maxDeliveryDays?: number;
    }
  ) {
    return this.shippingService.createRate({ ...body, zoneId });
  }

  /**
   * Get shipping rates for a zone
   */
  @Get('zones/:zoneId/rates')
  async getZoneRates(@Param('zoneId') zoneId: string) {
    return this.shippingService.getZoneRates(zoneId);
  }

  /**
   * Get shipping statistics (Admin only)
   */
  @Get('admin/statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getStatistics() {
    return this.shippingService.getShippingStatistics();
  }

  /**
   * Get DHL API health status (Admin only)
   * Tests DHL Express API configuration and credentials
   */
  @Get('admin/dhl/health')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getDhlHealth() {
    return this.dhlRatesService.getHealthStatus();
  }

  /**
   * Test DHL API with a sample rate request (Admin only)
   * Useful for testing credentials and API connectivity
   */
  @Post('admin/dhl/test-rates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async testDhlRates(
    @Body()
    body?: {
      originCountry?: string;
      originPostalCode?: string;
      destinationCountry?: string;
      destinationPostalCode?: string;
      weight?: number;
    }
  ) {
    try {
      const rates = await this.dhlRatesService.getSimplifiedRates({
        originCountryCode: body?.originCountry || 'BE',
        originPostalCode: body?.originPostalCode || '1000',
        originCityName: 'Brussels',
        destinationCountryCode: body?.destinationCountry || 'GB',
        destinationPostalCode: body?.destinationPostalCode || 'SW1A 1AA',
        destinationCityName: 'London',
        weight: body?.weight || 1,
      });

      return {
        success: true,
        message: 'DHL API is working correctly',
        ratesCount: rates.length,
        rates,
      };
    } catch (error) {
      return {
        success: false,
        message: `DHL API test failed: ${error.message}`,
        error: error.response?.data || error.message,
      };
    }
  }
}
