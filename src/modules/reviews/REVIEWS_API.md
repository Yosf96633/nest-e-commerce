# Reviews API

## Public product reviews

```http
GET /products/:productId/reviews?page=1&limit=20&rating=5&sort=newest
```

`rating` is optional. `sort` accepts `newest`, `oldest`, `highest`, or
`lowest`. The response contains paginated reviews, the unfiltered average and
star distribution for the product, and the filtered pagination totals.

## Create a review

Requires a bearer access token. A user can review an active product only once.

```http
POST /products/:productId/reviews
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "rating": 5,
  "title": "Excellent product",
  "comment": "The product matched its description and works very well."
}
```

## Current user's reviews

```http
GET /reviews/me?page=1&limit=20&sort=newest
Authorization: Bearer <access-token>
```

This endpoint supports the same optional `rating` and `sort` query parameters.

## Update a review

Only the user who created a review can update it. At least one field is
required.

```http
PATCH /reviews/:reviewId
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "rating": 4,
  "comment": "Still a very good product after using it for a few weeks."
}
```

## Delete a review

Only the user who created a review can delete it.

```http
DELETE /reviews/:reviewId
Authorization: Bearer <access-token>
```

The main seed's predictable review account is `customer01@seed.local`. Its
password defaults to `SeedUser123!`, unless `SEED_USER_PASSWORD` was changed.
