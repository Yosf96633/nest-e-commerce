# NestJS E-Commerce API

A multi-role e-commerce backend built to demonstrate practical NestJS
architecture: authentication and sessions, role approval, seller-owned catalog
management, carts, transactional orders, rider fulfillment, and reviews.

## What it includes

- Email signup and verification through Resend
- JWT access tokens and rotating, hashed refresh-token sessions
- Database-backed `customer`, `seller`, `rider`, and `admin` authorization
- Admin-reviewed seller and rider applications
- Seller-owned stores, products, inventory, and Cloudinary images
- Public catalog search, filtering, sorting, and pagination
- Persistent user carts with product and stock validation
- Transactional checkout with order snapshots and automatic rider assignment
- Rider profile, availability, pickup, and delivery workflows
- Owner-controlled product reviews and product rating summaries
- PostgreSQL/Neon persistence through Drizzle repositories
- Migrations and realistic, rerunnable development seeds

This is a portfolio/demo backend, not a production commerce platform. Payments,
refunds, live rider tracking, proximity dispatch, and wishlists are outside its
documented scope.

## Architecture at a glance

```text
HTTP request
  -> Controller and guards
  -> DTO validation
  -> Feature service
  -> Feature-owned repository interface
  -> Drizzle repository adapter
  -> Neon PostgreSQL
```

Business services do not query Drizzle directly. Repository interfaces and
domain contracts live with their feature modules; database adapters live under
`src/infrastructure/database/repositories/`.

## Stack

- NestJS 11 and TypeScript
- PostgreSQL on Neon Serverless
- Drizzle ORM and Drizzle Kit migrations
- JWT, bcrypt, and rotating refresh tokens
- class-validator and class-transformer
- Cloudinary image storage
- Resend verification email
- Jest and Supertest

## Quick start

Requirements: Node.js 20+, pnpm, a PostgreSQL/Neon database, Resend credentials,
and Cloudinary credentials.

```bash
pnpm install
pnpm db:migrate
pnpm start:dev
```

Create a root `.env` before migrating:

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

JWT_SECRET=replace-with-a-long-random-secret
REFRESH_TOKEN_SECRET=replace-with-another-long-random-secret
REFRESH_TOKEN_EXPIRATION_TIME=7d
EMAIL_VERIFICATION_TOKEN_URL=http://localhost:3000/verify-email

RESEND_API_KEY=re_your_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

The API listens on `http://localhost:3000` by default.

## Development data

After migrations, seed the catalog and related examples in this order:

```bash
pnpm db:seed
pnpm db:seed:reviews
pnpm db:seed:riders-orders
```

The default seed password is `SeedUser123!`. Example accounts include:

```text
admin01@seed.local
seller01@seed.local
customer01@seed.local
rider01@seed.local
```

## Main commands

| Command                      | Purpose                                  |
| ---------------------------- | ---------------------------------------- |
| `pnpm start:dev`             | Run the API in watch mode                |
| `pnpm build`                 | Compile the production bundle            |
| `pnpm lint`                  | Run ESLint with fixes                    |
| `pnpm test`                  | Run unit tests                           |
| `pnpm test:e2e`              | Run end-to-end tests                     |
| `pnpm db:generate`           | Generate a migration from schema changes |
| `pnpm db:migrate`            | Apply migrations                         |
| `pnpm db:studio`             | Open Drizzle Studio                      |
| `pnpm db:seed`               | Seed users, stores, products, and images |
| `pnpm db:seed:reviews`       | Seed product reviews                     |
| `pnpm db:seed:riders-orders` | Seed riders and all order states         |
| `pnpm db:seed:cleanup`       | Remove development seed accounts/assets  |

## Documentation

Detailed documentation lives in [`docs/`](docs/index.md):

- [Getting started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [API reference](docs/api-reference.md)
- [Authentication and authorization](docs/authentication-authorization.md)
- [Database](docs/database.md)
- [Business flows](docs/business-flows.md)
- [Configuration](docs/configuration.md)
- [Seeding](docs/seeding.md)
- [Testing](docs/testing.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Issues and engineering decisions](docs/issues.md)

## Repository layout

```text
docs/                       Detailed project documentation
drizzle/                    SQL migrations and Drizzle snapshots
src/common/                 Guards, decorators, and shared types
src/infrastructure/         Database adapters, Cloudinary, and Resend
src/modules/                Feature modules and domain contracts
test/                       End-to-end test setup
```

## Current verification status

The production build compiles. The full unit suite still contains older test
setup failures involving missing mocks/providers and one Jest import alias.
See [Testing](docs/testing.md) for the exact audited status and remediation
plan.

## License

This project is private and unlicensed.
