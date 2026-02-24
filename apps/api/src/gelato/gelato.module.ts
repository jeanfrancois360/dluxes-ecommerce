import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';
import { GelatoService } from './gelato.service';
import { GelatoProductsService } from './gelato-products.service';
import { GelatoOrdersService } from './gelato-orders.service';
import { GelatoController } from './gelato.controller';
import { GelatoWebhookController } from './gelato-webhook.controller';
import { SellerGelatoSettingsService } from './seller-gelato-settings.service';
import { SellerGelatoSettingsController } from './seller-gelato-settings.controller';
import { EncryptionService } from '../common/services/encryption.service';

/**
 * Gelato Module
 *
 * v2.9.0 - Refactored for per-seller Gelato integration
 *
 * Key Changes:
 * - Added SellerGelatoSettingsService for per-seller credentials management
 * - Added EncryptionService for secure credential storage
 * - GelatoService now supports multi-tenant credential loading with fallback
 * - Webhook controller supports both platform and seller-specific endpoints
 */
@Module({
  imports: [ConfigModule, DatabaseModule, SettingsModule],
  controllers: [
    GelatoController,
    GelatoWebhookController,
    SellerGelatoSettingsController, // v2.9.0: Seller Gelato settings management
  ],
  providers: [
    GelatoService,
    GelatoProductsService,
    GelatoOrdersService,
    SellerGelatoSettingsService, // v2.9.0: Per-seller settings
    EncryptionService, // v2.9.0: Credential encryption
  ],
  exports: [
    GelatoService,
    GelatoProductsService,
    GelatoOrdersService,
    SellerGelatoSettingsService, // Export for use in other modules
  ],
})
export class GelatoModule implements OnModuleInit {
  constructor(
    private readonly gelatoService: GelatoService,
    private readonly sellerSettingsService: SellerGelatoSettingsService
  ) {}

  /**
   * Initialize module - set seller settings service in GelatoService
   * Done this way to avoid circular dependency between services
   */
  onModuleInit() {
    this.gelatoService.setSellerSettingsService(this.sellerSettingsService);
  }
}
