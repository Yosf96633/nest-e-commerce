import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [DatabaseModule, AuthModule, CloudinaryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
