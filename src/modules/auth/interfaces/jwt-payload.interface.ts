import { AuthRole } from '../types/role.type';

export interface JwtPayload {
  /** Subject — user ID */
  sub: string;
  /** User's current roles */
  email: string;
  /** Stable login-session ID */
  sid: string;
  type: 'access';
  roles?: AuthRole[];
  /** Issued at (added automatically by @nestjs/jwt) */
  iat?: number;
  /** Expiration (added automatically by @nestjs/jwt) */
  exp?: number;
}
