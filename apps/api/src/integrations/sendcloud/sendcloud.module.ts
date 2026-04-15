import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SendcloudService } from './sendcloud.service';
import { SendcloudController } from './sendcloud.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [SendcloudController],
  providers: [SendcloudService],
  exports: [SendcloudService],
})
export class SendcloudModule {}
