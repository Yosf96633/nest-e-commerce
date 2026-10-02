import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogQueryDto } from './catalog-query.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('products') list(@Query() query: CatalogQueryDto) {
    return this.catalog.list(query);
  }

  @Get('products/:identifier') get(@Param('identifier') identifier: string) {
    return this.catalog.get(identifier);
  }

  @Get('stores/:storeSlug/products') byStore(
    @Param('storeSlug') storeSlug: string,
    @Query() query: CatalogQueryDto,
  ) {
    return this.catalog.list({ ...query, store: storeSlug });
  }
}
