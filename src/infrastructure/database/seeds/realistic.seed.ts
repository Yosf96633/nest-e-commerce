import { neon } from '@neondatabase/serverless';
import * as bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import { like } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { promises as fs } from 'fs';
import path from 'path';
import type { Role } from '@/common/types/role.type';
import type {
  ProductImage,
  ProductStatus,
} from '@/modules/seller/product/entities/product.entity';
import * as schema from '../schema';
import { products, stores, userRoles, users } from '../schema';

const SEED_EMAIL_DOMAIN = 'seed.local';
const CLOUDINARY_SEED_ROOT = 'e-com/seeds/realistic-v1';
const DEFAULT_ASSET_DIRECTORY = path.resolve(
  process.cwd(),
  'src/infrastructure/database/seeds/product-images',
);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

interface SeedConfig {
  sellers: number;
  customers: number;
  maxStoresPerSeller: number;
  uploadConcurrency: number;
  password: string;
  assetDirectory: string;
}

interface ProductDefinition {
  name: string;
  description: string;
  price: number;
  stock: number;
  status: ProductStatus;
}

interface ProductFixture extends ProductDefinition {
  key: string;
  imagePaths: string[];
}

function positiveInteger(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function readConfig(): SeedConfig {
  return {
    sellers: positiveInteger('SEED_SELLERS', 2),
    customers: positiveInteger('SEED_CUSTOMERS', 20),
    maxStoresPerSeller: positiveInteger('SEED_MAX_STORES_PER_SELLER', 2),
    uploadConcurrency: positiveInteger('SEED_UPLOAD_CONCURRENCY', 4),
    password: process.env.SEED_USER_PASSWORD ?? 'SeedUser123!',
    assetDirectory: path.resolve(
      process.env.SEED_PRODUCT_IMAGE_DIR ?? DEFAULT_ASSET_DIRECTORY,
    ),
  };
}

function assertSafeEnvironment(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The realistic seed is disabled when NODE_ENV=production');
  }
}

function configureCloudinary(): void {
  cloudinary.config({
    cloud_name: requiredEnvironment('CLOUDINARY_CLOUD_NAME'),
    api_key: requiredEnvironment('CLOUDINARY_API_KEY'),
    api_secret: requiredEnvironment('CLOUDINARY_API_SECRET'),
    secure: true,
  });
}

function parseProductDefinition(
  value: unknown,
  definitionPath: string,
): ProductDefinition {
  if (!value || typeof value !== 'object') {
    throw new Error(`${definitionPath} must contain a JSON object`);
  }

  const definition = value as Record<string, unknown>;
  const validStatuses: ProductStatus[] = ['draft', 'active', 'inactive'];
  if (
    typeof definition.name !== 'string' ||
    definition.name.trim().length < 2 ||
    typeof definition.description !== 'string' ||
    typeof definition.price !== 'number' ||
    !Number.isFinite(definition.price) ||
    definition.price < 0 ||
    Math.abs(definition.price * 100 - Math.round(definition.price * 100)) >
      0.000001 ||
    typeof definition.stock !== 'number' ||
    !Number.isSafeInteger(definition.stock) ||
    definition.stock < 0 ||
    typeof definition.status !== 'string' ||
    !validStatuses.includes(definition.status as ProductStatus)
  ) {
    throw new Error(
      `${definitionPath} requires valid name, description, non-negative price, ` +
        'non-negative integer stock, and status (draft, active, or inactive)',
    );
  }

  return {
    name: definition.name.trim(),
    description: definition.description.trim(),
    price: definition.price,
    stock: definition.stock,
    status: definition.status as ProductStatus,
  };
}

async function findProductFixtures(
  directory: string,
  requireImages = true,
): Promise<ProductFixture[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const productDirectories = entries
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name));

  if (!productDirectories.length) {
    throw new Error(
      `No product directories found in ${directory}. See PROMPTS.md there.`,
    );
  }

  const fixtures: ProductFixture[] = [];
  const missingImages: string[] = [];
  for (const entry of productDirectories) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name)) {
      throw new Error(
        `Product directory name must be a URL-safe slug: ${entry.name}`,
      );
    }
    const productDirectory = path.join(directory, entry.name);
    const definitionPath = path.join(productDirectory, 'product.json');
    let definitionText: string;
    try {
      definitionText = await fs.readFile(definitionPath, 'utf8');
    } catch {
      throw new Error(`Missing product definition: ${definitionPath}`);
    }

    let parsedDefinition: unknown;
    try {
      parsedDefinition = JSON.parse(definitionText);
    } catch {
      throw new Error(`Invalid JSON in ${definitionPath}`);
    }
    const definition = parseProductDefinition(parsedDefinition, definitionPath);
    const productEntries = await fs.readdir(productDirectory, {
      withFileTypes: true,
    });
    const imagePaths = productEntries
      .filter(
        (productEntry) =>
          productEntry.isFile() &&
          IMAGE_EXTENSIONS.has(path.extname(productEntry.name).toLowerCase()),
      )
      .map((productEntry) => path.join(productDirectory, productEntry.name))
      .sort();

    if (imagePaths.length !== 4) {
      missingImages.push(`${entry.name} (${imagePaths.length}/4 images)`);
    }

    fixtures.push({
      key: entry.name,
      ...definition,
      imagePaths,
    });
  }

  if (requireImages && missingImages.length) {
    throw new Error(
      `Every product directory needs exactly four images. Check: ${missingImages.join(', ')}`,
    );
  }

  return fixtures;
}

