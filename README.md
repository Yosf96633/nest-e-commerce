# E-Commerce API

A REST API for an e-commerce platform built with NestJS, TypeScript, PostgreSQL, and Drizzle ORM. It provides authentication, email verification, seller applications, role-based access control, store management, product management, and Cloudinary-backed image uploads.

## Tech stack

- NestJS 11 and TypeScript
- PostgreSQL (Neon serverless driver)
- Drizzle ORM and Drizzle Kit
- JWT access and refresh tokens
- class-validator and class-transformer
- Resend for verification emails
- Cloudinary for store and product images
- Jest for unit and end-to-end tests

## Requirements

- Node.js 20 or newer
- pnpm
- A PostgreSQL database
- Resend and Cloudinary accounts for email and image features

## Getting started

Install dependencies:

```bash
pnpm install
```

Create a `.env` file in the project root:

```dotenv
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://user:password@host/database?sslmode=require

JWT_SECRET=replace-with-a-secure-secret
REFRESH_TOKEN_SECRET=replace-with-another-secure-secret
REFRESH_TOKEN_EXPIRATION_TIME=7d
EMAIL_VERIFICATION_TOKEN_URL=http://localhost:3000/verify-email

RESEND_API_KEY=re_your_api_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Apply the existing database migrations:

```bash
pnpm db:migrate
```

Start the development server:

```bash
pnpm start:dev
```

The API listens on `http://localhost:3000` by default.

## Available commands

| Command | Description |
| --- | --- |
| `pnpm start` | Start the application |
| `pnpm start:dev` | Start in watch mode |
| `pnpm build` | Build the production bundle |
| `pnpm start:prod` | Run the built application |
| `pnpm lint` | Lint and fix TypeScript files |
| `pnpm format` | Format source and test files |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run end-to-end tests |
| `pnpm test:cov` | Run tests with coverage |
| `pnpm db:generate` | Generate a migration from schema changes |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:push` | Push the schema directly to the database |
| `pnpm db:studio` | Open Drizzle Studio |

## API overview

Routes that require authentication expect a bearer access token:

```http
Authorization: Bearer <access-token>
```

The refresh token can be supplied through the `refresh_token` cookie or in the request body.

### Authentication

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/auth/signup` | Register a user and send a verification email |
| `POST` | `/auth/verify-email` | Verify an email using `token` and `userId` query parameters |
| `POST` | `/auth/login` | Sign in and issue access and refresh tokens |
| `POST` | `/auth/refresh` | Rotate a refresh token |
| `GET` | `/auth/protected` | Test an authenticated request |
| `POST` | `/auth/logout` | Revoke the refresh token |

### Applications and administration

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/application/create` | Authenticated | Apply for the `seller` or `rider` role |
| `GET` | `/admin/applications` | Admin | List submitted applications |
| `PATCH` | `/admin/approve-applications/:id` | Admin | Approve an application |
| `PATCH` | `/admin/reject-applications/:id` | Admin | Reject an application |

### Stores

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/store` | Seller | Create a store |
| `GET` | `/store/my-stores` | Seller | List the current seller's stores |
| `GET` | `/store/seller/:sellerId` | Authenticated | List stores for a seller |
| `GET` | `/store/id/:id` | Authenticated | Get a store by ID |
| `GET` | `/store/:slug` | Authenticated | Get a store by slug |
| `PATCH` | `/store/:id` | Seller | Update a store |
| `DELETE` | `/store/:id` | Seller | Delete a store |

Store create and update requests accept `multipart/form-data` image fields named `profileImage` and `coverImage`. Each image may be up to 5 MB and must be JPG, JPEG, PNG, or WebP.

### Products

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/product` | Seller | Create a product |
| `GET` | `/product/my-products` | Seller | List the current seller's products |
| `GET` | `/product/id/:id` | Seller | Get a product by ID |
| `GET` | `/product/slug/:slug` | Seller | Get a product by slug |
| `PATCH` | `/product/:id` | Seller | Update a product |
| `DELETE` | `/product/:id` | Seller | Delete a product |

Product create and update requests accept up to 10 images in a `multipart/form-data` field named `images`. Each image may be up to 5 MB and must be JPG, JPEG, PNG, or WebP.

## Project structure

```text
src/
├── common/                  # Decorators, guards, and shared types
├── infrastructure/
│   ├── cloudinary/          # Image storage integration
│   ├── database/            # Drizzle schema and repositories
│   └── resend/              # Transactional email integration
└── modules/
    ├── admin/               # Application review endpoints
    ├── application/         # Seller and rider applications
    ├── auth/                # Authentication and email verification
    ├── seller/              # Store and product management
    └── users/               # User domain and persistence
```

## License

This project is private and unlicensed.
