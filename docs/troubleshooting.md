# Troubleshooting

## The application cannot connect to Neon

Symptoms include `fetch failed`, WebSocket connection errors, or a startup
failure while constructing `DatabaseService`.

1. Confirm `DATABASE_URL` exists in the root `.env`.
2. Confirm the Neon project and branch are active.
3. Check that the URL includes the required SSL settings.
4. Check local network, DNS, proxy, or sandbox restrictions.
5. Run `pnpm db:migrate` to distinguish connectivity from missing-schema
   errors.

The runtime uses the WebSocket Neon adapter for transactions. Standalone seed
scripts use the Neon HTTP adapter.

## A table, column, or enum does not exist

The local source is newer than the target database. Apply migrations:

```bash
pnpm db:migrate
```

If a generated migration is missing, update the schema and run
`pnpm db:generate`, review its SQL, then migrate. Do not use `db:push` as a
substitute for committed migration history in shared environments.

## A newly approved seller or rider is still forbidden

Roles are read from the database, not the JWT. Check:

- the application status is `approved`;
- the corresponding row exists in `user_roles`;
- the endpoint declares the expected `@Roles(...)` value;
- both `JwtAuthGuard` and `RoleGuard` are active where required.

The user normally does not need to log in again solely for a role change.

## Refresh or logout says the token is missing

Browser clients must send cookies to `/auth` routes. For cross-origin clients,
configure credentials consistently on both sides. API tools can instead send:

```json
{ "refreshToken": "<token>" }
```

The cookie is scoped to `/auth`, so it is not sent to unrelated paths. In
production it is also marked `Secure` and requires HTTPS.

## Images fail to upload

Confirm all three Cloudinary variables are present. Then check:

- supported type: JPG, JPEG, PNG, or WebP;
- maximum size: 5 MB per file;
- correct multipart field (`profileImage`, `coverImage`, or `images`);
- maximum ten product images;
- Cloudinary credentials and account limits.

Product creation requires at least one image. Activating a product also
requires an image in the resulting product state.

## Checkout reports no available rider

At least one rider must:

- have the rider role;
- have a rider profile;
- have `is_available = true`;
- not already be reserved by another checkout.

Create demo riders with:

```bash
pnpm db:seed:riders-orders
```

The seed intentionally leaves delivered/cancelled example riders available.

## Checkout reports unavailable product or insufficient stock

Checkout revalidates data even when the cart accepted it earlier. Confirm that
both product and store remain active and that current stock is at least the cart
quantity. This behavior prevents stale carts from bypassing inventory rules.

## A rider cannot become available

Riders with an `assigned` or `picked_up` order cannot set availability to
`true`. Complete the order or cancel it through the allowed workflow. Manually
changing only the rider flag would break order/availability consistency.

## A seed says records already exist

The main seed intentionally refuses to create a second complete catalog under
the `seed.local` namespace. Clean it first:

```bash
pnpm db:seed:cleanup
```

Review and rider/order seeds are rerunnable and should not require cleanup.
Remember that cleanup preserves historical orders by nulling deleted foreign
keys.

## TypeScript reports a nullable foreign-key mismatch

Historical order references use `ON DELETE SET NULL`. Domain types must reflect
that behavior, for example `Order.userId: string | null` and
`OrderItem.productId: string | null`. Do not hide a mismatch with a cast in the
repository mapper.

If the source type is already correct but VS Code still reports the previous
error, run **TypeScript: Restart TS Server**.

## Jest cannot resolve a dependency

Nest unit tests compile a small testing module and must provide every injected
token. Mock repository symbols, `JwtService`, `ConfigService`, guards, and
external provider tokens as required. Also use the configured `@/` alias or a
relative import instead of an unmapped `src/...` import.

See [Testing](testing.md) for the current known failures.