async function retry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 750));
      }
    }
  }
  throw lastError;
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  let firstError: unknown;

  async function worker(): Promise<void> {
    while (nextIndex < values.length && firstError === undefined) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        results[index] = await mapper(values[index], index);
      } catch (error) {
        firstError = error;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () =>
      worker(),
    ),
  );
  if (firstError !== undefined) {
    throw firstError instanceof Error
      ? firstError
      : new Error('Cloudinary image upload failed');
  }
  return results;
}

async function uploadProductImages(
  fixtureImages: string[],
  productSlug: string,
  concurrency: number,
): Promise<ProductImage[]> {
  const folder = `${CLOUDINARY_SEED_ROOT}/products/${productSlug}`;
  const uploadedPublicIds = fixtureImages.map(
    (_, index) => `${folder}/angle-${index + 1}`,
  );

  try {
    return await mapWithConcurrency(
      fixtureImages,
      concurrency,
      async (imagePath, index) => {
        const result = await retry(() =>
          cloudinary.uploader.upload(imagePath, {
            folder,
            public_id: `angle-${index + 1}`,
            overwrite: false,
            unique_filename: false,
            resource_type: 'image',
            tags: ['e-commerce-seed', 'realistic-v1'],
          }),
        );
        return {
          url: result.secure_url,
          publicId: result.public_id,
          displayOrder: index,
        };
      },
    );
  } catch (error) {
    await Promise.allSettled(
      uploadedPublicIds.map((publicId) =>
        cloudinary.uploader.destroy(publicId),
      ),
    );
    throw error;
  }
}

function seedEmails(config: SeedConfig): string[] {
  return [
    `admin01@${SEED_EMAIL_DOMAIN}`,
    ...Array.from(
      { length: config.sellers },
      (_, index) =>
        `seller${String(index + 1).padStart(2, '0')}@${SEED_EMAIL_DOMAIN}`,
    ),
    ...Array.from(
      { length: config.customers },
      (_, index) =>
        `customer${String(index + 1).padStart(2, '0')}@${SEED_EMAIL_DOMAIN}`,
    ),
  ];
}

function makeDatabase(databaseUrl: string) {
  return drizzle(neon(databaseUrl), { schema });
}

async function cleanupSeedData(
  db: ReturnType<typeof makeDatabase>,
): Promise<void> {
  await db.delete(users).where(like(users.email, `%@${SEED_EMAIL_DOMAIN}`));

  const publicIds: string[] = [];
  let nextCursor: string | undefined;
  do {
    const response = (await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      prefix: `${CLOUDINARY_SEED_ROOT}/`,
      max_results: 500,
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    })) as {
      resources: Array<{ public_id: string }>;
      next_cursor?: string;
    };
    publicIds.push(...response.resources.map((resource) => resource.public_id));
    nextCursor = response.next_cursor;
  } while (nextCursor);

  for (let index = 0; index < publicIds.length; index += 100) {
    await cloudinary.api.delete_resources(publicIds.slice(index, index + 100), {
      resource_type: 'image',
    });
  }
}

async function assertSeedDoesNotExist(
  db: ReturnType<typeof makeDatabase>,
): Promise<void> {
  const existing = await db
    .select({ email: users.email })
    .from(users)
    .where(like(users.email, `%@${SEED_EMAIL_DOMAIN}`))
    .limit(1);

  if (existing.length) {
    throw new Error(
      `Seed data already exists (${existing[0].email}). Run npm run db:seed:cleanup first.`,
    );
  }
}

