import { Role } from '../../../infrastructure/database/schema/user-roles.schema';

export interface JwtPayload {
  /** Subject — user ID */
  sub: string;
  /** User's current roles */
  email: string;
  roles?: Role[];
  /** Issued at (added automatically by @nestjs/jwt) */
  iat?: number;
  /** Expiration (added automatically by @nestjs/jwt) */
  exp?: number;
}
