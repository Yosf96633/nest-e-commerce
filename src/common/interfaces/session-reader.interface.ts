export interface ISessionReader {
  isActive(sessionId: string, userId: string): Promise<boolean>;
}

export const SESSION_READER = Symbol('ISessionReader');
