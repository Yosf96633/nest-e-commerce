export interface JwtPayload {
  sub: string; // user id
  email: string;
  sid: string;
  type: 'access';
  iat?: number;
  exp?: number;
}

// Augment Express.User so req.user is typed project-wide
declare global {
  namespace Express {
    interface User extends JwtPayload {}
  }
}
