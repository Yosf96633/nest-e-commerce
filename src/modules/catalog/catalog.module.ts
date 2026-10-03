import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { DrizzleCatalogRepository } from '@/infrastructure/database/repositories/catalog/drizzle-catalog.repository';
import { ICatalogRepository } from './interfaces/catalog.repository.interface';

@Module({
  controllers: [CatalogController],
  providers: [
    CatalogService,
    {
      provide: ICatalogRepository,
      useClass: DrizzleCatalogRepository,
    },
  ],
})
export class CatalogModule {}
