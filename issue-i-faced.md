# Issues I Faced While Building E-Commerce

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
