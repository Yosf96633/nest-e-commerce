import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CloudinaryModule } from './infrastructure/cloudinary/cloudinary.module';
import { ConfigModule } from '@nestjs/config';
import { ResendModule } from './infrastructure/resend/resend.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CloudinaryModule,
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ResendModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
