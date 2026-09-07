import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { IStoreRepository } from './interfaces/store.repository.interface';
import { CreateStoreDto } from './dto/create.store.dto';
import { UpdateStoreDto } from './dto/update.store.dto';
import { Store, NewStore } from '@/infrastructure/database/schema';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary.service';

@Injectable()
export class StoreService {
  constructor(
    @Inject(IStoreRepository)
    private readonly storeRepository: IStoreRepository,
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
    const baseSlug = this.slugify(name) || 'store';
    let slug = baseSlug;
    const existing = await this.storeRepository.findBySlug(slug);

    if (existing) {
      const randomSuffix = crypto.randomBytes(3).toString('hex');
      slug = `${baseSlug}-${randomSuffix}`;
    }

    return slug;
  }

  async createStore(sellerId: string, dto: CreateStoreDto): Promise<Store> {
    const slug = await this.generateUniqueSlug(dto.name);

    const newStore: NewStore = {
      sellerId,
      name: dto.name,
      slug,
      description: dto.description ?? null,
      profileImageUrl: dto.profileImageUrl ?? null,
      profileImagePublicId: dto.profileImagePublicId ?? null,
      coverImageUrl: dto.coverImageUrl ?? null,
      coverImagePublicId: dto.coverImagePublicId ?? null,
    };

    return this.storeRepository.createStore(newStore);
  }

  async getMyStores(sellerId: string): Promise<Store[]> {
    return this.storeRepository.findBySellerId(sellerId);
  }

  async getStoresBySellerId(sellerId: string): Promise<Store[]> {
    return this.storeRepository.findBySellerId(sellerId);
  }

  async getStoreBySlug(slug: string): Promise<Store> {
    const store = await this.storeRepository.findBySlug(slug);
    if (!store) {
      throw new NotFoundException(
        `Store with slug '${slug}' not found`,
        'STORE_NOT_FOUND',
      );
    }
    return store;
  }

  async getStoreById(id: string): Promise<Store> {
    const store = await this.storeRepository.findById(id);
    if (!store) {
      throw new NotFoundException(
        `Store with id '${id}' not found`,
        'STORE_NOT_FOUND',
      );
    }
    return store;
  }

  async updateStore(
    storeId: string,
    sellerId: string,
    dto: UpdateStoreDto,
  ): Promise<Store> {
    const store = await this.getStoreById(storeId);

    // Verify ownership
    if (store.sellerId !== sellerId) {
      throw new ForbiddenException(
        'You are not authorized to update this store',
        'FORBIDDEN_STORE_ACCESS',
      );
    }

    // If new profileImage was uploaded, remove previous one from Cloudinary
    if (dto.profileImageUrl && store.profileImagePublicId) {
      try {
        await this.cloudinaryService.deleteImage(store.profileImagePublicId);
      } catch (err) {
        // Continue even if Cloudinary cleanup failed
      }
    }

    // If new coverImage was uploaded, remove previous one from Cloudinary
    if (dto.coverImageUrl && store.coverImagePublicId) {
      try {
        await this.cloudinaryService.deleteImage(store.coverImagePublicId);
      } catch (err) {
        // Continue even if Cloudinary cleanup failed
      }
    }

    // If name changed, generate a new unique slug
    let newSlug: string | undefined;
    if (dto.name && dto.name !== store.name) {
      newSlug = await this.generateUniqueSlug(dto.name);
    }

    const updateData: Partial<NewStore> = {
      ...(dto.name ? { name: dto.name, slug: newSlug } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.profileImageUrl
        ? {
            profileImageUrl: dto.profileImageUrl,
            profileImagePublicId: dto.profileImagePublicId,
          }
        : {}),
      ...(dto.coverImageUrl
        ? {
            coverImageUrl: dto.coverImageUrl,
            coverImagePublicId: dto.coverImagePublicId,
          }
        : {}),
      updatedAt: new Date(),
    };

    return this.storeRepository.updateStore(storeId, updateData);
  }

  async deleteStore(
    storeId: string,
    sellerId: string,
  ): Promise<{ message: string }> {
    const store = await this.getStoreById(storeId);

    // Verify ownership
    if (store.sellerId !== sellerId) {
      throw new ForbiddenException(
        'You are not authorized to delete this store',
        'FORBIDDEN_STORE_ACCESS',
      );
    }

    // Delete profile and cover images from Cloudinary if they exist
    if (store.profileImagePublicId) {
      try {
        await this.cloudinaryService.deleteImage(store.profileImagePublicId);
      } catch (err) {
        // Ignore deletion errors
      }
    }

    if (store.coverImagePublicId) {
      try {
        await this.cloudinaryService.deleteImage(store.coverImagePublicId);
      } catch (err) {
        // Ignore deletion errors
      }
    }

    await this.storeRepository.deleteStore(storeId);

    return { message: 'Store deleted successfully' };
  }
}
