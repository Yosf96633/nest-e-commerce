# Authentication System — End-to-End Implementation Specification

## Project Context

I am building a multi-vendor e-commerce backend using:

* NestJS
* PostgreSQL
* Drizzle ORM
* Neon PostgreSQL

The project uses a modular architecture with:

* Repository pattern
* Repository interface + implementation
* Service layer for business logic
* Controllers only for HTTP concerns
* NestJS dependency injection
* Modules may import other modules, but cross-module database access must happen through exported services rather than directly accessing another module's repositories.

## Important: Do NOT Use BetterAuth

Do not install, configure, generate, or use BetterAuth.

I previously considered BetterAuth but intentionally decided not to use it because this application requires a custom JWT + refresh-token authentication architecture.

Do not generate BetterAuth's:

* session table
* account table
* BetterAuth user table
* BetterAuth verification table
* BetterAuth session management
* BetterAuth adapters
* BetterAuth authentication handlers

Authentication must be implemented directly with NestJS, PostgreSQL, Drizzle ORM, and JWT.

---

# Authentication Architecture

The authentication system must use:

1. Short-lived JWT access tokens
2. Long-lived refresh tokens
3. Refresh-token rotation
4. HttpOnly cookies for refresh tokens
5. Database persistence for refresh-token management
6. Email verification during registration
7. Role-based authorization
8. Multiple roles per user

The user should NOT have a single `role` column.

A user may simultaneously have multiple roles.

Example:

```text
User
 ├── customer
 ├── seller
 └── admin
```

Another user may only have:

```text
User
 └── customer
```

---

# Access Token

The access token must be a JWT.

The JWT should be short-lived.

Do not hardcode the expiry directly into business logic.

Make the expiry configurable through environment variables.

For example:

```text
JWT_ACCESS_EXPIRES_IN=15m
```

The exact default can be chosen sensibly, but the value must be configurable.

The JWT payload should contain the minimum information necessary for authentication and authorization.

At minimum, it should contain:

```text
sub
roles
iat
exp
```

Where:

* `sub` = user ID
* `roles` = user's roles
* `iat` = issued-at timestamp
* `exp` = expiration timestamp

Do not put sensitive information such as passwords, password hashes, or unnecessary personal information into the JWT.

The access token must be sent by the client using:

```text
Authorization: Bearer <access-token>
```

The backend must validate the JWT on protected routes.

After successful validation, expose the authenticated user information through:

```text
request.user
```

---

# Refresh Token

The refresh token must be separate from the access JWT.

The refresh token must be long-lived and configurable.

For example:

```text
JWT_REFRESH_EXPIRES_IN=7d
```

The exact expiry must be configurable.

The refresh token must NOT be placed in the Authorization header.

The refresh token must be stored in an HttpOnly cookie.

The cookie should use appropriate security settings:

* HttpOnly
* Secure in production
* SameSite configured appropriately
* Appropriate expiration/max-age
* Appropriate path

Do not expose the refresh token to frontend JavaScript.

The browser should automatically send the refresh-token cookie when calling the refresh endpoint.

---

# Refresh Token Database Storage

Never store raw refresh tokens in PostgreSQL.

Generate a secure random refresh token.

Give the raw token to the browser through the HttpOnly cookie.

Store only a cryptographic hash of the refresh token in the database.

The database must therefore be able to:

* identify the user
* verify a refresh token
* determine whether it has expired
* determine whether it has been revoked
* rotate it
* revoke it
* support multiple authenticated devices/sessions

A single refresh-token field must NOT be stored on the `users` table.

One user may have multiple refresh tokens.

Example:

```text
User
 ├── Laptop refresh token
 ├── Phone refresh token
 └── Tablet refresh token
```

---

# Refresh Token Rotation

Implement refresh-token rotation.

Example:

```text
Login
 ├── Access Token A
 └── Refresh Token R1

Refresh
 ├── revoke R1
 ├── Access Token B
 └── Refresh Token R2

Refresh
 ├── revoke R2
 ├── Access Token C
 └── Refresh Token R3
```

Once a refresh token has been rotated/revoked, it must not be reusable.

The system should prevent refresh-token reuse.

If practical within the chosen design, detect reuse of an already-revoked refresh token and revoke the associated refresh-token session/family appropriately.

Do not implement an unlimited token chain without revocation.

---

# Authentication Tables

Design the database around the following authentication concepts.

## users

The users table represents the core identity.

It should contain appropriate fields such as:

```text
id
first_name
last_name
username
email
phone_number
password_hash
profile_image
is_email_verified
created_at
updated_at
```

Important:

