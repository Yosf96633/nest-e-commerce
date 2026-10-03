import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import type {
  CatalogListOptions,
  CatalogProduct,
  CatalogProductsResult,
} from '@/modules/catalog/entities/catalog.entity';
import { ICatalogRepository } from '@/modules/catalog/interfaces/catalog.repository.interface';
import { DatabaseService } from '../../database.service';
import { products, stores } from '../../schema';

@Injectable()
export class DrizzleCatalogRepository implements ICatalogRepository {
  constructor(private readonly db: DatabaseService) {}

  async findActive(
    options: CatalogListOptions,
  ): Promise<CatalogProductsResult> {
    const conditions = [
      eq(products.status, 'active'),
      eq(stores.status, 'active'),
    ];

    if (options.query) {
      conditions.push(
        or(
          ilike(products.name, `%${options.query}%`),
          ilike(products.description, `%${options.query}%`),
        )!,
      );
    }
    if (options.minPrice !== undefined) {
      conditions.push(gte(products.price, options.minPrice.toFixed(2)));
    }
    if (options.maxPrice !== undefined) {
      conditions.push(lte(products.price, options.maxPrice.toFixed(2)));
    }
    if (options.storeSlug) {
      conditions.push(eq(stores.slug, options.storeSlug));
    }

    const where = and(...conditions);
    const sortColumn = {
      createdAt: products.createdAt,
      price: products.price,
      name: products.name,
    }[options.sortBy];
    const direction = options.order === 'asc' ? asc : desc;

    const [rows, [count]] = await Promise.all([
      this.db.client
        .select({
          product: products,
          store: { id: stores.id, name: stores.name, slug: stores.slug },
        })
        .from(products)
        .innerJoin(stores, eq(products.storeId, stores.id))
        .where(where)
        .orderBy(direction(sortColumn))
        .limit(options.limit)
        .offset((options.page - 1) * options.limit),
      this.db.client
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .innerJoin(stores, eq(products.storeId, stores.id))
        .where(where),
    ]);

    return {
      data: rows.map(({ product, store }): CatalogProduct => ({
        ...product,
        store,
      })),
      total: count.count,
    };
  }

  findActiveById(id: string): Promise<CatalogProduct | undefined> {
    return this.findOne(eq(products.id, id));
  }

  findActiveBySlug(slug: string): Promise<CatalogProduct | undefined> {
    return this.findOne(eq(products.slug, slug));
  }

  private async findOne(
    identifierCondition: ReturnType<typeof eq>,
  ): Promise<CatalogProduct | undefined> {
    const [record] = await this.db.client
      .select({
        product: products,
        store: { id: stores.id, name: stores.name, slug: stores.slug },
      })
      .from(products)
      .innerJoin(stores, eq(products.storeId, stores.id))
      .where(
        and(
          identifierCondition,
          eq(products.status, 'active'),
          eq(stores.status, 'active'),
        ),
      )
      .limit(1);

    return record ? { ...record.product, store: record.store } : undefined;
  }
}
