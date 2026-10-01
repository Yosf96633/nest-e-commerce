import { ProductService } from './product.service';
import type { IProductRepository } from './interfaces/product.repository.interface';
import type { ProductImage } from './entities/product.entity';
import { StoreService } from '../store/store.service';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary.service';

describe('ProductService', () => {
  const findBySlug = jest.fn();
  const findById = jest.fn();
  const createProduct = jest.fn();
  const updateProduct = jest.fn();
  const getStoreById = jest.fn();
  const productRepository = {
    findBySlug,
    findById,
    createProduct,
    updateProduct,
  } as unknown as IProductRepository;
  const storeService = { getStoreById } as unknown as StoreService;
  const cloudinaryService = {} as CloudinaryService;
  const service = new ProductService(
    productRepository,
    storeService,
    cloudinaryService,
  );

  const images = (count: number): ProductImage[] =>
    Array.from({ length: count }, (_, index) => ({
      url: `https://example.com/product-${index}.jpg`,
      publicId: `product-${index}`,
      displayOrder: index,
    }));

  beforeEach(() => {
    jest.clearAllMocks();
    findBySlug.mockResolvedValue(undefined);
    getStoreById.mockResolvedValue({
      id: '9bea2767-f526-4ec4-9c67-1c65ccf6fba2',
      sellerId: '20243823-e478-46ab-a612-09f2c116b11e',
    });
  });

  it('rejects product creation with fewer than four images', async () => {
    await expect(
      service.createProduct('20243823-e478-46ab-a612-09f2c116b11e', {
        storeId: '9bea2767-f526-4ec4-9c67-1c65ccf6fba2',
        name: 'Wireless Headphones',
        price: 129.99,
        images: images(3),
      }),
    ).rejects.toThrow('At least 4 images are required to create a product');

    expect(createProduct).not.toHaveBeenCalled();
  });

  it('creates a draft product when four images are provided', async () => {
    const productImages = images(4);
    createProduct.mockResolvedValue({
      id: 'd109f733-afdd-4e82-bbc4-42d8336af198',
      storeId: '9bea2767-f526-4ec4-9c67-1c65ccf6fba2',
      name: 'Wireless Headphones',
      slug: 'wireless-headphones',
      description: null,
      price: '129.99',
      stock: 0,
      images: productImages,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.createProduct('20243823-e478-46ab-a612-09f2c116b11e', {
      storeId: '9bea2767-f526-4ec4-9c67-1c65ccf6fba2',
      name: 'Wireless Headphones',
      price: 129.99,
      images: productImages,
    });

    expect(createProduct).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'draft', images: productImages }),
    );
  });

  it('activates a product using its stored images without new uploads', async () => {
    const storedProduct = {
      id: 'd109f733-afdd-4e82-bbc4-42d8336af198',
      storeId: '9bea2767-f526-4ec4-9c67-1c65ccf6fba2',
      name: 'Wireless Headphones',
      slug: 'wireless-headphones',
      description: null,
      price: '129.99',
      stock: 10,
      images: images(4),
      status: 'draft' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    findById.mockResolvedValue(storedProduct);
    updateProduct.mockResolvedValue({ ...storedProduct, status: 'active' });

    await service.updateProduct(
      storedProduct.id,
      '20243823-e478-46ab-a612-09f2c116b11e',
      { status: 'active' },
    );

    expect(updateProduct).toHaveBeenCalledWith(
      storedProduct.id,
      expect.objectContaining({ status: 'active' }),
    );
  });
});
