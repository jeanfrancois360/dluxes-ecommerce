import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SettingsService } from '../../settings/settings.service';
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
    private readonly addressService: EasyPostAddressService,
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService
  ) {}

  /**
   * Health check endpoint for EasyPost integration
   * GET /easypost/health
   * Returns connection status, configuration state, and API key validity
   */
  @Get('health')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getHealthStatus() {
    try {
      // Check if EasyPost is enabled in settings
      const enabledSetting = await this.settingsService.getSetting('easypost_enabled');
      const enabled = enabledSetting?.value ?? false;

      // Check if API key is configured in environment
      const apiKey = this.configService.get<string>('EASYPOST_API_KEY');
      const webhookSecret = this.configService.get<string>('EASYPOST_WEBHOOK_SECRET');
      const configured = !!apiKey;

      // Get test mode setting
      const testModeSetting = await this.settingsService.getSetting('easypost_test_mode');
      const testMode = testModeSetting?.value ?? true;

      // Mask API key for display (show first 4 and last 4 characters)
      let maskedApiKey = 'Not Configured';
      if (apiKey) {
        const keyPrefix = apiKey.substring(0, 4);
        const keySuffix = apiKey.substring(apiKey.length - 4);
        maskedApiKey = `${keyPrefix}••••••••${keySuffix}`;
      }

      // Test credentials validity by making a simple API call with timeout
      let credentialsValid = false;
      let connectionError: string | null = null;

      if (configured) {
        try {
          const client = this.easypostService.getClient();

          // Create a timeout promise (3 seconds)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out after 3 seconds')), 3000);
          });

          // Test with Address creation (works with test keys, unlike User.retrieveMe())
          const testAddress = (await Promise.race([
            client.Address.create({
              name: 'Health Check',
              street1: '388 Townsend St',
              city: 'San Francisco',
              state: 'CA',
              zip: '94107',
              country: 'US',
            }),
            timeoutPromise,
          ])) as any;

          credentialsValid = !!testAddress?.id;
        } catch (error) {
          connectionError = error?.message || 'Unknown error';
          credentialsValid = false;
        }
      }

      return {
        success: true,
        data: {
          enabled,
          configured,
          credentialsValid,
          testMode,
          webhookSecretConfigured: !!webhookSecret,
          apiKey: maskedApiKey,
          connectionError,
          message: enabled
            ? configured
              ? credentialsValid
                ? `✅ EasyPost connected (${testMode ? 'Test' : 'Production'} mode)`
                : '❌ API key invalid or connection failed'
              : '⚠️ API key not configured in environment variables'
            : 'ℹ️ EasyPost is disabled in settings',
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to check EasyPost health status',
        error: error.message,
      };
    }
  }

  /**
   * Test EasyPost connection with diagnostics
   * GET /easypost/test
   */
  @Get('test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async testConnection() {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      tests: [],
    };

    try {
      const isEnabled = this.easypostService.isEnabled();
      if (!isEnabled) {
        return {
          success: false,
          message: 'EasyPost is not enabled or API key is not configured',
          diagnostics,
        };
      }

      const client = this.easypostService.getClient();
      const apiKey = this.configService.get<string>('EASYPOST_API_KEY');

      // Test 1: Raw HTTP request to EasyPost API (bypass SDK)
      const test1Start = Date.now();
      try {
        const https = require('https');
        const rawResponse = await new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Raw HTTP timeout after 3s')), 3000);

          const options = {
            hostname: 'api.easypost.com',
            path: '/v2/addresses',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            timeout: 3000,
          };

          const req = https.request(options, (res) => {
            clearTimeout(timeout);
            resolve({ statusCode: res.statusCode });
          });

          req.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });

          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
          });

          req.write(
            JSON.stringify({
              address: {
                name: 'Test',
                street1: '388 Townsend St',
                city: 'San Francisco',
                state: 'CA',
                zip: '94107',
                country: 'US',
              },
            })
          );
          req.end();
        });

        diagnostics.tests.push({
          name: 'Raw HTTP Request',
          status: 'PASSED',
          duration: Date.now() - test1Start,
          result: rawResponse,
        });
      } catch (error) {
        diagnostics.tests.push({
          name: 'Raw HTTP Request',
          status: 'FAILED',
          duration: Date.now() - test1Start,
          error: error.message,
        });
      }

      // Test 2: SDK with 2-second timeout
      const test2Start = Date.now();
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('SDK timeout after 2s')), 2000);
        });

        const result = (await Promise.race([client.User.retrieveMe(), timeoutPromise])) as any;

        diagnostics.tests.push({
          name: 'SDK User API',
          status: 'PASSED',
          duration: Date.now() - test2Start,
          result: { userId: result?.id },
        });
      } catch (error) {
        diagnostics.tests.push({
          name: 'SDK User API',
          status: 'FAILED',
          duration: Date.now() - test2Start,
          error: error.message,
        });
      }

      // Test 3: SDK Address creation with 3-second timeout
      const test3Start = Date.now();
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('SDK address timeout after 3s')), 3000);
        });

        const testAddress = (await Promise.race([
          client.Address.create({
            name: 'Test User',
            street1: '388 Townsend St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94107',
            country: 'US',
          }),
          timeoutPromise,
        ])) as any;

        diagnostics.tests.push({
          name: 'SDK Address Creation',
          status: 'PASSED',
          duration: Date.now() - test3Start,
          result: { addressId: testAddress?.id },
        });
      } catch (error) {
        diagnostics.tests.push({
          name: 'SDK Address Creation',
          status: 'FAILED',
          duration: Date.now() - test3Start,
          error: error.message,
        });
      }

      const allPassed = diagnostics.tests.every((t) => t.status === 'PASSED');

      return {
        success: allPassed,
        message: allPassed
          ? '✅ All EasyPost tests passed'
          : '⚠️ Some EasyPost tests failed - see diagnostics',
        diagnostics,
        summary: {
          totalTests: diagnostics.tests.length,
          passed: diagnostics.tests.filter((t) => t.status === 'PASSED').length,
          failed: diagnostics.tests.filter((t) => t.status === 'FAILED').length,
          avgDuration: Math.round(
            diagnostics.tests.reduce((sum, t) => sum + t.duration, 0) / diagnostics.tests.length
          ),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'EasyPost diagnostic test failed',
        error: error.message,
        diagnostics,
      };
    }
  }

  /**
   * Get shipping rates for a package
   * POST /easypost/rates
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('rates')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  async getRates(@Body() dto: GetRatesDto) {
    return this.ratesService.getRates(dto);
  }

  /**
   * Get lowest rate for a package
   * POST /easypost/rates/lowest
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('rates/lowest')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('purchase')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('return-label')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('refund/:shipmentId')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  async refundLabel(@Param('shipmentId') shipmentId: string, @Req() req: any) {
    return this.shipmentService.refundLabel(shipmentId, req.user);
  }

  /**
   * Convert label format
   * POST /easypost/convert/:shipmentId
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('convert/:shipmentId')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  async convertLabelFormat(
    @Param('shipmentId') shipmentId: string,
    @Body('format') format: 'PDF' | 'ZPL' | 'EPL2',
    @Req() req: any
  ) {
    return this.shipmentService.convertLabelFormat(shipmentId, format, req.user);
  }

  /**
   * Get shipment details
   * GET /easypost/shipment/:id
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('shipment/:id')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN', 'BUYER')
  async getShipment(@Param('id') id: string) {
    return this.shipmentService.getShipment(id);
  }

  /**
   * Get shipments for an order
   * GET /easypost/order/:orderId/shipments
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('order/:orderId/shipments')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN', 'BUYER')
  async getOrderShipments(@Param('orderId') orderId: string) {
    return this.shipmentService.getOrderShipments(orderId);
  }

  /**
   * Get tracking information
   * GET /easypost/tracking/:shipmentId
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('tracking/:shipmentId')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN', 'BUYER')
  async getTracking(@Param('shipmentId') shipmentId: string) {
    return this.trackingService.getTracking(shipmentId);
  }

  /**
   * Create a tracker for external tracking number
   * POST /easypost/tracker
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('tracker')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('verify-address')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN', 'BUYER')
  async verifyAddress(@Body() address: AddressDto, @Query('strict') strict?: boolean) {
    return this.addressService.verifyAddress(address, strict === true);
  }
}
