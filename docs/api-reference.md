# API Reference

## Conventions

The examples assume the default base URL:

```text
http://localhost:3000
```

Protected routes require:

```http
Authorization: Bearer <access-token>
```

UUID route parameters are validated where the controller uses NestJS's
`ParseUUIDPipe`. JSON and multipart fields are validated through the global
`ValidationPipe`. Standard NestJS exceptions produce the matching HTTP status,
such as `400`, `401`, `403`, `404`, `409`, or `503`.

Access labels used below:

- **Public**: no access token required.
- **Authenticated**: any valid signed-in user.
- **Customer**, **Seller**, **Rider**, **Admin**: corresponding database role.
- **Owner**: authenticated identity must own the target resource.

## Health route

| Method | Route | Access | Purpose                    |
| ------ | ----- | ------ | -------------------------- |
| `GET`  | `/`   | Public | Basic application response |

## Authentication

| Method | Route                                     | Access                        | Purpose                                              |
| ------ | ----------------------------------------- | ----------------------------- | ---------------------------------------------------- |
| `POST` | `/auth/signup`                            | Public                        | Register and send verification email                 |
| `POST` | `/auth/verify-email?token=...&userId=...` | Public                        | Verify account and assign customer role              |
| `POST` | `/auth/login`                             | Public                        | Return access token and set refresh cookie           |
| `POST` | `/auth/refresh`                           | Refresh token                 | Rotate refresh session and return a new access token |
| `POST` | `/auth/logout`                            | Authenticated + refresh token | Revoke refresh session and clear cookie              |
| `GET`  | `/auth/protected`                         | Authenticated                 | Return protected user data                           |

Signup fields:

| Field         | Rules                                  |
| ------------- | -------------------------------------- |
| `firstName`   | String, 2–100 characters               |
| `lastName`    | String, 2–100 characters               |
| `email`       | Valid email address                    |
| `phoneNumber` | Optional string, maximum 20 characters |
| `password`    | String, 8–128 characters               |

Login accepts `email` and a password of at least eight characters. Refresh and
logout read `refresh_token` from the cookie first and fall back to an optional
`{"refreshToken":"..."}` body.

## User accounts

All routes require authentication. Admin routes additionally require the admin
role.

| Method   | Route                     | Access        | Purpose                                    |
| -------- | ------------------------- | ------------- | ------------------------------------------ |
| `GET`    | `/users/me`               | Authenticated | Get own safe profile and roles             |
| `PATCH`  | `/users/me`               | Authenticated | Update own profile and optional image      |
| `PATCH`  | `/users/profile`          | Authenticated | Compatibility alias for profile update     |
| `DELETE` | `/users/me/profile-image` | Authenticated | Delete own profile image                   |
| `PATCH`  | `/users/me/password`      | Authenticated | Change password and revoke all sessions    |
| `GET`    | `/users/me/sessions`      | Authenticated | List active refresh-token sessions         |
| `DELETE` | `/users/me/sessions/:id`  | Session owner | Revoke one session                         |
| `DELETE` | `/users/me/sessions`      | Authenticated | Revoke all sessions                        |
| `DELETE` | `/users/me`               | Authenticated | Delete account after password confirmation |
| `GET`    | `/users`                  | Admin         | List users with roles                      |
| `GET`    | `/users/:id`              | Admin         | Get one user with roles                    |

Profile fields are optional: `firstName` and `lastName` must be 2–100
characters, and `phoneNumber` has a 20-character maximum. Use
`multipart/form-data` with the `profileImage` field to upload an image.

```json
{
  "currentPassword": "CurrentPass123!",
  "newPassword": "NewPass456!"
}
```

Account deletion accepts `{"password":"CurrentPass123!"}`. Password values
must contain at least eight characters.

## Seller and rider applications

| Method  | Route                                | Access        | Purpose                                        |
| ------- | ------------------------------------ | ------------- | ---------------------------------------------- |
| `POST`  | `/application/create`                | Authenticated | Submit a `seller` or `rider` application       |
| `GET`   | `/admin/applications`                | Admin         | List all applications                          |
| `GET`   | `/admin/applications?status=pending` | Admin         | Filter by `pending`, `approved`, or `rejected` |
| `PATCH` | `/admin/approve-applications/:id`    | Admin         | Approve and grant the requested role           |
| `PATCH` | `/admin/reject-applications/:id`     | Admin         | Reject with optional reason                    |

