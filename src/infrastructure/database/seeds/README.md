# Realistic development seed

This seed creates connected development data using the application's existing
tables:

- one admin;
- configurable sellers and customers;
- one or more stores for every seller;
- configurable products for every store;
- one Cloudinary image for every product record.

Reviews and rider/order examples have separate, rerunnable seeds so they can be
added to an existing catalog after their migrations are applied.

## Add the source images

The catalog has 20 distinct product directories and one generated shared
placeholder image. The shared image is already saved locally. You can run the
seed without generating any more images:

```text
product-images/
├── shared-product.png
└── wireless-headphones/
    ├── product.json
    └── PROMPTS.md
```

The per-product prompts are optional. To replace the shared placeholder for
one product, generate one image from that product's `PROMPTS.md` and save it in
the same directory as `product.png`. Supported extensions are `.png`, `.jpg`,
`.jpeg`, and `.webp`.

The seeder discovers every child directory and creates **one product from each
directory in each store**. It uses the `name`, `description`, `price`, `stock`,
and `status` from that directory's `product.json`. You can add more products by
creating more directories with the same structure. It never invents numbered
copies to fill a target count.

The selected local image is uploaded separately for every created database product.
The returned Cloudinary `secure_url` and `public_id` are stored in the matching
product's `images` JSONB column.

## Validate without writing data

To validate the 20 product JSON files before generating images:

```bash
npm run db:seed:check-metadata
```

To check that every product has either one local image or the shared fallback:

```bash
npm run db:seed:check
```

These checks do not connect to the database or upload an image.

## Run the seed

```bash
npm run db:seed
```

The defaults create 23 users, 3 stores, 60 product records (20 distinct
products per store), and 60 independently owned Cloudinary assets. Each user
is inserted first and assigned its role. The database returns each seller's ID,
which is saved as `stores.seller_id`; it then returns each store's ID, which is
saved as `products.store_id`. All seeded accounts use `SeedUser123!` unless
`SEED_USER_PASSWORD` is provided.

Default credentials:

```text
seller01@seed.local
customer01@seed.local
```

## Configure the seed

These environment variables are optional:

```text
SEED_SELLERS=2
SEED_CUSTOMERS=20
SEED_MAX_STORES_PER_SELLER=2
SEED_UPLOAD_CONCURRENCY=4
SEED_USER_PASSWORD=SeedUser123!
SEED_PRODUCT_IMAGE_DIR=/absolute/path/to/images
```

The normal database and Cloudinary environment variables must also be set:

```text
DATABASE_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

The script refuses to run when `NODE_ENV=production`.

## Seed product reviews

After applying the database migrations and running the main seed, add reviews:

```bash
npm run db:migrate
npm run db:seed:reviews
```

The review seed fetches the existing seeded product and customer IDs from the
database. It creates up to three reviews per product and can safely be rerun;
the `(product_id, user_id)` unique constraint prevents duplicate reviews.
`customer01@seed.local` reviews every seeded product, providing a predictable
account for testing user-specific review queries. The other review authors are
rotated through the remaining seeded customers.

## Seed riders and orders

After applying the rider and order migrations and running the main seed, run:

```bash
pnpm db:seed:riders-orders
```

This creates or updates four accounts (`rider01@seed.local` through
`rider04@seed.local`) with both `customer` and `rider` roles and matching rider
profiles. It also creates or updates four deterministic example orders—one in
each of the `assigned`, `picked_up`, `delivered`, and `cancelled` states—with
two existing seeded products per order. Active-order riders are unavailable;
the delivered and cancelled-order riders are available. Rerunning the command
updates the same riders and orders rather than duplicating them.

## Remove seed data

```bash
npm run db:seed:cleanup
```

Cleanup deletes users under the reserved `seed.local` domain. Database cascade
rules remove their stores and products. It also deletes Cloudinary resources
under the dedicated `e-com/seeds/realistic-v1/` prefix.
