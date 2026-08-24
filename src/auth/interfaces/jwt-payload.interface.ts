import { Role } from '../../database/schema/user-roles.schema';

export interface JwtPayload {
  /** Subject — user ID */
  sub: string;
  /** User's current roles */
  roles: Role[];
  /** Issued at (added automatically by @nestjs/jwt) */
  iat?: number;
  /** Expiration (added automatically by @nestjs/jwt) */
  exp?: number;
}
