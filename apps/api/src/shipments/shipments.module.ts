import { Module } from '@nestjs/common';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';
import { DatabaseModule } from '../database/database.module';
import { DhlModule } from '../integrations/dhl/dhl.module';

@Module({
  imports: [DatabaseModule, DhlModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
