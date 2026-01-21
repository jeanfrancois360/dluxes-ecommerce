import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { DatabaseModule } from '../database/database.module';
import { CurrencyModule } from '../currency/currency.module';
import { CartModule } from '../cart/cart.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => CurrencyModule),
    CartModule,
    EmailModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
