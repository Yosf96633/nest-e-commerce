import { neon } from '@neondatabase/serverless';
import * as bcrypt from 'bcrypt';
import { and, asc, eq, like } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import type { OrderStatus } from '@/modules/orders/entities/order.entity';
import type { RiderVehicleType } from '@/modules/rider/entities/rider.entity';
import * as schema from '../schema';
import {
  orderItems,
  orders,
  products,
  riderProfiles,
  userRoles,
  users,
} from '../schema';

const SEED_EMAIL_DOMAIN = 'seed.local';
const SEED_PRODUCT_SLUG_PATTERN = 'seed-%';

const riderFixtures: Array<{
  email: string;
  firstName: string;
  vehicleType: RiderVehicleType;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor: string;
  plateNumber: string;
  licenseNumber: string;
}> = [
  {
    email: `rider01@${SEED_EMAIL_DOMAIN}`,
    firstName: 'Rider01',
    vehicleType: 'motorcycle',
    vehicleMake: 'Honda',
    vehicleModel: 'CG 125',
    vehicleColor: 'Red',
    plateNumber: 'SEED-R-001',
    licenseNumber: 'SEED-LICENSE-001',
  },
  {
    email: `rider02@${SEED_EMAIL_DOMAIN}`,
    firstName: 'Rider02',
    vehicleType: 'motorcycle',
    vehicleMake: 'Yamaha',
    vehicleModel: 'YBR 125',
    vehicleColor: 'Black',
    plateNumber: 'SEED-R-002',
    licenseNumber: 'SEED-LICENSE-002',
  },
  {
    email: `rider03@${SEED_EMAIL_DOMAIN}`,
    firstName: 'Rider03',
    vehicleType: 'car',
    vehicleMake: 'Suzuki',
    vehicleModel: 'Alto',
    vehicleColor: 'White',
    plateNumber: 'SEED-R-003',
    licenseNumber: 'SEED-LICENSE-003',
  },
  {
    email: `rider04@${SEED_EMAIL_DOMAIN}`,
    firstName: 'Rider04',
    vehicleType: 'bicycle',
    vehicleMake: 'Giant',
    vehicleModel: 'Escape 3',
    vehicleColor: 'Blue',
    plateNumber: 'SEED-R-004',
    licenseNumber: 'SEED-LICENSE-004',
  },
];

const orderFixtures: Array<{
  id: string;
  status: OrderStatus;
  ageInHours: number;
}> = [
  {
    id: '70000000-0000-4000-8000-000000000001',
    status: 'assigned',
    ageInHours: 2,
  },
  {
    id: '70000000-0000-4000-8000-000000000002',
    status: 'picked_up',
    ageInHours: 6,
  },
  {
    id: '70000000-0000-4000-8000-000000000003',
    status: 'delivered',
    ageInHours: 30,
  },
  {
    id: '70000000-0000-4000-8000-000000000004',
    status: 'cancelled',
    ageInHours: 48,
  },
];

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function assertSafeEnvironment(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'The riders and orders seed is disabled when NODE_ENV=production',
    );
  }
}

function centsToDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}

