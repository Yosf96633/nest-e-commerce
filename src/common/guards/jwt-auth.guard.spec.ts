import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard session revocation', () => {
  const payload = {
    sub: '20243823-e478-46ab-a612-09f2c116b11e',
    email: 'user@example.com',
    sid: '0e4f694c-5ac5-4fca-8d7d-a79767807582',
    type: 'access' as const,
  };

  const contextFor = (request: Record<string, any>) =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as any;

  it('accepts an access token belonging to an active session', async () => {
    const sessionReader = { isActive: jest.fn().mockResolvedValue(true) };
    const guard = new JwtAuthGuard(
      { verifyAsync: jest.fn().mockResolvedValue(payload) } as any,
      { get: jest.fn().mockReturnValue('secret') } as any,
      sessionReader,
    );
    const request = { headers: { authorization: 'Bearer access-token' } };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request).toHaveProperty('user', payload);
    expect(sessionReader.isActive).toHaveBeenCalledWith(
      payload.sid,
      payload.sub,
    );
  });

  it('rejects an otherwise valid access token after its session is revoked', async () => {
    const guard = new JwtAuthGuard(
      { verifyAsync: jest.fn().mockResolvedValue(payload) } as any,
      { get: jest.fn().mockReturnValue('secret') } as any,
      { isActive: jest.fn().mockResolvedValue(false) },
    );
    const request = { headers: { authorization: 'Bearer access-token' } };

    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
