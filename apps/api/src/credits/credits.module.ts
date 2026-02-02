import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CreditsService } from './credits.service';
import { CreditsController } from './credits.controller';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [DatabaseModule, SettingsModule, PaymentModule, ConfigModule],
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}