Create body:

```json
{ "type": "seller" }
```

Reject body:

```json
{ "rejectionReason": "Please provide complete information." }
```

The rejection reason is optional and limited to 1,000 characters.

## Stores

The controller requires authentication for all store routes. Mutations and the
“my stores” route additionally require the seller role; mutations also verify
ownership.

| Method   | Route                     | Access         | Purpose                |
| -------- | ------------------------- | -------------- | ---------------------- |
| `POST`   | `/store`                  | Seller         | Create an owned store  |
| `GET`    | `/store/my-stores`        | Seller         | List own stores        |
| `GET`    | `/store/seller/:sellerId` | Authenticated  | List a seller's stores |
| `GET`    | `/store/id/:id`           | Authenticated  | Find store by UUID     |
| `GET`    | `/store/:slug`            | Authenticated  | Find store by slug     |
| `PATCH`  | `/store/:id`              | Seller + owner | Update an owned store  |
| `DELETE` | `/store/:id`              | Seller + owner | Delete an owned store  |

Create/update use `multipart/form-data`. `name` is 3–255 characters and
`description` is optional with a 1,000-character maximum. Optional file fields
are `profileImage` and `coverImage`, each limited to 5 MB and supported image
formats.

## Seller products

These routes require authentication and the seller role. Product-specific
operations verify that the product's store belongs to the current seller.

| Method   | Route                  | Access         | Purpose                            |
| -------- | ---------------------- | -------------- | ---------------------------------- |
| `POST`   | `/product`             | Seller         | Create a product in an owned store |
| `GET`    | `/product/my-products` | Seller         | List products across own stores    |
| `GET`    | `/product/:identifier` | Seller + owner | Find owned product by UUID or slug |
| `PATCH`  | `/product/:id`         | Seller + owner | Update an owned product            |
| `DELETE` | `/product/:id`         | Seller + owner | Delete product and remote images   |

Product create/update use `multipart/form-data` with up to ten `images` files.

| Field         | Rules                                                              |
| ------------- | ------------------------------------------------------------------ |
| `storeId`     | Required UUID on create                                            |
| `name`        | Required on create, 2–255 characters                               |
| `description` | Optional, maximum 5,000 characters                                 |
| `price`       | Non-negative number, maximum two decimal places                    |
| `stock`       | Optional non-negative integer                                      |
| `status`      | `draft`, `active`, or `inactive`                                   |
| `images`      | At least one image on create; active products must retain an image |

## Public catalog

Catalog routes return only active products from active stores.

| Method | Route                                 | Access | Purpose                             |
| ------ | ------------------------------------- | ------ | ----------------------------------- |
| `GET`  | `/catalog/products`                   | Public | Search and paginate active products |
| `GET`  | `/catalog/products/:identifier`       | Public | Find active product by UUID or slug |
| `GET`  | `/catalog/stores/:storeSlug/products` | Public | List active products for one store  |

List query parameters:

| Parameter  | Default     | Rules                                       |
| ---------- | ----------- | ------------------------------------------- |
| `page`     | `1`         | Integer greater than or equal to 1          |
| `limit`    | `20`        | Integer from 1 through 100                  |
| `q`        | None        | Product name/description search             |
| `minPrice` | None        | Non-negative number                         |
| `maxPrice` | None        | Non-negative number                         |
| `store`    | None        | Store slug; path route overrides this value |
| `sortBy`   | `createdAt` | `createdAt`, `price`, or `name`             |
| `order`    | `desc`      | `asc` or `desc`                             |

List responses contain `data` and `pagination` with `page`, `limit`, `total`,
and `totalPages`.

## Cart

All cart routes require authentication. The cart belongs to the authenticated
user; there is no separate cart ID.

