# Authentication and Authorization

## Identity model

Every account begins as a row in `users`. After email verification, the user
receives the `customer` role. A user may hold multiple roles from:

```text
customer | seller | rider | admin
```

Seller and rider roles are granted only after an administrator approves the
corresponding application. Roles are stored in the `user_roles` table and are
not embedded in access tokens.

## Signup and verification

`POST /auth/signup` validates the account details, hashes the password with
bcrypt, creates the user and verification token, and asks Resend to send the
verification link.

```json
{
  "firstName": "Ayesha",
  "lastName": "Khan",
  "email": "ayesha@example.com",
  "phoneNumber": "+923001234567",
  "password": "StrongPass123!"
}
```

The link supplies `token` and `userId` to:

```http
POST /auth/verify-email?token=<token>&userId=<uuid>
```

Successful verification marks the account verified and assigns the customer
role. Verification tokens are persisted separately and cascade when their user
is deleted.

## Login and access tokens

`POST /auth/login` accepts an email and password. Successful login returns an
access token and sets the refresh token as an HTTP-only cookie.

Protected requests send:

```http
Authorization: Bearer <access-token>
```

The access-token payload contains identity information such as the user ID in
`sub` and the email address. It intentionally excludes roles. Keeping the
database as the role source of truth means an approved seller or rider can use
their new permissions without waiting for an old access token to expire.

## Refresh-token sessions

Refresh tokens are signed separately, hashed before database storage, and
associated with session information including expiration, user agent, and IP
address when available.

`POST /auth/refresh` performs rotation:

1. Read the refresh token from the `refresh_token` cookie or request body.
2. Verify its signature and expiration.
3. Compare it with the persisted hash.
4. Revoke the previous session record.
5. Issue a new access token and refresh token.
6. Store the new refresh-token hash.

Rotation limits reuse of a stolen old token. `POST /auth/logout` revokes the
current refresh token. Password changes and explicit “revoke all sessions”
operations revoke all stored sessions for that user.

## Guards and role checks

`JwtAuthGuard` validates the bearer token and attaches its payload to the
request. The `@CurrentUser()` decorator gives controllers access to that
payload.

`RoleGuard` reads roles declared through `@Roles(...)`. It resolves current
roles through the role-reader interface backed by PostgreSQL and allows the
request only when the user has a required role.

```text
Request
  -> JwtAuthGuard (is the caller authenticated?)
  -> RoleGuard (does the database currently grant the required role?)
  -> Controller
```

Ownership is a separate check. Having the `seller` role does not permit a
seller to modify another seller's store or product; services and repository
conditions validate ownership using the authenticated user ID. Review and
order mutations use the same owner-scoped approach.

## Seller and rider elevation

An authenticated customer submits:

```http
POST /application/create
Content-Type: application/json

{ "type": "seller" }
```

or:

```json
{ "type": "rider" }
```

An administrator lists pending applications and approves or rejects them. An
approval adds the matching role to `user_roles`; a rejection may include a
reason of up to 1,000 characters.

## Account and session security

- Passwords and refresh tokens are never stored in plaintext.
- API responses must not expose password or token hashes.
- Users can list their active sessions and revoke one or all of them.
- Account deletion requires password confirmation.
- Refresh cookies are HTTP-only, `SameSite=Lax`, scoped to `/auth`, and secure
  in production.
- Authorization roles are checked from the database on each role-protected
  request.

This is an educational backend. Production use would additionally require
rate limiting, account lockout/brute-force controls, secret rotation, audited
administrator actions, stricter CORS/CSRF decisions, and monitoring.
