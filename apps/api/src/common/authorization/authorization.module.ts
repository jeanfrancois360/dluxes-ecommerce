import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { OrderOwnershipGuard } from './order-ownership.guard';

@Module({
  imports: [DatabaseModule],
  providers: [OrderOwnershipGuard],
  exports: [OrderOwnershipGuard],
})
export class AuthorizationModule {}
