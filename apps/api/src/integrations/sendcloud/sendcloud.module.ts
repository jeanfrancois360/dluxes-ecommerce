import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SendcloudService } from './sendcloud.service';
import { SendcloudController } from './sendcloud.controller';
import { SendcloudWebhookController } from './sendcloud-webhook.controller';
import { DatabaseModule } from '../../database/database.module';
import { EmailModule } from '../../email/email.module';

@Module({
  imports: [ConfigModule, DatabaseModule, EmailModule],
  controllers: [SendcloudController, SendcloudWebhookController],
  providers: [SendcloudService],
  exports: [SendcloudService],
})
export class SendcloudModule {}