| Method   | Route                    | Access        | Purpose                             |
| -------- | ------------------------ | ------------- | ----------------------------------- |
| `GET`    | `/cart`                  | Authenticated | Get items, item count, and subtotal |
| `POST`   | `/cart/items`            | Authenticated | Add or increment an active product  |
| `PATCH`  | `/cart/items/:productId` | Authenticated | Set item quantity                   |
| `DELETE` | `/cart/items/:productId` | Authenticated | Remove one item                     |
| `DELETE` | `/cart`                  | Authenticated | Clear the cart                      |

Add body:

```json
{
  "productId": "00000000-0000-4000-8000-000000000000",
  "quantity": 2
}
```

Update accepts `{"quantity":3}`. Quantities are integers of at least one and
cannot exceed available stock. Products and their stores must both be active.

## Reviews

| Method   | Route                          | Access        | Purpose                           |
| -------- | ------------------------------ | ------------- | --------------------------------- |
| `GET`    | `/products/:productId/reviews` | Public        | List reviews and rating summary   |
| `POST`   | `/products/:productId/reviews` | Authenticated | Create one review for the product |
| `GET`    | `/reviews/me`                  | Authenticated | List current user's reviews       |
| `PATCH`  | `/reviews/:reviewId`           | Author        | Update own review                 |
| `DELETE` | `/reviews/:reviewId`           | Author        | Delete own review                 |

Create body:

```json
{
  "rating": 5,
  "title": "Excellent product",
  "comment": "The product matched its description and works very well."
}
```

Rating is an integer from 1 through 5. Title length is 3–120 characters and
comment length is 10–2,000 characters. Update uses the same rules with optional
fields, but at least one field must be supplied by the caller.

Review list parameters are `page`, `limit`, optional `rating`, and `sort` with
`newest`, `oldest`, `highest`, or `lowest`. The product response includes the
unfiltered count, average, and 1–5 star distribution plus filtered pagination.

## Rider profiles

All routes require the rider role.

| Method  | Route                 | Access | Purpose                            |
| ------- | --------------------- | ------ | ---------------------------------- |
| `POST`  | `/rider/profile`      | Rider  | Create the current rider's profile |
| `GET`   | `/rider/profile`      | Rider  | Get own profile                    |
| `PATCH` | `/rider/profile`      | Rider  | Update own vehicle/profile fields  |
| `PATCH` | `/rider/availability` | Rider  | Set availability                   |

`vehicleType` accepts `bicycle`, `motorcycle`, `car`, or `van`. Motor vehicles
must have plate and license numbers. These identifiers are normalized to
uppercase and unique. A rider with an active order cannot set availability to
`true`.

```json
{
  "vehicleType": "motorcycle",
  "vehicleMake": "Honda",
  "vehicleModel": "CG 125",
  "vehicleColor": "Black",
  "plateNumber": "ABC-123",
  "licenseNumber": "LIC-123"
}
```

Availability body: `{"isAvailable":true}`.

## Orders

| Method  | Route                           | Access           | Purpose                            |
| ------- | ------------------------------- | ---------------- | ---------------------------------- |
| `POST`  | `/orders`                       | Customer         | Checkout cart and assign rider     |
| `GET`   | `/orders`                       | Customer         | List own orders                    |
| `GET`   | `/orders/:orderId`              | Customer + owner | Get one owned order                |
| `PATCH` | `/orders/:orderId/cancel`       | Customer + owner | Cancel an assigned order           |
| `GET`   | `/orders/rider/current`         | Rider            | List assigned and picked-up orders |
| `PATCH` | `/orders/rider/:orderId/status` | Assigned rider   | Move fulfillment forward           |

Checkout body:

```json
{
  "deliveryAddress": {
    "recipientName": "Ayesha Khan",
    "phoneNumber": "+923001234567",
    "addressLine1": "123 Demo Street",
    "addressLine2": "Apartment 4",
    "city": "Karachi",
    "postalCode": "75500",
    "instructions": "Call at the gate"
  }
}
```

Checkout can fail with an empty cart, unavailable product/store, insufficient
stock, or no available rider. The no-rider case returns service unavailable.
Prices and the fixed `5.00` delivery fee are calculated by the server.

Rider status body:

```json
{ "status": "picked_up" }
```

Only `picked_up` and `delivered` are accepted. Valid order transitions are
documented in [Business flows](business-flows.md).
