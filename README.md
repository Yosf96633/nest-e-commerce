# E-Commerce API

A NestJS REST API for account and authentication flows, seller applications,
store and product management, catalog browsing, shopping carts, product
reviews, and rider profiles. PostgreSQL stores application data; Cloudinary
stores uploaded images; Resend sends email-verification messages.

This repository currently covers the backend foundation, seller workflows,
public product catalog browsing, persistent shopping carts, and user-owned
product reviews. Approved riders can manage vehicle details and availability.
Checkout, orders, delivery assignment, addresses, and wishlists are not
implemented yet.

## Stack

- NestJS 11 and TypeScript
- PostgreSQL through Neon Serverless and Drizzle ORM
- JWT access tokens and rotating refresh tokens
- class-validator and class-transformer request validation
- Resend verification email delivery
- Cloudinary image storage
- Jest unit and end-to-end test setup

## Requirements

- Node.js 20 or newer
- pnpm
- PostgreSQL/Neon database
- Resend and Cloudinary credentials for email and image operations

## Setup

Install dependencies:

```bash
pnpm install
```

Create `.env` at the project root:

```dotenv
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://user:password@host/database?sslmode=require

JWT_SECRET=replace-with-a-secure-access-token-secret
REFRESH_TOKEN_SECRET=replace-with-a-secure-refresh-token-secret
REFRESH_TOKEN_EXPIRATION_TIME=7d
EMAIL_VERIFICATION_TOKEN_URL=http://localhost:3000/verify-email

RESEND_API_KEY=re_your_api_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Apply database migrations and start the server:

```bash
pnpm db:migrate
pnpm start:dev
```

The server listens on `http://localhost:3000` by default. `PORT` can change
that port. The global validation pipe transforms incoming DTO values.

## Commands

| Command                       | Description                                                            |
| ----------------------------- | ---------------------------------------------------------------------- |
| `pnpm start`                  | Start the application                                                  |
| `pnpm start:dev`              | Start in watch mode                                                    |
| `pnpm build`                  | Build the production bundle                                            |
| `pnpm start:prod`             | Run the built application                                              |
| `pnpm lint`                   | Lint and fix TypeScript files                                          |
| `pnpm format`                 | Format source and test files                                           |
| `pnpm test`                   | Run unit tests                                                         |
| `pnpm test:e2e`               | Run end-to-end tests                                                   |
| `pnpm test:cov`               | Run tests with coverage                                                |
| `pnpm db:generate`            | Generate a migration from schema changes                               |
| `pnpm db:migrate`             | Apply database migrations                                              |
| `pnpm db:push`                | Push the schema directly to the database                               |
| `pnpm db:studio`              | Open Drizzle Studio                                                    |
| `pnpm db:seed:check-metadata` | Validate local product JSON definitions                                |
| `pnpm db:seed:check`          | Validate product definitions and image files                           |
| `pnpm db:seed`                | Create development seed users, stores, products, and Cloudinary images |
| `pnpm db:seed:reviews`        | Add three user-linked reviews to every seeded product                  |
| `pnpm db:seed:cleanup`        | Remove seed records and seed Cloudinary assets                         |

### Development seed

The seed catalog is in `src/infrastructure/database/seeds/product-images/`.
Each product directory has a `product.json` definition. The ignored
`shared-product.png` image is used by default; a product may instead have its
own `product.png`. The seeder uploads an image to Cloudinary for each product
record and stores the returned URL and public ID in the product's image JSONB
field.

Defaults create one admin, two sellers, 20 customers, three stores, and 20
distinct products per store. Seed accounts use `SeedUser123!` unless
`SEED_USER_PASSWORD` is set. Optional sizing settings include:

```dotenv
SEED_SELLERS=2
SEED_CUSTOMERS=20
SEED_MAX_STORES_PER_SELLER=2
SEED_UPLOAD_CONCURRENCY=4
SEED_USER_PASSWORD=SeedUser123!
```

