import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { AuthenticatedRequest } from '@/common/types/authenticated-request.type';
import type { JwtPayload } from '@/common/types/jwt-payload.type';
import {
  SESSION_READER,
  type ISessionReader,
} from '@/common/interfaces/session-reader.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(SESSION_READER)
    private readonly sessionReader: ISessionReader,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        'Access token is missing',
        'ACCESS_TOKEN_MISSING',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      if (
        payload.type !== 'access' ||
        !payload.sid ||
        !(await this.sessionReader.isActive(payload.sid, payload.sub))
      ) {
        throw new Error('Inactive session');
      }
      request.user = payload;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired access token',
        'INVALID_ACCESS_TOKEN',
      );
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
