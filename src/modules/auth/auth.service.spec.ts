import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let userService: { create: jest.Mock };

  beforeEach(() => {
    userService = {
      create: jest.fn().mockResolvedValue({ id: 'user-1' }),
    };

    const emailVerificationTokenRepo = { create: jest.fn().mockResolvedValue({}) };
    const resendService = { send_verification_email: jest.fn().mockResolvedValue('msg-id') };

    const jwtService = { signAsync: jest.fn(), verifyAsync: jest.fn() };
    const configService = { get: jest.fn() };

    service = new AuthService(
      jwtService as any,
      emailVerificationTokenRepo as any,
      userService as any,
      'http://localhost:3000/verify-email',
      resendService as any,
      configService as any,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash the password before creating a user', async () => {
    const signupDto = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phoneNumber: '1234567890',
      password: 'StrongPass123!',
    };

    await service.signup(signupDto as any);

    expect(userService.create).toHaveBeenCalledTimes(1);
    expect(userService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phoneNumber: '1234567890',
        passwordHash: expect.any(String),
      }),
    );

    const createdUser = userService.create.mock.calls[0][0];
    expect(createdUser.passwordHash).not.toBe(signupDto.password);
  });
});
