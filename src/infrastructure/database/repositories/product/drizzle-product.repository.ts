import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../database.service';
import { products } from '../../schema';
import { IProductRepository } from '@/modules/seller/product/interfaces/product.repository.interface';
import {
  CreateProductData,
  Product,
  UpdateProductData,
} from '@/modules/seller/product/entities/product.entity';

@Injectable()
export class DrizzleProductRepository implements IProductRepository {
  constructor(private readonly db: DatabaseService) {}

  async createProduct(product: CreateProductData): Promise<Product> {
    const result = await this.db.client.insert(products).values(product).returning();
    return this.toEntity(result[0]);
  }

  async findById(id: string): Promise<Product | undefined> {
    const result = await this.db.client
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    return result[0] ? this.toEntity(result[0]) : undefined;
  }

  async findBySlug(slug: string): Promise<Product | undefined> {
    const result = await this.db.client
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    return result[0] ? this.toEntity(result[0]) : undefined;
  }

  async findByStoreId(storeId: string): Promise<Product[]> {
    const result = await this.db.client
      .select()
      .from(products)
      .where(eq(products.storeId, storeId));
    return result.map((product) => this.toEntity(product));
  }

  async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
    const result = await this.db.client
      .update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();
    return this.toEntity(result[0]);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.db.client.delete(products).where(eq(products.id, id));
  }

  private toEntity(record: typeof products.$inferSelect): Product {
    return {
      id: record.id,
      storeId: record.storeId,
      name: record.name,
      slug: record.slug,
      description: record.description,
      price: record.price,
      stock: record.stock,
      images: record.images,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
