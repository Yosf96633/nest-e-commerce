import { NotFoundException } from '@nestjs/common';
import type { CatalogProduct } from './entities/catalog.entity';
import type { ICatalogRepository } from './interfaces/catalog.repository.interface';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  let repository: jest.Mocked<ICatalogRepository>;
  let service: CatalogService;

  const product: CatalogProduct = {
    id: '8b6e6c8e-c67b-4b83-b40c-27bc71af57f0',
    storeId: 'store-id',
    name: 'Product',
    slug: 'product',
    description: null,
    price: '25.00',
    stock: 10,
    images: [],
    status: 'active',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    store: { id: 'store-id', name: 'Store', slug: 'store' },
  };

  beforeEach(() => {
    repository = {
      findActive: jest.fn(),
      findActiveById: jest.fn(),
      findActiveBySlug: jest.fn(),
    };
    service = new CatalogService(repository);
  });

  it('normalizes query options and calculates pagination', async () => {
    repository.findActive.mockResolvedValue({ data: [product], total: 21 });

    const result = await service.list({
      page: 2,
      limit: 10,
      q: '  headphones  ',
      sortBy: 'price',
      order: 'asc',
    });

    expect(repository.findActive).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      query: 'headphones',
      minPrice: undefined,
      maxPrice: undefined,
      storeSlug: undefined,
      sortBy: 'price',
      order: 'asc',
    });
    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
    });
  });

  it('uses the ID repository lookup for UUID identifiers', async () => {
    repository.findActiveById.mockResolvedValue(product);

    await expect(service.get(product.id)).resolves.toBe(product);
    expect(repository.findActiveById).toHaveBeenCalledWith(product.id);
    expect(repository.findActiveBySlug).not.toHaveBeenCalled();
  });

  it('uses the slug repository lookup for non-UUID identifiers', async () => {
    repository.findActiveBySlug.mockResolvedValue(product);

    await expect(service.get('product')).resolves.toBe(product);
    expect(repository.findActiveBySlug).toHaveBeenCalledWith('product');
  });

  it('throws when an active product is not found', async () => {
    repository.findActiveBySlug.mockResolvedValue(undefined);

    await expect(service.get('missing-product')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
