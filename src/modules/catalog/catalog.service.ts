import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { CatalogListOptions } from './entities/catalog.entity';
import { ICatalogRepository } from './interfaces/catalog.repository.interface';
import { CatalogQueryDto } from './catalog-query.dto';

@Injectable()
export class CatalogService {
  constructor(
    @Inject(ICatalogRepository)
    private readonly catalogRepository: ICatalogRepository,
  ) {}

  async list(query: CatalogQueryDto) {
    const options = this.toListOptions(query);
    const result = await this.catalogRepository.findActive(options);

    return {
      data: result.data,
      pagination: {
        page: options.page,
        limit: options.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / options.limit),
      },
    };
  }

  async get(identifier: string) {
    const product = isUUID(identifier)
      ? await this.catalogRepository.findActiveById(identifier)
      : await this.catalogRepository.findActiveBySlug(identifier);

    if (!product) {
      throw new NotFoundException('Product not found', 'PRODUCT_NOT_FOUND');
    }

    return product;
  }

  private toListOptions(query: CatalogQueryDto): CatalogListOptions {
    return {
      page: query.page || 1,
      limit: query.limit || 20,
      query: query.q?.trim() || undefined,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      storeSlug: query.store,
      sortBy: query.sortBy || 'createdAt',
      order: query.order || 'desc',
    };
  }
}
