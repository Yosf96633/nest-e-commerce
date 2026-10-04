# Seeding

Seed scripts are intended for local or shared development environments. Every
script refuses to run when `NODE_ENV=production`.

## Recommended sequence

Apply migrations first, then run the seeds in dependency order:

```bash
pnpm db:migrate
pnpm db:seed
pnpm db:seed:reviews
pnpm db:seed:riders-orders
```

## Main catalog seed

```bash
pnpm db:seed
```

With default settings, the main seed creates:

- one administrator;
- two sellers;
- twenty customers;
- three stores;
- twenty distinct product definitions in every store, producing sixty product
  records;
- one independently managed Cloudinary image for every product record.

Product definitions live under
`src/infrastructure/database/seeds/product-images/`. Each product directory
contains `product.json` and may contain a product-specific image. Otherwise,
the shared image is used.

Validate fixtures without writing to the database:

```bash
pnpm db:seed:check-metadata
pnpm db:seed:check
```

The first command validates JSON metadata. The second also confirms that each
product resolves to an image.

## Review seed

```bash
pnpm db:seed:reviews
```

This seed looks up existing seeded products and customers instead of assuming
their UUIDs. It adds up to three reviews per product. The database's unique
`(product_id, user_id)` index makes the operation rerunnable.

`customer01@seed.local` reviews every seeded product, which makes it useful for
testing `GET /reviews/me`.

## Rider and order seed

```bash
pnpm db:seed:riders-orders
```

This rerunnable seed creates or updates four users and rider profiles:

| Account              | Seeded order | Availability |
| -------------------- | ------------ | ------------ |
| `rider01@seed.local` | `assigned`   | Unavailable  |
| `rider02@seed.local` | `picked_up`  | Unavailable  |
| `rider03@seed.local` | `delivered`  | Available    |
| `rider04@seed.local` | `cancelled`  | Available    |

Each rider has `customer` and `rider` roles. Each demo order belongs to a
seeded customer and contains snapshots of two active seeded products. Fixed
order UUIDs allow reruns to update the examples instead of duplicating them.

## Default accounts

Unless `SEED_USER_PASSWORD` is set, all accounts use `SeedUser123!`.

```text
admin01@seed.local
seller01@seed.local
seller02@seed.local
customer01@seed.local
rider01@seed.local
```

Additional customer accounts continue as `customer02@seed.local`, and rider
accounts continue through `rider04@seed.local`.

## Cleanup

```bash
pnpm db:seed:cleanup
```

Cleanup deletes users under the reserved `seed.local` domain and Cloudinary
assets beneath `e-com/seeds/realistic-v1/`. Foreign-key cascades remove owned
stores, products, carts, reviews, sessions, and rider profiles.

Historical orders are intentionally retained. Their customer, rider, and
product references can become `null`, while checkout-time item and address
snapshots preserve the historical record. The rider/order seed can later
reattach its deterministic demo orders to newly created seed records.

For fixture layout details, see the source-level
[`seeds/README.md`](../src/infrastructure/database/seeds/README.md).
