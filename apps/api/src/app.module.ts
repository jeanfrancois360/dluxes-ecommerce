import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { CollectionsModule } from './collections/collections.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentModule } from './payment/payment.module';
import { ReviewsModule } from './reviews/reviews.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { AdminModule } from './admin/admin.module';
import { UploadModule } from './upload/upload.module';
import { SearchModule } from './search/search.module';
import { WebsocketModule } from './websocket/websocket.module';
import { StoresModule } from './stores/stores.module';
import { SellerModule } from './seller/seller.module';
import { CommissionModule } from './commission/commission.module';
import { InventoryModule } from './inventory/inventory.module';
import { AdvertisementModule } from './advertisements/advertisement.module';
import { CurrencyModule } from './currency/currency.module';
import { EscrowModule } from './escrow/escrow.module';
import { SettingsModule } from './settings/settings.module';
import { ShippingModule } from './shipping/shipping.module';
import { PayoutModule } from './payout/payout.module';
import { DeliveryProviderModule } from './delivery-provider/delivery-provider.module';
import { DeliveryModule } from './delivery/delivery.module';
import { DeliveryPartnerModule } from './delivery-partner/delivery-partner.module';
import { SupabaseModule } from './supabase/supabase.module';
// import { QueueModule } from './queue/queue.module'; // Commented out - requires Redis setup

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SupabaseModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests
      },
    ]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    CollectionsModule,
    CartModule,
    OrdersModule,
    PaymentModule,
    ReviewsModule,
    WishlistModule,
    AdminModule,
    UploadModule,
    SearchModule,
    WebsocketModule,
    StoresModule,
    SellerModule,
    CommissionModule,
    InventoryModule,
    AdvertisementModule,
    CurrencyModule,
    EscrowModule,
    SettingsModule,
    ShippingModule,
    PayoutModule,
    DeliveryProviderModule,
    DeliveryModule,
    DeliveryPartnerModule,
    // QueueModule, // Commented out - requires Redis setup
  ],
})
export class AppModule {}
