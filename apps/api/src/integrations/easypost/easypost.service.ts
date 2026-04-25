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
      // Check DB setting for enabled flag (non-fatal if missing)
      let isEnabled = true;
      try {
        const enabled = await this.settingsService.getSetting('easypost_enabled');
        isEnabled = enabled?.value !== false && enabled?.value !== 'false';
      } catch {
        // Setting not found — default to enabled
      }

      if (!isEnabled) {
        this.logger.log('EasyPost is disabled in settings');
        return;
      }

      // SECURITY FIX: ONLY use environment variables for API credentials
      const apiKey = this.configService.get<string>('EASYPOST_API_KEY');

      if (!apiKey) {
        this.logger.warn(
          'EasyPost API key not configured. Set EASYPOST_API_KEY in environment variables.'
        );
        return;
      }

      // Determine mode from env first, fall back to DB
      const envTestMode = this.configService.get<string>('EASYPOST_TEST_MODE');
      const isTestMode = envTestMode !== undefined ? envTestMode !== 'false' : true;

      const isTestKey = apiKey.startsWith('EZTK');
      const isProdKey = apiKey.startsWith('EZAK');

      if (!isTestKey && !isProdKey) {
        this.logger.error(
          'Invalid EasyPost API key format. Keys should start with EZTK (test) or EZAK (production)'
        );
        return;
      }

      // Log warning if key type doesn't match mode but still initialize
      if (isTestMode && isProdKey) {
        this.logger.warn(
          'EASYPOST_TEST_MODE=true but production key (EZAK) detected — initializing in production mode'
        );
      } else if (!isTestMode && isTestKey) {
        this.logger.warn(
          'EASYPOST_TEST_MODE=false but test key (EZTK) detected — initializing in test mode'
        );
      }

      this.client = new EasyPost(apiKey);
      this.logger.log(
        `EasyPost client initialized successfully (${isProdKey ? 'production' : 'test'} mode)`
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
