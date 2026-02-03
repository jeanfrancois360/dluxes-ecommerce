import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ShippingTaxService } from './shipping-tax.service';
import { DatabaseModule } from '../database/database.module';
import { CurrencyModule } from '../currency/currency.module';
import { CartModule } from '../cart/cart.module';
import { EmailModule } from '../email/email.module';
import { SettingsModule } from '../settings/settings.module';
import { PaymentModule } from '../payment/payment.module';
import { DhlModule } from '../integrations/dhl/dhl.module';
import { ShippingModule } from '../shipping/shipping.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => CurrencyModule),
    CartModule,
    EmailModule,
    SettingsModule,
    PaymentModule,
    DhlModule,
    ShippingModule,
  ],
  providers: [OrdersService, ShippingTaxService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
