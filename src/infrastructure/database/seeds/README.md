# Realistic development seed

This seed creates connected development data using the application's existing
tables:

- one admin;
- configurable sellers and customers;
- one or more stores for every seller;
- configurable products for every store;
- four unique Cloudinary assets for every product.

Reviews are not included yet because the project does not currently have a
review schema. Add review records to this seed after that schema is introduced.

## Add the source images

The catalog already contains 20 distinct product directories. Each directory
contains its database information and four copyable image prompts. Add your
generated images to the same directory:

```text
product-images/
└── wireless-headphones/
    ├── product.json
    ├── PROMPTS.md
    ├── 01-front.png
    ├── 02-left-angle.png
    ├── 03-right-angle.png
    └── 04-back-detail.png
```

Start with the ready-made
[`wireless-headphones/PROMPTS.md`](./product-images/wireless-headphones/PROMPTS.md).
After generating the images, save them in that same `wireless-headphones`
directory. Supported extensions are `.png`, `.jpg`, `.jpeg`, and `.webp`.

The seeder discovers every child directory and creates **one product from each
directory in each store**. It uses the `name`, `description`, `price`, `stock`,
and `status` from that directory's `product.json`. You can add more products by
creating more directories with the same structure. It never invents numbered
copies to fill a target count.

Every local image is uploaded separately for every created database product.
The returned Cloudinary `secure_url` and `public_id` are stored in the matching
product's `images` JSONB column.

## Validate without writing data

To validate the 20 product JSON files before generating images:

```bash
npm run db:seed:check-metadata
```

After placing exactly four images in every product directory:

```bash
npm run db:seed:check
```

These checks do not connect to the database or upload an image.

## Run the seed

```bash
npm run db:seed
```

The defaults create 23 users, 3 stores, 60 product records (20 distinct
products per store), and 240 independently owned Cloudinary assets. Each user
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

## Remove seed data

```bash
npm run db:seed:cleanup
```

Cleanup deletes users under the reserved `seed.local` domain. Database cascade
rules remove their stores and products. It also deletes Cloudinary resources
under the dedicated `e-com/seeds/realistic-v1/` prefix.
