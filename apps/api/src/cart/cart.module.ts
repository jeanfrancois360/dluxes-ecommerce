import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [CurrencyModule], // Import CurrencyModule for exchange rate fetching
  providers: [CartService],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}
