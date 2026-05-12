import { Module } from '@nestjs/common';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';
import { DatabaseModule } from '../database/database.module';
import { DhlModule } from '../integrations/dhl/dhl.module';
import { SendcloudModule } from '../integrations/sendcloud/sendcloud.module';
import { EasyshipModule } from '../integrations/easyship/easyship.module';

@Module({
  imports: [DatabaseModule, DhlModule, SendcloudModule, EasyshipModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
