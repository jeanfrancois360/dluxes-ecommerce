import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';
import { GelatoService } from './gelato.service';
import { GelatoProductsService } from './gelato-products.service';
import { GelatoOrdersService } from './gelato-orders.service';
import { GelatoController } from './gelato.controller';
import { GelatoWebhookController } from './gelato-webhook.controller';

@Module({
  imports: [ConfigModule, DatabaseModule, SettingsModule],
  controllers: [GelatoController, GelatoWebhookController],
  providers: [GelatoService, GelatoProductsService, GelatoOrdersService],
  exports: [GelatoService, GelatoProductsService, GelatoOrdersService],
})
export class GelatoModule {}
