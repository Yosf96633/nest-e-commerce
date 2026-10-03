import { neon } from '@neondatabase/serverless';
import { asc, like } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../schema';
import { products, reviews, users } from '../schema';

const SEED_EMAIL_DOMAIN = 'seed.local';
const SEED_PRODUCT_SLUG_PATTERN = 'seed-%';
const REVIEWS_PER_PRODUCT = 3;

const reviewCopy = [
  {
    rating: 5,
    title: 'Excellent product',
    comment:
      'The product matched the description, arrived in great condition, and has worked reliably so far.',
  },
  {
    rating: 4,
    title: 'Very good overall',
    comment:
      'Good quality and easy to use. There are a few small details that could improve, but I am happy with it.',
  },
  {
    rating: 3,
    title: 'Solid for the price',
    comment:
      'It does what I expected and offers reasonable value. The overall experience is good, with room for improvement.',
  },
] as const;

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function assertSafeEnvironment(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The reviews seed is disabled when NODE_ENV=production');
  }
}

async function main(): Promise<void> {
  assertSafeEnvironment();

  const databaseUrl = requiredEnvironment('DATABASE_URL');
  const db = drizzle(neon(databaseUrl), { schema });

  const [seededProducts, seededCustomers] = await Promise.all([
    db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(like(products.slug, SEED_PRODUCT_SLUG_PATTERN))
      .orderBy(asc(products.slug)),
    db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(like(users.email, `customer%@${SEED_EMAIL_DOMAIN}`))
      .orderBy(asc(users.email)),
  ]);

  if (!seededProducts.length) {
    throw new Error('No seeded products found. Run npm run db:seed first.');
  }
  if (!seededCustomers.length) {
    throw new Error('No seeded customers found. Run npm run db:seed first.');
  }

  const reviewRecords = seededProducts.flatMap((product, productIndex) => {
    const reviewCount = Math.min(REVIEWS_PER_PRODUCT, seededCustomers.length);

    return Array.from({ length: reviewCount }, (_, reviewIndex) => {
      // customer01 is always first, making it a predictable account for tests.
      const customerIndex =
        reviewIndex === 0
          ? 0
          : 1 +
            ((productIndex + reviewIndex - 1) % (seededCustomers.length - 1));
      const customer = seededCustomers[customerIndex];
      const copy = reviewCopy[(productIndex + reviewIndex) % reviewCopy.length];
      const createdAt = new Date(
        Date.now() - (productIndex * reviewCount + reviewIndex + 1) * 3_600_000,
      );

      return {
        productId: product.id,
        userId: customer.id,
        rating: copy.rating,
        title: copy.title,
        comment: copy.comment,
        createdAt,
        updatedAt: createdAt,
      };
    });
  });

  const inserted = await db
    .insert(reviews)
    .values(reviewRecords)
    .onConflictDoNothing({
      target: [reviews.productId, reviews.userId],
    })
    .returning({ id: reviews.id });

  console.log('\nReviews seed completed');
  console.log(`Seeded products found: ${seededProducts.length}`);
  console.log(`Reviews inserted: ${inserted.length}`);
  console.log(
    `Reviews already present: ${reviewRecords.length - inserted.length}`,
  );
  console.log(`Primary test reviewer: customer01@${SEED_EMAIL_DOMAIN}`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
