import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { IProductRepository } from './interfaces/product.repository.interface';
import { CreateProductDto } from './dto/create.product.dto';
import { UpdateProductDto } from './dto/update.product.dto';
import {
  CreateProductData,
  Product,
  UpdateProductData,
} from './entities/product.entity';
import { StoreService } from '../store/store.service';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary.service';

@Injectable()
export class ProductService {
  constructor(
    @Inject(IProductRepository)
    private readonly productRepository: IProductRepository,
    private readonly storeService: StoreService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = this.slugify(name) || 'product';
    let slug = baseSlug;
    const existing = await this.productRepository.findBySlug(slug);

    if (existing) {
      slug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;
    }

    return slug;
  }

  private async getOwnedStore(storeId: string, sellerId: string) {
    const store = await this.storeService.getStoreById(storeId);

    if (store.sellerId !== sellerId) {
      throw new ForbiddenException(
        'You are not authorized to access this store',
        'FORBIDDEN_STORE_ACCESS',
      );
    }

    return store;
  }

  private async getOwnedProduct(id: string, sellerId: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(
        `Product with id '${id}' not found`,
        'PRODUCT_NOT_FOUND',
      );
    }

    await this.getOwnedStore(product.storeId, sellerId);

    return product;
  }

  async createProduct(sellerId: string, dto: CreateProductDto): Promise<Product> {
    const store = await this.getOwnedStore(dto.storeId, sellerId);
    const slug = await this.generateUniqueSlug(dto.name);
    const images = dto.images ?? [];
    const status = dto.status ?? 'draft';

    if (status === 'active' && images.length < 4) {
      throw new BadRequestException(
        'At least 4 images are required to activate a product',
        'PRODUCT_IMAGES_REQUIRED',
      );
    }

    const newProduct: CreateProductData = {
      storeId: store.id,
      name: dto.name,
      slug,
      description: dto.description ?? null,
      price: dto.price.toFixed(2),
      stock: dto.stock ?? 0,
      images,
      status,
    };

    return this.productRepository.createProduct(newProduct);
  }

  async getMyProducts(sellerId: string): Promise<Product[]> {
    const stores = await this.storeService.getMyStores(sellerId);
    const productsByStore = await Promise.all(
      stores.map((store) => this.productRepository.findByStoreId(store.id)),
    );
    return productsByStore.flat();
  }

  async getProductById(id: string, sellerId: string): Promise<Product> {
    return this.getOwnedProduct(id, sellerId);
  }

  async getProductBySlug(slug: string, sellerId: string): Promise<Product> {
    const product = await this.productRepository.findBySlug(slug);

    if (!product) {
      throw new NotFoundException(
        `Product with slug '${slug}' not found`,
        'PRODUCT_NOT_FOUND',
      );
    }

    await this.getOwnedStore(product.storeId, sellerId);

    return product;
  }

  async updateProduct(
    id: string,
    sellerId: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.getOwnedProduct(id, sellerId);
    const nextImages = dto.images ?? product.images;
    const nextStatus = dto.status ?? product.status;

    if (nextStatus === 'active' && nextImages.length < 4) {
      throw new BadRequestException(
        'At least 4 images are required to activate a product',
        'PRODUCT_IMAGES_REQUIRED',
      );
    }

    const updateData: UpdateProductData = {
      ...(dto.name && dto.name !== product.name
        ? { name: dto.name, slug: await this.generateUniqueSlug(dto.name) }
        : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.price !== undefined ? { price: dto.price.toFixed(2) } : {}),
      ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
      ...(dto.images !== undefined ? { images: dto.images } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      updatedAt: new Date(),
    };

    if (dto.images?.length && product.images.length) {
      await Promise.all(
        product.images.map((image) => this.cloudinaryService.deleteImage(image.publicId).catch(() => undefined)),
      );
    }

    return this.productRepository.updateProduct(id, updateData);
  }

  async deleteProduct(id: string, sellerId: string): Promise<{ message: string }> {
    const product = await this.getOwnedProduct(id, sellerId);

    await Promise.all(
      product.images.map((image) => this.cloudinaryService.deleteImage(image.publicId).catch(() => undefined)),
    );
    await this.productRepository.deleteProduct(id);

    return { message: 'Product deleted successfully' };
  }
}
