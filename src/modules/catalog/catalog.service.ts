import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { isUUID } from 'class-validator';
import { DatabaseService } from '@/infrastructure/database/database.service';
import { products } from '@/infrastructure/database/schema/product.schema';
import { stores } from '@/infrastructure/database/schema/store.schema';
import { CatalogQueryDto } from './catalog-query.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly db: DatabaseService) {}

  async list(query: CatalogQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const conditions = [eq(products.status, 'active'), eq(stores.status, 'active')];
    if (query.q?.trim()) conditions.push(or(ilike(products.name, `%${query.q.trim()}%`), ilike(products.description, `%${query.q.trim()}%`))!);
    if (query.minPrice !== undefined) conditions.push(gte(products.price, query.minPrice.toFixed(2)));
    if (query.maxPrice !== undefined) conditions.push(lte(products.price, query.maxPrice.toFixed(2)));
    if (query.store) conditions.push(eq(stores.slug, query.store));
    const where = and(...conditions);
    const sortColumn = query.sortBy === 'price' ? products.price : query.sortBy === 'name' ? products.name : products.createdAt;
    const direction = query.order === 'asc' ? asc : desc;
    const [items, [count]] = await Promise.all([
      this.db.client.select({ product: products, store: { id: stores.id, name: stores.name, slug: stores.slug } })
        .from(products).innerJoin(stores, eq(products.storeId, stores.id)).where(where)
        .orderBy(direction(sortColumn)).limit(limit).offset((page - 1) * limit),
      this.db.client.select({ count: sql<number>`count(*)::int` }).from(products)
        .innerJoin(stores, eq(products.storeId, stores.id)).where(where),
    ]);
    return { data: items.map(({ product, store }) => ({ ...product, store })), pagination: { page, limit, total: count.count, totalPages: Math.ceil(count.count / limit) } };
  }

  async get(identifier: string) {
    const condition = isUUID(identifier) ? eq(products.id, identifier) : eq(products.slug, identifier);
    const [record] = await this.db.client.select({ product: products, store: { id: stores.id, name: stores.name, slug: stores.slug } })
      .from(products).innerJoin(stores, eq(products.storeId, stores.id))
      .where(and(condition, eq(products.status, 'active'), eq(stores.status, 'active'))).limit(1);
    if (!record) throw new NotFoundException('Product not found', 'PRODUCT_NOT_FOUND');
    return { ...record.product, store: record.store };
  }
}
