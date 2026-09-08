import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../database.service';
import { products, Product, NewProduct } from '../../schema';
import { IProductRepository } from '@/modules/seller/product/interfaces/product.repository.interface';

@Injectable()
export class DrizzleProductRepository implements IProductRepository {
  constructor(private readonly db: DatabaseService) {}

  async createProduct(product: NewProduct): Promise<Product> {
    const result = await this.db.client.insert(products).values(product).returning();
    return result[0];
  }

  async findById(id: string): Promise<Product | undefined> {
    const result = await this.db.client
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    return result[0];
  }

  async findBySlug(slug: string): Promise<Product | undefined> {
    const result = await this.db.client
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    return result[0];
  }

  async findByStoreId(storeId: string): Promise<Product[]> {
    return this.db.client
      .select()
      .from(products)
      .where(eq(products.storeId, storeId));
  }

  async updateProduct(id: string, data: Partial<NewProduct>): Promise<Product> {
    const result = await this.db.client
      .update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<void> {
    await this.db.client.delete(products).where(eq(products.id, id));
  }
}
