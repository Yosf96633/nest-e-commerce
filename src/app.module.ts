import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CloudinaryModule } from './infrastructure/cloudinary/cloudinary.module';
import { ConfigModule } from '@nestjs/config';
import { ResendModule } from './infrastructure/resend/resend.module';
import { ApplicationModule } from './modules/application/application.module';
import { AdminModule } from './modules/admin/admin.module';
import { SellerModule } from './modules/seller/seller.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CartModule } from './modules/cart/cart.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { RiderModule } from './modules/rider/rider.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    AuthModule,
    CloudinaryModule,
    ResendModule,
    ApplicationModule,
    AdminModule,
    SellerModule,
    CatalogModule,
    CartModule,
    ReviewsModule,
    RiderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