async function main(): Promise<void> {
  assertSafeEnvironment();

  const databaseUrl = requiredEnvironment('DATABASE_URL');
  const password = process.env.SEED_USER_PASSWORD ?? 'SeedUser123!';
  const passwordHash = await bcrypt.hash(password, 10);
  const db = drizzle(neon(databaseUrl), { schema });

  const [seededCustomers, seededProducts] = await Promise.all([
    db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(like(users.email, `customer%@${SEED_EMAIL_DOMAIN}`))
      .orderBy(asc(users.email)),
    db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        images: products.images,
      })
      .from(products)
      .where(
        and(
          like(products.slug, SEED_PRODUCT_SLUG_PATTERN),
          eq(products.status, 'active'),
        ),
      )
      .orderBy(asc(products.slug)),
  ]);

  if (seededCustomers.length < orderFixtures.length) {
    throw new Error(
      `At least ${orderFixtures.length} seeded customers are required. Run pnpm db:seed first.`,
    );
  }
  if (seededProducts.length < 2) {
    throw new Error(
      'At least two active seeded products are required. Run pnpm db:seed first.',
    );
  }

  const riderProfileIds: string[] = [];
  for (let index = 0; index < riderFixtures.length; index += 1) {
    const fixture = riderFixtures[index];
    await db
      .insert(users)
      .values({
        firstName: fixture.firstName,
        lastName: 'Seed',
        email: fixture.email,
        phoneNumber: `+92310${String(index + 1).padStart(7, '0')}`,
        passwordHash,
        isEmailVerified: true,
      })
      .onConflictDoNothing({ target: users.email });

    const [riderUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, fixture.email))
      .limit(1);
    if (!riderUser) throw new Error(`Could not load ${fixture.email}`);

    await db
      .insert(userRoles)
      .values([
        { userId: riderUser.id, role: 'customer' },
        { userId: riderUser.id, role: 'rider' },
      ])
      .onConflictDoNothing();

    const isAvailable = !['assigned', 'picked_up'].includes(
      orderFixtures[index].status,
    );
    const [profile] = await db
      .insert(riderProfiles)
      .values({
        userId: riderUser.id,
        vehicleType: fixture.vehicleType,
        vehicleMake: fixture.vehicleMake,
        vehicleModel: fixture.vehicleModel,
        vehicleColor: fixture.vehicleColor,
        plateNumber: fixture.plateNumber,
        licenseNumber: fixture.licenseNumber,
        isAvailable,
      })
      .onConflictDoUpdate({
        target: riderProfiles.userId,
        set: {
          vehicleType: fixture.vehicleType,
          vehicleMake: fixture.vehicleMake,
          vehicleModel: fixture.vehicleModel,
          vehicleColor: fixture.vehicleColor,
          plateNumber: fixture.plateNumber,
          licenseNumber: fixture.licenseNumber,
          isAvailable,
          updatedAt: new Date(),
        },
      })
      .returning({ id: riderProfiles.id });
    riderProfileIds.push(profile.id);
  }

  for (let index = 0; index < orderFixtures.length; index += 1) {
    const fixture = orderFixtures[index];
    const customer = seededCustomers[index];
    const firstProduct = seededProducts[(index * 2) % seededProducts.length];
    const secondProduct =
      seededProducts[(index * 2 + 1) % seededProducts.length];
    const firstQuantity = 1 + (index % 2);
    const secondQuantity = 1;
    const firstLineCents =
      Math.round(Number(firstProduct.price) * 100) * firstQuantity;
    const secondLineCents =
      Math.round(Number(secondProduct.price) * 100) * secondQuantity;
    const subtotalCents = firstLineCents + secondLineCents;
    const deliveryFeeCents = 250;
    const createdAt = new Date(Date.now() - fixture.ageInHours * 3_600_000);
    const pickedUpAt =
      fixture.status === 'picked_up' || fixture.status === 'delivered'
        ? new Date(createdAt.getTime() + 30 * 60_000)
        : null;
    const deliveredAt =
      fixture.status === 'delivered'
        ? new Date(createdAt.getTime() + 90 * 60_000)
        : null;
    const cancelledAt =
      fixture.status === 'cancelled'
        ? new Date(createdAt.getTime() + 15 * 60_000)
        : null;

    await db
      .insert(orders)
      .values({
        id: fixture.id,
        userId: customer.id,
        riderProfileId: riderProfileIds[index],
        status: fixture.status,
        deliveryAddress: {
          recipientName: `Seed Customer ${index + 1}`,
          phoneNumber: `+92320${String(index + 1).padStart(7, '0')}`,
          addressLine1: `${index + 1} Demo Street`,
          addressLine2: 'Seed Apartments',
          city: 'Lahore',
          postalCode: '54000',
          instructions: 'Seed order for API testing',
        },
        subtotal: centsToDecimal(subtotalCents),
        deliveryFee: centsToDecimal(deliveryFeeCents),
        total: centsToDecimal(subtotalCents + deliveryFeeCents),
        assignedAt: createdAt,
        pickedUpAt,
        deliveredAt,
        cancelledAt,
        createdAt,
        updatedAt: deliveredAt ?? cancelledAt ?? pickedUpAt ?? createdAt,
      })
      .onConflictDoUpdate({
        target: orders.id,
        set: {
          userId: customer.id,
          riderProfileId: riderProfileIds[index],
          status: fixture.status,
          subtotal: centsToDecimal(subtotalCents),
          deliveryFee: centsToDecimal(deliveryFeeCents),
          total: centsToDecimal(subtotalCents + deliveryFeeCents),
          assignedAt: createdAt,
          pickedUpAt,
          deliveredAt,
          cancelledAt,
          updatedAt: deliveredAt ?? cancelledAt ?? pickedUpAt ?? createdAt,
        },
      });

    await db.delete(orderItems).where(eq(orderItems.orderId, fixture.id));
    await db.insert(orderItems).values([
      {
        orderId: fixture.id,
        productId: firstProduct.id,
        productName: firstProduct.name,
        productImage: firstProduct.images[0] ?? null,
        unitPrice: firstProduct.price,
        quantity: firstQuantity,
        lineTotal: centsToDecimal(firstLineCents),
        createdAt,
      },
      {
        orderId: fixture.id,
        productId: secondProduct.id,
        productName: secondProduct.name,
        productImage: secondProduct.images[0] ?? null,
        unitPrice: secondProduct.price,
        quantity: secondQuantity,
        lineTotal: centsToDecimal(secondLineCents),
        createdAt,
      },
    ]);
  }

  console.log('\nRiders and orders seed completed');
  console.log(`Riders created or updated: ${riderFixtures.length}`);
  console.log(`Orders created or updated: ${orderFixtures.length}`);
  console.log(`Test rider: rider01@${SEED_EMAIL_DOMAIN}`);
  console.log('Password: SEED_USER_PASSWORD (defaults to SeedUser123!)');
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
