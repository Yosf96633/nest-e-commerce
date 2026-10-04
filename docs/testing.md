# Testing

## Commands

| Command                 | Scope                                                     |
| ----------------------- | --------------------------------------------------------- |
| `pnpm build`            | TypeScript/Nest production compilation                    |
| `pnpm test`             | Jest unit tests under `src/`                              |
| `pnpm test --runInBand` | Unit tests serially, useful while diagnosing setup errors |
| `pnpm test:watch`       | Unit tests in watch mode                                  |
| `pnpm test:cov`         | Unit tests with coverage report                           |
| `pnpm test:e2e`         | Supertest end-to-end test configuration under `test/`     |
| `pnpm lint`             | ESLint with automatic fixes                               |

## Current coverage shape

Service tests exist for authentication, users, applications/admin, seller
stores/products, catalog, cart, reviews, riders, and orders. Several controller
and infrastructure provider specs also exist. The order, rider, cart, catalog,
and review service tests exercise the newer repository-interface boundaries
with mocks.

The current e2e suite is only the generated root-route smoke test. It does not
yet prove the full signup-to-order workflow.

## Current status

At the documentation audit, `pnpm build` passed. The full unit command reported
14 passing suites and 9 failing suites (45 passing tests and 7 failing tests).
The failures are primarily test-harness debt:

- one auth source import uses `src/...`, which the current Jest alias mapping
  does not resolve;
- older controller specs do not provide mocked JWT/role guard dependencies;
- older service specs do not provide their repository-interface tokens;
- Cloudinary and Resend specs do not provide their injected client tokens.

These failures mean the repository should not claim an all-green test suite.
They do not prevent the production build from compiling, but should be fixed
before treating CI quality as complete. Track them in
[Issues and engineering decisions](issues.md).

## Unit-test convention

Services should be tested through their public methods with repositories and
external integrations mocked at the injection boundary:

```ts
const repository = {
  findById: jest.fn(),
  create: jest.fn(),
};

{
  provide: IRepositoryToken,
  useValue: repository,
}
```

This verifies business decisions without connecting to Neon. Controller tests
should mock the service and either override guards or supply their dependencies.
Cloudinary and Resend tests should inject fake clients rather than call external
services.

## Recommended integration tests

Add database-backed or e2e tests for the highest-risk boundaries:

1. Signup, verification, login, refresh rotation, and logout.
2. Application approval immediately granting seller/rider access.
3. Seller ownership rejection for another seller's store/product.
4. Cart stock validation and catalog visibility.
5. Two concurrent checkouts competing for one rider or limited inventory.
6. Order cancellation restoring stock and releasing the rider.
7. Rider transition enforcement and ownership.
8. Review uniqueness and author-only mutations.
9. Account deletion preserving anonymized order snapshots.

Use a disposable test database. Do not point destructive integration tests at
the shared development or production database.

## Before opening a pull request

```bash
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

If a command fails, record whether it is a product regression, environment
problem, or known test-harness issue. Do not hide failures with
`--passWithNoTests` or disabled suites.