The seeder refuses to run with `NODE_ENV=production`. Cleanup targets the
reserved `seed.local` account domain and the `e-com/seeds/realistic-v1/`
Cloudinary prefix. See
[`src/infrastructure/database/seeds/README.md`](src/infrastructure/database/seeds/README.md)
for the seed layout and additional details.

After the main seed and migrations are in place, seed reviews separately:

```bash
pnpm db:seed:reviews
```

The review seed resolves the existing product and customer UUIDs from the
database and creates three reviews per seeded product. It is idempotent:
rerunning it does not create duplicate `(product_id, user_id)` records.
`customer01@seed.local` reviews every seeded product, making it the predictable
account for user-review testing.

## Authentication and authorization

Protected routes expect an access token:

```http
Authorization: Bearer <access-token>
```

The refresh token is set as an HTTP-only `refresh_token` cookie scoped to
`/auth`. Refresh/logout also accept a `refreshToken` in the body for clients
that cannot use cookies. Refresh tokens are hashed in the database and rotated
when refreshed. Roles are `customer`, `seller`, `rider`, and `admin`.

New users receive the `customer` role after email verification. Seller/rider
access is requested through an application and requires admin review. The JWT
guard validates the access token; the role guard checks route role metadata
against the database.

## API endpoints

### Authentication — `/auth`

| Method | Endpoint                              | Access        | Description                                             |
| ------ | ------------------------------------- | ------------- | ------------------------------------------------------- |
| `POST` | `/auth/signup`                        | Public        | Register and send an email-verification message         |
| `POST` | `/auth/verify-email?token=…&userId=…` | Public        | Verify email and assign the customer role               |
| `POST` | `/auth/login`                         | Public        | Sign in, return an access token, and set refresh cookie |
| `POST` | `/auth/refresh`                       | Refresh token | Rotate refresh token and issue a new access token       |
| `POST` | `/auth/logout`                        | Refresh token | Revoke the current refresh token and clear its cookie   |
| `GET`  | `/auth/protected`                     | Authenticated | Example protected endpoint returning current user data  |

### Account management — `/users`

All account endpoints require an access token. The profile update accepts
JSON fields and optionally a multipart `profileImage` file.

| Method   | Endpoint                  | Access        | Description                                                 |
| -------- | ------------------------- | ------------- | ----------------------------------------------------------- |
| `GET`    | `/users/me`               | Authenticated | Get the signed-in user's profile and roles                  |
| `PATCH`  | `/users/me`               | Authenticated | Update profile fields and optionally upload a profile image |
| `PATCH`  | `/users/profile`          | Authenticated | Compatibility alias for profile update                      |
| `DELETE` | `/users/me/profile-image` | Authenticated | Remove the profile image                                    |
| `PATCH`  | `/users/me/password`      | Authenticated | Change password and revoke refresh-token sessions           |
| `GET`    | `/users/me/sessions`      | Authenticated | List active sessions and device metadata                    |
| `DELETE` | `/users/me/sessions/:id`  | Authenticated | Revoke one of the user's sessions                           |
| `DELETE` | `/users/me/sessions`      | Authenticated | Revoke all sessions and clear refresh cookie                |
| `DELETE` | `/users/me`               | Authenticated | Delete account after password confirmation                  |
| `GET`    | `/users`                  | Admin         | List users with their roles                                 |
| `GET`    | `/users/:id`              | Admin         | Get a user and roles by UUID                                |

Password change body:

```json
{
  "currentPassword": "CurrentPass123!",
  "newPassword": "NewPass456!"
}
```

Account deletion body:

```json
{
  "password": "CurrentPass123!"
}
```

Account deletion cascades through owned database records and attempts to remove
the account's profile, store, and product images from Cloudinary.

### Seller/rider applications and administration

