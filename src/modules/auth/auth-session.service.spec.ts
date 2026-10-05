import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenUtility } from './utils/token.utils';

describe('AuthService session lifecycle', () => {
  const user = {
    id: '20243823-e478-46ab-a612-09f2c116b11e',
    email: 'user@example.com',
    passwordHash: 'password-hash',
    isEmailVerified: true,
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a unique session and refresh-token ID for every login', async () => {
    const jwtService = {
      signAsync: jest.fn((payload: Record<string, string>) =>
        Promise.resolve(JSON.stringify(payload)),
      ),
      verifyAsync: jest.fn(),
    };
    const userService = {
      findByEmail: jest.fn().mockResolvedValue(user),
      createSessionWithRefreshToken: jest.fn().mockResolvedValue(undefined),
    };
    const configService = {
      get: jest.fn((key: string) =>
        key === 'REFRESH_TOKEN_EXPIRATION_TIME' ? '7d' : 'secret',
      ),
    };
    jest.spyOn(TokenUtility, 'compareToken').mockResolvedValue(true);
    jest
      .spyOn(TokenUtility, 'hashToken')
      .mockImplementation((token) => Promise.resolve(`hashed:${token}`));

    const service = new AuthService(
      jwtService as any,
      {} as any,
      userService as any,
      'http://localhost/verify-email',
      {} as any,
      configService as any,
    );
    const response = { cookie: jest.fn() };

    await service.login(
      { email: user.email, password: 'password' },
      response as any,
    );
    await service.login(
      { email: user.email, password: 'password' },
      response as any,
    );

    const firstAccessPayload = jwtService.signAsync.mock.calls[0][0];
    const firstRefreshPayload = jwtService.signAsync.mock.calls[1][0];
    const secondAccessPayload = jwtService.signAsync.mock.calls[2][0];
    const secondRefreshPayload = jwtService.signAsync.mock.calls[3][0];

    expect(firstAccessPayload.sid).not.toBe(secondAccessPayload.sid);
    expect(firstRefreshPayload.jti).not.toBe(secondRefreshPayload.jti);
    expect(firstAccessPayload.sid).toBe(firstRefreshPayload.sid);
    expect(secondAccessPayload.sid).toBe(secondRefreshPayload.sid);
    expect(userService.createSessionWithRefreshToken).toHaveBeenCalledTimes(2);
  });

  it('revokes only the session selected by the supplied refresh token', async () => {
    const sessionId = '0e4f694c-5ac5-4fca-8d7d-a79767807582';
    const tokenId = '46f65916-bbd8-46d2-8e61-a4bd54fc22c0';
    const rawToken = 'device-one-refresh-token';
    const tokenHash = await TokenUtility.hashToken(rawToken);
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: user.id,
        email: user.email,
        sid: sessionId,
        jti: tokenId,
        type: 'refresh',
      }),
    };
    const userService = {
      findById: jest.fn().mockResolvedValue(user),
      findRefreshTokenById: jest.fn().mockResolvedValue({
        id: tokenId,
        userId: user.id,
        sessionId,
        tokenHash,
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
        revokedAt: null,
        replacedBy: null,
      }),
      revokeSessionById: jest.fn().mockResolvedValue(true),
    };
    const service = new AuthService(
      jwtService as any,
      {} as any,
      userService as any,
      'http://localhost/verify-email',
      {} as any,
      { get: jest.fn().mockReturnValue('secret') } as any,
    );
    const response = { clearCookie: jest.fn() };

    await service.logout(rawToken, response as any);

    expect(userService.findRefreshTokenById).toHaveBeenCalledWith(
      user.id,
      tokenId,
    );
    expect(userService.revokeSessionById).toHaveBeenCalledWith(
      user.id,
      sessionId,
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ path: '/auth' }),
    );
  });

  it('rejects a refresh token whose session does not match its database row', async () => {
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: user.id,
        email: user.email,
        sid: '0e4f694c-5ac5-4fca-8d7d-a79767807582',
        jti: '46f65916-bbd8-46d2-8e61-a4bd54fc22c0',
        type: 'refresh',
      }),
    };
    const userService = {
      findById: jest.fn().mockResolvedValue(user),
      findRefreshTokenById: jest.fn().mockResolvedValue({
        sessionId: 'd40e443f-6ceb-4455-81d8-950179494407',
      }),
    };
    const service = new AuthService(
      jwtService as any,
      {} as any,
      userService as any,
      'http://localhost/verify-email',
      {} as any,
      { get: jest.fn().mockReturnValue('secret') } as any,
    );

    await expect(
      service.refreshToken('refresh-token', { cookie: jest.fn() } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
