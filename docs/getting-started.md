# Getting Started

## Prerequisites

- Node.js 20 or newer
- pnpm
- A PostgreSQL database; the application is configured for Neon Serverless
- A Resend API key for verification email
- A Cloudinary account for profile, store, and product images

## 1. Install dependencies

From the repository root:

```bash
pnpm install
```

## 2. Configure the environment

Create `.env` in the repository root:

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

See [Configuration](configuration.md) for meanings, defaults, and seed-only
variables.

## 3. Apply migrations

```bash
pnpm db:migrate
```

Migration files are committed under `drizzle/`. Use `db:migrate` when setting
up an existing checkout. Use `db:generate` only after intentionally changing a
Drizzle schema.

## 4. Start the API

```bash
pnpm start:dev
```

The default address is `http://localhost:3000`. The root route can be used as a
basic process check:

```http
GET /
```

The application enables cookie parsing and a global NestJS `ValidationPipe`
with DTO transformation.

## 5. Optionally load development data

The main seed requires database and Cloudinary credentials:

```bash
pnpm db:seed
pnpm db:seed:reviews
pnpm db:seed:riders-orders
```

The default password for seeded accounts is `SeedUser123!`. See
[Seeding](seeding.md) before cleanup or reseeding.

## Common development commands

| Command            | Purpose                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| `pnpm start`       | Start the NestJS application                                            |
| `pnpm start:dev`   | Start in watch mode                                                     |
| `pnpm build`       | Compile the production bundle                                           |
| `pnpm start:prod`  | Run the compiled application                                            |
| `pnpm lint`        | Run ESLint with automatic fixes                                         |
| `pnpm format`      | Format source and test files                                            |
| `pnpm test`        | Run unit tests                                                          |
| `pnpm test:e2e`    | Run end-to-end tests                                                    |
| `pnpm test:cov`    | Run unit tests with coverage                                            |
| `pnpm db:generate` | Generate a migration from schema changes                                |
| `pnpm db:migrate`  | Apply pending migrations                                                |
| `pnpm db:push`     | Push schema changes directly; prefer migrations for shared environments |
| `pnpm db:studio`   | Open Drizzle Studio                                                     |

## First manual workflow

After starting the application:

1. Sign up with `POST /auth/signup`.
2. Follow the verification link sent through Resend, or use the token and user
   ID with `POST /auth/verify-email`.
3. Log in with `POST /auth/login` and retain the returned access token and
   refresh-token cookie.
4. Browse `GET /catalog/products`.
5. Add products through `POST /cart/items`.
6. Make a rider available or use the rider seed.
7. Checkout through `POST /orders`.

For request formats and access rules, continue with the
[API reference](api-reference.md).
