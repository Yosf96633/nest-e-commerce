# Issues and Engineering Decisions

This document records important architectural and implementation problems I
encountered while building the e-commerce application, along with the solutions
I applied.

## 1. Stale Roles in JWTs After Role Assignment

### Problem

A newly verified user initially receives the **customer** role, which is stored
in the **user_roles** table. If the user later applies to become a seller and an
administrator approves the application, the **seller** role is added to the
same table.

The problem occurs when authorization roles are also stored inside the JWT. An
already-issued token still contains the old role information, such as
**[customer]**, because a JWT payload is immutable after the token has been
issued. This creates a synchronization problem between the roles in the
database and the stale roles in the user's token.

### Solution Applied

Authorization roles are not stored in the JWT. The token contains only the
essential identity information:

- User ID (**sub**)
- Email address

The database remains the source of truth for authorization. When a protected
route is accessed, **RoleGuard** uses the role-reader abstraction to retrieve
the user's current roles and compares them with the roles required by the route
through NestJS's **Reflector**.

### Result

Role changes take effect immediately. When an administrator adds or removes a
role, the application does not need to synchronize, refresh, or reissue the
existing access token solely because the user's authorization roles changed.

---

## 2. ORM Type Coupling Despite Using the Repository Pattern

### Problem

The application used repository interfaces, and each Drizzle repository
implemented the relevant interface. At first, this appeared to make the
persistence layer replaceable.

However, repository interfaces, services, DTOs, interceptors, and guards were
importing types inferred from Drizzle schemas, including types such as **User**,
**NewUser**, **Product**, **NewProduct**, **Store**, and **Application**.

For example, a repository contract effectively looked like this:

    interface IProductRepository {
      createProduct(product: NewProduct): Promise<Product>;
    }

Although the service communicated with an interface, that interface was still
defined by Drizzle. Replacing Drizzle with another ORM or database would
therefore require changes outside the infrastructure layer. The repository
pattern existed structurally, but its abstraction boundary was leaking
persistence-specific types.

There was also a stronger violation in **RoleGuard**, which directly used
**DatabaseService**, Drizzle table definitions, and Drizzle query operators.

### Solution Applied

Persistence-independent entities, constants, and operation-specific data
contracts were moved into the application modules. Repository interfaces and
services now depend on these module-owned contracts instead of ORM-generated
types.

Examples of these contracts include:

- **User** and **CreateUserData**
- **Product**, **CreateProductData**, and **UpdateProductData**
- **Store**, **CreateStoreData**, and **UpdateStoreData**
- **Application**, **CreateApplicationData**, and
  **ReviewApplicationData**
- Shared role types and values

The Drizzle repositories now act as adapters. They receive application-owned
input contracts, translate them into Drizzle-compatible values, execute
database queries, and map the resulting database records back into application
entities.

The dependency direction is now:

    Controller -> Service -> Repository interface / application entity
                                  ^
                                  |
                        Drizzle repository adapter
                                  |
                            Drizzle schema

For authorization, **RoleGuard** now depends on an **IRoleReader** abstraction.
The Drizzle-specific role reader implements that interface and is connected
through NestJS dependency injection.

Concrete Drizzle repository classes are still referenced inside NestJS modules.
This is intentional because modules serve as the composition root where an
interface is connected to its selected implementation.

### Result

Business logic, DTOs, repository contracts, and guards are no longer defined by
Drizzle schema types. A future database or ORM replacement can be implemented
primarily by creating new repository adapters and changing dependency-injection
bindings, without rewriting the business logic.

---

## 3. Preserving Orders When Accounts or Products Are Deleted

### Problem

Orders are historical business records, but users can delete accounts and
sellers can delete products. Cascading every relationship would erase purchase
history, while restrictive foreign keys would prevent legitimate account and
catalog cleanup.

### Solution Applied

The live references from orders are nullable and use `ON DELETE SET NULL`:

- `orders.user_id`;
- `orders.rider_profile_id`;
- `order_items.product_id`.

At checkout, `order_items` stores product name, image, unit price, quantity,
and line total. The order stores the delivery address and totals. These fields
remain useful after live entities disappear.

### Result

Deleting an account anonymizes its historical orders instead of destroying
them. Deleting a product removes it from the live catalog while preserving the
checkout-time item snapshot.

---

## 4. Concurrent Checkout, Stock, and Rider Assignment

### Problem

Two customers can attempt checkout simultaneously. Without locking, both
transactions could select the same available rider or sell the same final unit
of inventory.

### Solution Applied

Checkout runs inside a database transaction. It locks cart products, chooses
an available rider using `FOR UPDATE SKIP LOCKED`, inserts snapshots, performs
a guarded stock decrement, marks the rider unavailable, and clears the cart.
Failure rolls back the whole operation.

### Result

Concurrent requests cannot reserve the same locked rider, and the guarded
stock update prevents inventory from being decremented below availability.

---

## 5. Known Test-Harness Debt

### Current State

The production build compiles, and the newer service suites pass. During the
documentation audit, the full unit run reported 14 passing suites and 9 failing
suites (45 passing tests and 7 failing tests).

The remaining failures are mostly older scaffolding tests rather than proven
business-logic regressions:

- an auth import uses an unmapped `src/...` path in Jest;
- controller tests omit JWT/role guard dependencies;
- older service tests omit repository-interface providers;
- Cloudinary and Resend specs omit their injected client tokens.

### Required Follow-up

Update imports to the configured alias, supply repository/external-client
mocks, and override or configure guards in controller tests. Then expand the
minimal e2e suite to cover authentication, role approval, ownership, checkout,
and fulfillment. See [Testing](testing.md).

---

## 6. Deliberate Demo Limitations

This repository is feature-complete for its documented educational scope, not
a production commerce platform. It deliberately omits:

- payments, refunds, taxes, invoices, and financial reconciliation;
- live rider coordinates and closest-rider/geospatial dispatch;
- notification queues and delivery events;
- wishlists, promotions, coupons, and returns;
- production observability, rate limiting, audit logs, and operational tooling.

These omissions are documented boundaries, not incomplete requirements for the
current demo.
