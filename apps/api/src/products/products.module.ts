import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { InventoryService } from './inventory.service';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [DatabaseModule, EmailModule],
  providers: [ProductsService, InventoryService],
  controllers: [ProductsController],
  exports: [ProductsService, InventoryService],
})
export class ProductsModule {}
