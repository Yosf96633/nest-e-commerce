# Documentation

This directory is the source of truth for the e-commerce API's setup,
architecture, behavior, and maintenance notes. Start with
[Getting started](getting-started.md) when running the project locally, or use
the [API reference](api-reference.md) when integrating a client.

## Documentation map

| Document                                                            | Purpose                                                                                       |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [Getting started](getting-started.md)                               | Install dependencies, configure services, migrate the database, seed data, and start the API  |
| [Architecture](architecture.md)                                     | System structure, module boundaries, repository pattern, transactions, and data relationships |
| [API reference](api-reference.md)                                   | Routes, access rules, request formats, filters, and important response behavior               |
| [Authentication and authorization](authentication-authorization.md) | Signup, verification, sessions, JWTs, refresh rotation, roles, and guards                     |
| [Database](database.md)                                             | Tables, relationships, constraints, deletion behavior, migrations, and transaction rules      |
| [Business flows](business-flows.md)                                 | Seller/rider approval, catalog-to-checkout, delivery, cancellation, and reviews               |
| [Configuration](configuration.md)                                   | Environment variables and external-service requirements                                       |
| [Seeding](seeding.md)                                               | Catalog, review, rider, and order seed commands and accounts                                  |
| [Testing](testing.md)                                               | Test commands, test boundaries, current status, and recommended conventions                   |
| [Troubleshooting](troubleshooting.md)                               | Common setup, database, authentication, upload, seed, and test problems                       |
| [Issues and engineering decisions](issues.md)                       | Problems encountered, applied solutions, known limitations, and technical debt                |

## Project scope

The project is a demonstration backend for a multi-role marketplace. It covers
account management, seller and rider approval, store/product ownership, public
catalog browsing, carts, transactional checkout, automatic rider assignment,
order fulfillment, and product reviews.

The documented scope deliberately excludes payment processing, refunds, live
rider GPS tracking, proximity dispatch, wishlists, and production operations.
See [Issues and engineering decisions](issues.md) for the current limitations.

## Source-level module notes

Some modules retain focused API notes next to their source code:

- [`orders/ORDERS_API.md`](../src/modules/orders/ORDERS_API.md)
- [`reviews/REVIEWS_API.md`](../src/modules/reviews/REVIEWS_API.md)
- [`rider/RIDER_API.md`](../src/modules/rider/RIDER_API.md)
- [`users/ACCOUNT_API.md`](../src/modules/users/ACCOUNT_API.md)

The central documents in this directory provide the cross-module view and
should be updated whenever routes, schemas, or business flows change.