| Method  | Endpoint                             | Access        | Description                                                             |
| ------- | ------------------------------------ | ------------- | ----------------------------------------------------------------------- |
| `POST`  | `/application/create`                | Authenticated | Submit a `seller` or `rider` application                                |
| `GET`   | `/admin/applications?status=pending` | Admin         | List applications, optionally filtered by status                        |
| `PATCH` | `/admin/approve-applications/:id`    | Admin         | Approve an application and grant its corresponding seller or rider role |
| `PATCH` | `/admin/reject-applications/:id`     | Admin         | Reject an application and optionally provide a reason                   |

### Stores — `/store`

Every store route currently requires authentication. Creation, update, and
deletion additionally require the seller role and verify ownership.

| Method   | Endpoint                  | Access        | Description                                   |
| -------- | ------------------------- | ------------- | --------------------------------------------- |
| `POST`   | `/store`                  | Seller        | Create a store owned by the signed-in seller  |
| `GET`    | `/store/my-stores`        | Seller        | List the signed-in seller's stores            |
| `GET`    | `/store/seller/:sellerId` | Authenticated | List stores belonging to the specified seller |
| `GET`    | `/store/id/:id`           | Authenticated | Get a store by UUID                           |
| `GET`    | `/store/:slug`            | Authenticated | Get a store by slug                           |
| `PATCH`  | `/store/:id`              | Seller, owner | Update an owned store                         |
| `DELETE` | `/store/:id`              | Seller, owner | Delete an owned store                         |

Store create/update accepts `multipart/form-data` fields `profileImage` and
`coverImage` (one file each, maximum 5 MB per file; JPG, JPEG, PNG, or WebP).

### Products — `/product`

Every product route currently requires authentication. Product routes also
require the seller role; operations on a specific product verify that its
store belongs to the signed-in seller. Product reads are not public catalog
routes yet.

| Method   | Endpoint               | Access        | Description                                       |
| -------- | ---------------------- | ------------- | ------------------------------------------------- |
| `POST`   | `/product`             | Seller        | Create a product for an owned store               |
| `GET`    | `/product/my-products` | Seller        | List products across the seller's stores          |
| `GET`    | `/product/:identifier` | Seller, owner | Get an owned product by UUID or slug              |
| `PATCH`  | `/product/:id`         | Seller, owner | Update an owned product                           |
| `DELETE` | `/product/:id`         | Seller, owner | Delete an owned product and its Cloudinary images |

Product create/update accepts `multipart/form-data` with up to 10 files in the
`images` field. Creating and activating a product requires at least one image.
Each file is limited to 5 MB and must be JPG, JPEG, PNG, or WebP.

### Public catalog — `/catalog`

These routes are public and only return products and stores with `active`
status. Product lists support `page`, `limit` (maximum 100), `q` name/description
search, `minPrice`, `maxPrice`, `store` (store slug), `sortBy` (`createdAt`,
`price`, or `name`), and `order` (`asc` or `desc`).

| Method | Endpoint                              | Description                                                                     |
| ------ | ------------------------------------- | ------------------------------------------------------------------------------- |
| `GET`  | `/catalog/products`                   | Paginated catalog with optional search, price range, store, and sorting filters |
| `GET`  | `/catalog/products/:identifier`       | Get an active product by UUID or slug, including basic store details            |
| `GET`  | `/catalog/stores/:storeSlug/products` | Paginated active products for a store                                           |

List responses contain `data` and `pagination` (`page`, `limit`, `total`,
`totalPages`).

### Shopping cart — `/cart`

Cart routes require an access token. Cart contents are stored per user in
PostgreSQL; adding a product increments its existing quantity. Only products
in active stores with active status can be added, and requested quantities
must not exceed current stock. Prices and line totals in cart responses use
the current product price; checkout-time price/stock verification will still
be required when checkout is implemented.