async function seedDatabase(
  db: ReturnType<typeof makeDatabase>,
  config: SeedConfig,
  productFixtures: ProductFixture[],
): Promise<void> {
  const passwordHash = await bcrypt.hash(config.password, 10);
  const emails = seedEmails(config);

  const userRecords = emails.map((email, index) => {
    const isAdmin = index === 0;
    const isSeller = index > 0 && index <= config.sellers;
    const type = isAdmin ? 'Admin' : isSeller ? 'Seller' : 'Customer';
    return {
      firstName: `${type}${String(index).padStart(2, '0')}`,
      lastName: 'Seed',
      email,
      phoneNumber: `+92300${String(index).padStart(7, '0')}`,
      passwordHash,
      isEmailVerified: true,
    };
  });

  const createdUsers = await db
    .insert(users)
    .values(userRecords)
    .returning({ id: users.id, email: users.email });
  const usersByEmail = new Map(createdUsers.map((user) => [user.email, user]));

  const roles: Array<{ userId: string; role: Role }> = [];
  for (const user of createdUsers) {
    if (user.email.startsWith('admin')) {
      roles.push(
        { userId: user.id, role: 'customer' as const },
        { userId: user.id, role: 'admin' as const },
      );
    } else if (user.email.startsWith('seller')) {
      roles.push(
        { userId: user.id, role: 'customer' as const },
        { userId: user.id, role: 'seller' as const },
      );
    } else {
      roles.push({ userId: user.id, role: 'customer' as const });
    }
  }
  await db.insert(userRoles).values(roles);

  let storeCount = 0;
  let productCount = 0;

  for (let sellerIndex = 0; sellerIndex < config.sellers; sellerIndex += 1) {
    const sellerNumber = sellerIndex + 1;
    const email = `seller${String(sellerNumber).padStart(2, '0')}@${SEED_EMAIL_DOMAIN}`;
    const seller = usersByEmail.get(email);
    if (!seller) throw new Error(`Seed seller ${email} was not created`);

    const sellerStoreCount = 1 + (sellerIndex % config.maxStoresPerSeller);
    for (let storeIndex = 0; storeIndex < sellerStoreCount; storeIndex += 1) {
      const storeNumber = storeIndex + 1;
      const storeSlug = `seed-seller-${String(sellerNumber).padStart(2, '0')}-store-${String(storeNumber).padStart(2, '0')}`;
      const [store] = await db
        .insert(stores)
        .values({
          sellerId: seller.id,
          name: `Seed Store ${sellerNumber}-${storeNumber}`,
          slug: storeSlug,
          description: `Development seed store owned by ${email}`,
          status: 'active',
        })
        .returning({ id: stores.id, slug: stores.slug });
      storeCount += 1;

      for (
        let productIndex = 0;
        productIndex < productFixtures.length;
        productIndex += 1
      ) {
        const sequence = productIndex + 1;
        const fixture = productFixtures[productIndex];
        const productSlug = `${store.slug}-${fixture.key}`;
        const uploadedImages = await uploadProductImages(
          fixture.imagePaths,
          productSlug,
          config.uploadConcurrency,
        );

        try {
          await db.insert(products).values({
            storeId: store.id,
            name: fixture.name,
            slug: productSlug,
            description: fixture.description,
            price: fixture.price.toFixed(2),
            stock: fixture.stock,
            images: uploadedImages,
            status: fixture.status,
            createdAt: new Date(Date.now() - sequence * 86_400_000),
            updatedAt: new Date(),
          });
          productCount += 1;
          console.log(`Created product ${productCount}: ${fixture.name}`);
        } catch (error) {
          await Promise.allSettled(
            uploadedImages.map((image) =>
              cloudinary.uploader.destroy(image.publicId),
            ),
          );
          throw error;
        }
      }
    }
  }

  console.log('\nRealistic seed completed');
  console.log(`Users: ${createdUsers.length}`);
  console.log(`Stores: ${storeCount}`);
  console.log(`Products: ${productCount}`);
  console.log(`Test seller: seller01@${SEED_EMAIL_DOMAIN}`);
  console.log(`Test customer: customer01@${SEED_EMAIL_DOMAIN}`);
  console.log('Password: SEED_USER_PASSWORD (defaults to SeedUser123!)');
}

async function main(): Promise<void> {
  assertSafeEnvironment();
  const config = readConfig();
  const args = new Set(process.argv.slice(2));

  if (args.has('--check')) {
    const productFixtures = await findProductFixtures(config.assetDirectory);
    console.log(
      `Seed configuration is valid; found ${productFixtures.length} product definitions.`,
    );
    return;
  }

  if (args.has('--check-metadata')) {
    const productFixtures = await findProductFixtures(
      config.assetDirectory,
      false,
    );
    console.log(`Valid product JSON files: ${productFixtures.length}`);
    return;
  }

  const databaseUrl = requiredEnvironment('DATABASE_URL');
  configureCloudinary();
  const db = makeDatabase(databaseUrl);
  if (args.has('--cleanup')) {
    await cleanupSeedData(db);
    console.log('Seed database records and Cloudinary assets were removed.');
    return;
  }

  const productFixtures = await findProductFixtures(config.assetDirectory);
  const expectedStores = Array.from(
    { length: config.sellers },
    (_, index) => 1 + (index % config.maxStoresPerSeller),
  ).reduce((total, count) => total + count, 0);
  console.log(
    `Seeding ${config.sellers + config.customers + 1} users, ${expectedStores} stores, ` +
      `${expectedStores * productFixtures.length} products, and ` +
      `${expectedStores * productFixtures.length * 4} unique Cloudinary images.`,
  );

  await assertSeedDoesNotExist(db);
  try {
    await seedDatabase(db, config, productFixtures);
  } catch (error) {
    console.error(
      'Seed failed; removing partial database and Cloudinary data.',
    );
    await cleanupSeedData(db).catch((cleanupError) =>
      console.error('Automatic cleanup also failed:', cleanupError),
    );
    throw error;
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
