import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EasyshipService } from './easyship.service';
import { EasyshipController } from './easyship.controller';
import { EasyshipWebhookController } from './easyship-webhook.controller';
import { DatabaseModule } from '../../database/database.module';
import { EmailModule } from '../../email/email.module';

@Module({
  imports: [ConfigModule, DatabaseModule, EmailModule],
  controllers: [EasyshipController, EasyshipWebhookController],
  providers: [EasyshipService],
  exports: [EasyshipService],
})
export class EasyshipModule {}
