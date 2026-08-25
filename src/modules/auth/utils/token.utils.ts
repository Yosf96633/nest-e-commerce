import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';

@Injectable()
export class GenerateTokenUtil {
  static generateToken(): string {
    const rawToken = crypto.randomBytes(32).toString('hex');
    return rawToken;
  }
  static async hashToken(token:string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(token, saltRounds);
  }

  static async compareToken(
    token: string,
    hashToken: string,
  ): Promise<boolean> {
    return bcrypt.compare(token, hashToken);
  }
}