| Method   | Endpoint                 | Description                                                            |
| -------- | ------------------------ | ---------------------------------------------------------------------- |
| `GET`    | `/cart`                  | Get cart items, item count, and subtotal                               |
| `POST`   | `/cart/items`            | Add quantity of a product; body: `{"productId":"<uuid>","quantity":2}` |
| `PATCH`  | `/cart/items/:productId` | Set the item's quantity; body: `{"quantity":3}`                        |
| `DELETE` | `/cart/items/:productId` | Remove a product from the cart                                         |
| `DELETE` | `/cart`                  | Clear the cart                                                         |

### Product reviews

Product review lists are public. Creating, listing the current user's reviews,
updating, and deleting require a bearer access token. A user can review a
product only once, ratings must be between 1 and 5, and only active products in
active stores accept new reviews. Updates and deletion are restricted to the
review owner.

| Method   | Endpoint                       | Access        | Description                                               |
| -------- | ------------------------------ | ------------- | --------------------------------------------------------- |
| `GET`    | `/products/:productId/reviews` | Public        | List reviews with pagination, filters, and rating summary |
| `POST`   | `/products/:productId/reviews` | Authenticated | Create one review for an active product                   |
| `GET`    | `/reviews/me`                  | Authenticated | List reviews written by the current user                  |
| `PATCH`  | `/reviews/:reviewId`           | Owner         | Update rating, title, or comment                          |
| `DELETE` | `/reviews/:reviewId`           | Owner         | Delete a review                                           |

Review list query parameters are `page`, `limit` (maximum 100), optional
`rating` (1–5), and `sort` (`newest`, `oldest`, `highest`, or `lowest`). Product
review responses include an unfiltered review count, average rating, 1–5 star
distribution, and pagination metadata. See
[`src/modules/reviews/REVIEWS_API.md`](src/modules/reviews/REVIEWS_API.md) for
request examples.

### Rider profiles — `/rider`

Rider routes require an access token and the `rider` role. Users receive this
role when an administrator approves a rider application. Each rider has at most
one profile and can manage only their own profile.

| Method  | Endpoint              | Access | Description                              |
| ------- | --------------------- | ------ | ---------------------------------------- |
| `POST`  | `/rider/profile`      | Rider  | Create vehicle and rider profile details |
| `GET`   | `/rider/profile`      | Rider  | Get the current rider's profile          |
| `PATCH` | `/rider/profile`      | Rider  | Update vehicle or document details       |
| `PATCH` | `/rider/availability` | Rider  | Set current availability                 |

Vehicle types are `bicycle`, `motorcycle`, `car`, and `van`. Motor vehicles
require unique plate and license numbers; bicycles do not. New profiles start
unavailable. See
[`src/modules/rider/RIDER_API.md`](src/modules/rider/RIDER_API.md) for request
examples and validation rules.

## Repository layout

```text
src/
├── common/                  # Current-user decorator, JWT/role guards, shared types
├── infrastructure/
│   ├── cloudinary/          # Image upload/delete integration
│   ├── database/            # Neon Drizzle client, schema, repositories, seed script
│   └── resend/              # Verification email integration
└── modules/
    ├── admin/               # Application review
    ├── application/         # Seller/rider applications
    ├── auth/                # Signup, verification, login, token rotation, logout
    ├── cart/                # Persistent user carts and stock validation
    ├── catalog/             # Public product discovery and filtering
    ├── reviews/             # Product reviews, summaries, and ownership rules
    ├── rider/               # Rider vehicle profiles and availability
    ├── seller/              # Store and product management
    └── users/               # Profile, sessions, and account management
```

Feature services do not query Drizzle directly. Each persistence-backed module
owns a repository interface, while its concrete Drizzle implementation lives
under `src/infrastructure/database/repositories/`. Nest module provider tokens
bind the interface to the implementation. This keeps business rules testable
without a database and confines SQL/query construction to infrastructure.

See [`architecture.md`](architecture.md) for module boundaries, request flows,
and data relationships.

## License

This project is private and unlicensed.
