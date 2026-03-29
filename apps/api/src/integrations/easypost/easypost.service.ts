import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import EasyPost from '@easypost/api';
import { SettingsService } from '../../settings/settings.service';

type EasyPostClient = InstanceType<typeof EasyPost>;

@Injectable()
export class EasyPostService implements OnModuleInit {
  private readonly logger = new Logger(EasyPostService.name);
  private client: EasyPostClient | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService
  ) {}

  async onModuleInit() {
    await this.initializeClient();
  }

  async initializeClient(): Promise<void> {
    try {
      const enabled = await this.settingsService.getSetting('easypost_enabled');
      if (!enabled?.value) {
        this.logger.log('EasyPost is disabled in settings');
        return;
      }

      // SECURITY FIX: ONLY use environment variables for API credentials
      // API keys should NEVER be stored in the database
      const apiKey = this.configService.get<string>('EASYPOST_API_KEY');

      if (!apiKey) {
        this.logger.warn(
          'EasyPost API key not configured. Set EASYPOST_API_KEY in environment variables. ' +
            'See documentation: https://docs.easypost.com/docs/authentication'
        );
        return;
      }

      // Validate API key format and match with test mode setting
      const testModeSetting = await this.settingsService.getSetting('easypost_test_mode');
      const isTestMode = testModeSetting?.value ?? true; // Default to test mode for safety

      // Test keys start with EZTK, production keys start with EZAK
      const isTestKey = apiKey.startsWith('EZTK');
      const isProdKey = apiKey.startsWith('EZAK');

      if (!isTestKey && !isProdKey) {
        this.logger.error(
          'Invalid EasyPost API key format. Keys should start with EZTK (test) or EZAK (production)'
        );
        return;
      }

      // Warn if key type doesn't match configured mode
      if (isTestMode && !isTestKey) {
        this.logger.error(
          'Test mode is enabled but API key starts with EZAK (production key). ' +
            'Either disable test mode or use a test key (EZTK)'
        );
        return;
      }

      if (!isTestMode && !isProdKey) {
        this.logger.error(
          'Production mode is enabled but API key starts with EZTK (test key). ' +
            'Either enable test mode or use a production key (EZAK)'
        );
        return;
      }

      this.client = new EasyPost(apiKey);
      this.logger.log(
        `EasyPost client initialized successfully (${isTestMode ? 'test' : 'production'} mode)`
      );
    } catch (error) {
      this.logger.error('Failed to initialize EasyPost client', error);
    }
  }

  getClient(): EasyPostClient {
    if (!this.client) {
      throw new Error('EasyPost client not initialized. Check API key configuration.');
    }
    return this.client;
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  // Helper: Convert tracking status to our enum
  mapTrackingStatus(status: string): string {
    const statusMap: Record<string, string> = {
      unknown: 'UNKNOWN',
      pre_transit: 'PENDING',
      in_transit: 'IN_TRANSIT',
      out_for_delivery: 'OUT_FOR_DELIVERY',
      delivered: 'DELIVERED',
      available_for_pickup: 'OUT_FOR_DELIVERY',
      return_to_sender: 'RETURN_TO_SENDER',
      failure: 'FAILURE',
      cancelled: 'CANCELLED',
      error: 'FAILURE',
    };
    return statusMap[status] || 'UNKNOWN';
  }

  // Helper: Format address for EasyPost
  formatAddress(address: any) {
    return {
      name: address.name || `${address.firstName || ''} ${address.lastName || ''}`.trim(),
      company: address.company,
      street1: address.street1 || address.line1 || address.addressLine1,
      street2: address.street2 || address.line2 || address.addressLine2,
      city: address.city,
      state: address.state || address.province,
      zip: address.zip || address.postalCode || address.zipCode,
      country: address.country || 'US',
      phone: address.phone,
      email: address.email,
    };
  }

  // Helper: Test tracking codes for development
  getTestTrackingCodes() {
    return {
      PRE_TRANSIT: 'EZ1000000001',
      IN_TRANSIT: 'EZ2000000002',
      OUT_FOR_DELIVERY: 'EZ3000000003',
      DELIVERED: 'EZ4000000004',
      RETURN_TO_SENDER: 'EZ5000000005',
      FAILURE: 'EZ6000000006',
      UNKNOWN: 'EZ7000000007',
    };
  }
}