* Email should have an appropriate uniqueness constraint.
* Passwords must never be stored in plaintext.
* Store a secure password hash.
* `is_email_verified` should represent email verification status.
* Do NOT include a single `role` column.

Do not add unnecessary fields without explaining why they are needed.

## user_roles

A separate user-role relationship is required.

Conceptually:

```text
user_roles
-----------
user_id
role
```

Allowed roles currently are:

```text
customer
seller
admin
```

A user may have multiple roles.

Example:

```text
user_roles

user_id | role
--------|--------
1       | customer
1       | seller
1       | admin
```

Use appropriate primary-key and foreign-key constraints.

Prevent duplicate role assignments for the same user.

Do not implement roles as a PostgreSQL array unless there is a compelling architectural reason.

The intended design is a normalized `user_roles` table.

---

# refresh_tokens

Create a dedicated refresh-token persistence table.

It should contain the information necessary to securely manage refresh sessions/tokens.

At minimum, it should support:

* token identity
* user association
* hashed token
* expiration
* creation time
* revocation
* rotation/replacement
* optional device/session metadata if useful

Do not store the raw refresh token.

The table must support multiple active refresh tokens for one user.

---

# Email Verification

Registration must require email verification.

The intended flow is:

```text
Register
   ↓
Create user
   ↓
is_email_verified = false
   ↓
Generate email verification token
   ↓
Send verification email
   ↓
User clicks verification link
   ↓
Verify token
   ↓
is_email_verified = true
```

Do not automatically authenticate an unverified account unless the implementation/design explicitly requires it.

The email-verification mechanism must be secure and time-limited.

Do not reuse the access JWT as an email-verification token.

Do not assume that email verification and authentication are the same thing.

Design a secure mechanism for storing/managing verification tokens.

If a separate `email_verification_tokens` table is appropriate, use one.

Do not introduce unnecessary tables without explaining the reasoning.

---

# Authentication Flow

## Registration

Endpoint:

```text
POST /auth/register
```

Expected flow:

```text
Request
  ↓
Validate input
  ↓
Check email/username uniqueness
  ↓
Hash password
  ↓
Create user
  ↓
Assign default role(s)
  ↓
Create email verification token
  ↓
Send verification email
```

Do not issue an authenticated access token for an unverified user unless there is a deliberate reason.

The response must not expose sensitive information such as the password hash.

---

# Email Verification

Provide an endpoint such as:

```text
GET /auth/verify-email?token=...
```

or an equivalent REST design.

The endpoint must:

* validate the verification token
* verify expiration
* verify that it has not already been consumed
* mark the user's email as verified
* invalidate/consume the verification token

Handle invalid, expired, and already-used tokens safely.

---

# Login

Endpoint:

```text
POST /auth/login
```

Flow:

```text
Credentials
   ↓
Find user
   ↓
Verify password
   ↓
Verify email is verified
   ↓
Load user roles
   ↓
Generate access JWT
   ↓
Generate refresh token
   ↓
Hash refresh token
   ↓
Store refresh-token record
   ↓
Set refresh token as HttpOnly cookie
   ↓
Return access token
```

The access token may be returned in the JSON response.

The refresh token itself must NOT be returned in the JSON response.

The refresh token should be delivered through the HttpOnly cookie.

---

# Refresh

Endpoint:

```text
POST /auth/refresh
```

Flow:

```text
Browser
   ↓
Refresh request
   ↓
Browser automatically attaches HttpOnly refresh cookie
   ↓
Server extracts refresh token
   ↓
Hash/verify token
   ↓
Find token record
   ↓
Check expiration
   ↓
Check revocation
   ↓
Load associated user
   ↓
Load current roles
   ↓
Revoke old refresh token
   ↓
Generate new access token
   ↓
Generate new refresh token
   ↓
Store new refresh-token hash
   ↓
Replace refresh cookie
   ↓
Return new access token
```

Important:

The new access token should be generated using the user's current roles from the database rather than blindly copying potentially stale authorization information.

---

# Logout

Provide:

```text
POST /auth/logout
```

The endpoint should:

* identify the refresh token from the HttpOnly cookie
* revoke the corresponding refresh-token record
* clear the refresh-token cookie

Do not simply delete the user account or modify the user's authentication identity.

Logout should invalidate the relevant refresh session.

If useful, also design a future-compatible mechanism for:

```text
logout current device
logout all devices
```

but do not implement unnecessary functionality unless it naturally fits the architecture.

---

# JWT Authentication in NestJS

Use NestJS guards/strategies appropriately.

Protected endpoints should require a valid access JWT.

The JWT authentication mechanism should:

1. Extract the bearer token
2. Verify signature
3. Verify expiration
4. Validate payload
5. Load or identify the authenticated user as appropriate
6. Attach authenticated identity/authorization information to:

```text
request.user
```

Do not put database queries directly into controllers.

Keep authentication business logic inside the Auth service/repository architecture.

---

# Role Authorization

Implement role-based authorization in a NestJS-native manner.

The intended conceptual flow is:

```text
JWT
 ↓
request.user
 ↓
roles
 ↓
RolesGuard
 ↓
Controller endpoint
```

For example:

```text
@Roles('seller')
```

or an equivalent clean design.

A user with:

```text
["customer", "seller"]
```

must be allowed to access seller functionality.

A user with:

```text
["customer", "seller", "admin"]
```

must be allowed to access all three role-protected areas.

Do not treat roles as mutually exclusive.

---

# Admin Behavior

Admin is an additional capability, not a mutually exclusive identity.

An admin may also be:

```text
customer
seller
```

unless a specific business rule later restricts it.

Do not create a separate admin authentication system.

Use the same authentication mechanism and authorization system.

---

# Architecture Requirements

Follow the existing project architecture.

Use:

```text
Controller
   ↓
Service
   ↓
Repository
   ↓
Drizzle / PostgreSQL
```

Controllers must not directly access Drizzle.

Services must not directly access the database.

Repositories own database access.

Use repository interfaces and concrete implementations.

Use NestJS dependency injection.

Cross-module access must happen through exported services rather than exposing repositories directly.

Keep authentication concerns inside the Auth module.

Keep user persistence/user-domain concerns inside the Users module where appropriate.

Avoid circular module dependencies.

---

# Security Requirements

Implement secure defaults.

At minimum:

* bcrypt or Argon2 for password hashing
* cryptographically secure refresh-token generation
* hashed refresh tokens in database
* HttpOnly refresh cookie
* Secure cookie in production
* appropriate SameSite configuration
* configurable JWT expiration
* configurable refresh-token expiration
* email verification expiration
* validation of request DTOs
* no password/hash exposure in responses
* no refresh-token exposure to JavaScript
* no raw refresh-token persistence
* no sensitive information in JWT payload
* protection against refresh-token reuse
* appropriate database constraints

Do not log passwords, access tokens, refresh tokens, or verification tokens.

---

# Environment Variables

Use environment variables for secrets and expiration configuration.

Do not hardcode secrets.

At minimum, provide configuration for:

```text
JWT_ACCESS_SECRET
JWT_ACCESS_EXPIRES_IN
JWT_REFRESH_SECRET
JWT_REFRESH_EXPIRES_IN
```

Also configure email-related credentials through environment variables rather than hardcoding them.

Use a clear `.env.example` file containing variable names only, never real secrets.

---

# API Response Expectations

Login and refresh should return the access token in a clean JSON response.

Example conceptual response:

```json
{
  "accessToken": "..."
}
```

Do not return:

```json
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

The refresh token belongs in the HttpOnly cookie.

Registration and verification responses must not leak sensitive information.

---

# Important Constraints

Do NOT:

* use BetterAuth
* use session-based authentication
* generate BetterAuth schemas
* create a generic session table just because many auth tutorials do
* store refresh tokens directly on users
* store raw refresh tokens
* store passwords in plaintext
* put passwords or password hashes in JWTs
* use a single role column on users
* put authentication logic inside controllers
* access Drizzle directly from services/controllers
* expose repositories across modules
* generate unnecessary code before the architecture is understood

---

# Implementation Process

Before writing the implementation:

1. Inspect the existing project structure.
2. Inspect the installed dependencies.
3. Do not overwrite unrelated existing configuration.
4. Identify what is already configured for NestJS, Drizzle, PostgreSQL, and Neon.
5. Propose the exact authentication module structure.
6. Propose the exact database tables and relationships.
7. Explain any additional table that you believe is necessary.
8. Explain important security decisions.
9. Then implement the complete authentication system.

The final implementation should be production-oriented but not unnecessarily over-engineered.

After implementation:

1. Verify TypeScript compilation.
2. Verify NestJS module dependency wiring.
3. Verify Drizzle schema generation.
4. Verify database migration generation.
5. Do NOT automatically push destructive schema changes to the database without explicit approval.
6. Provide the migration command that I should run.
7. Provide a concise API testing flow for:

   * register
   * verify email
   * login
   * protected request
   * access-token expiration
   * refresh
   * logout

The implementation should be complete enough that I can run the migration, start the NestJS application, and test the entire authentication lifecycle end to end.

Before making any architectural deviation from this specification, explain the deviation and its reason.
