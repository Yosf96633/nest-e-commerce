# Configuration

The application loads `.env` from the repository root through NestJS
`ConfigModule`. Do not commit real secrets.

## Runtime variables

| Variable                        | Required                | Default                              | Used for                                                            |
| ------------------------------- | ----------------------- | ------------------------------------ | ------------------------------------------------------------------- |
| `NODE_ENV`                      | No                      | Node default                         | Production cookie security and disabling seed scripts in production |
| `PORT`                          | No                      | `3000`                               | HTTP listen port                                                    |
| `DATABASE_URL`                  | Yes                     | None                                 | Neon/PostgreSQL connection used by the app, migrations, and seeds   |
| `JWT_SECRET`                    | Yes                     | None                                 | Access-token signing and verification                               |
| `REFRESH_TOKEN_SECRET`          | Yes                     | None                                 | Refresh-token signing and verification                              |
| `REFRESH_TOKEN_EXPIRATION_TIME` | Yes                     | None                                 | Refresh-token lifetime, for example `7d`                            |
| `EMAIL_VERIFICATION_TOKEN_URL`  | No                      | `http://localhost:3000/verify-email` | Base URL included in verification messages                          |
| `RESEND_API_KEY`                | Yes for signup email    | None                                 | Resend client authentication                                        |
| `CLOUDINARY_CLOUD_NAME`         | Yes for uploads/seeding | None                                 | Cloudinary account name                                             |
| `CLOUDINARY_API_KEY`            | Yes for uploads/seeding | None                                 | Cloudinary public API credential                                    |
| `CLOUDINARY_API_SECRET`         | Yes for uploads/seeding | None                                 | Cloudinary secret credential                                        |

Use long, unrelated values for `JWT_SECRET` and `REFRESH_TOKEN_SECRET`. Changing
either secret invalidates tokens signed with its previous value.

## Seed variables

| Variable                     | Default                       | Meaning                                              |
| ---------------------------- | ----------------------------- | ---------------------------------------------------- |
| `SEED_SELLERS`               | `2`                           | Number of seller accounts created by the main seed   |
| `SEED_CUSTOMERS`             | `20`                          | Number of customer accounts created by the main seed |
| `SEED_MAX_STORES_PER_SELLER` | `2`                           | Maximum stores assigned to each seeded seller        |
| `SEED_UPLOAD_CONCURRENCY`    | `4`                           | Maximum concurrent Cloudinary uploads                |
| `SEED_USER_PASSWORD`         | `SeedUser123!`                | Shared password for development seed accounts        |
| `SEED_PRODUCT_IMAGE_DIR`     | Built-in seed asset directory | Absolute or relative product fixture directory       |

Seed scripts reject `NODE_ENV=production`. They use the reserved `seed.local`
email domain and should only be run against a development database.

## Cookies and clients

The refresh token cookie is named `refresh_token` and scoped to `/auth`. It is
HTTP-only, uses `SameSite=Lax`, and becomes `Secure` when
`NODE_ENV=production`. Non-browser clients may send a refresh token in the
request body instead:

```json
{
  "refreshToken": "<token>"
}
```

## Upload limits

- Profile image: one file, maximum 5 MB.
- Store images: `profileImage` and `coverImage`, maximum 5 MB each.
- Product images: `images`, one to ten files, maximum 5 MB each.
- Supported image formats: JPG, JPEG, PNG, and WebP.

Cloudinary stores the binary assets. PostgreSQL stores their secure URLs and
public IDs so replacements and deletions can clean up remote files.
