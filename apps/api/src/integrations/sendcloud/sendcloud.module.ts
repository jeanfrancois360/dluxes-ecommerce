import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SendcloudService } from './sendcloud.service';
import { SendcloudController } from './sendcloud.controller';

@Module({
  imports: [ConfigModule],
  controllers: [SendcloudController],
  providers: [SendcloudService],
  exports: [SendcloudService],
})
export class SendcloudModule {}
