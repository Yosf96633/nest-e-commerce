import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { HashingUtil } from './utils/hashing.util';
import { TokenUtility } from './utils/token.utils';
import {
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
  type IEmailVerificationTokenRepository,
} from './interfaces/email-verification-tokens-repositry.interface';
import { AUTH_USERS, type IAuthUsers } from './interfaces/auth-users.interface';
import type { AuthUser } from './entities/auth-user.entity';
import type {
  CreateEmailVerificationTokenData,
  EmailVerificationToken,
} from './entities/email-verification-token.entity';
import { EMAIL_VERIFICATION_TOKEN_URL } from './auth.constants';
import { ResendService } from '@/infrastructure/resend/resend.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { randomUUID } from 'crypto';

interface RefreshJwtPayload {
  sub: string;
  email: string;
  sid: string;
  jti: string;
  type: 'refresh';
  exp?: number;
}

type TokenDuration = `${number}${'s' | 'm' | 'h' | 'd'}`;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY)
    private readonly emailVerificationTokenRepository: IEmailVerificationTokenRepository,
    @Inject(AUTH_USERS)
    private readonly userService: IAuthUsers,
    @Inject(EMAIL_VERIFICATION_TOKEN_URL)
    private readonly emailVerificationTokenUrl: string,
    private readonly resendService: ResendService,
    private readonly configService: ConfigService,
  ) {}

  private async generateAccessAndRefreshToken(
    user: AuthUser,
    sessionId: string,
    refreshTokenId: string,
    refreshTokenExpiresIn: TokenDuration,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    //Generate JWT Access Token
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      sid: sessionId,
      type: 'access',
    });
    //Generate Refresh Token using jwt and hash it
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        sid: sessionId,
        jti: refreshTokenId,
        type: 'refresh',
      },
      {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: refreshTokenExpiresIn,
      },
    );
    return {
      accessToken,
      refreshToken,
    };
  }

  private getRefreshTokenDuration(): TokenDuration {
    const configured =
      this.configService.get<string>('REFRESH_TOKEN_EXPIRATION_TIME') ?? '7d';
    const match = /^(\d+)([smhd])$/.exec(configured);
    if (!match) {
      throw new InternalServerErrorException(
        'Invalid refresh token expiration configuration',
        'INVALID_REFRESH_TOKEN_EXPIRATION',
      );
    }
    return configured as TokenDuration;
  }

  private getRefreshTokenExpiresAt(duration: TokenDuration): Date {
    const match = /^(\d+)([smhd])$/.exec(duration)!;
    const unitInMilliseconds = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    } as const;
    return new Date(
      Date.now() +
        Number(match[1]) *
          unitInMilliseconds[match[2] as keyof typeof unitInMilliseconds],
    );
  }

  async signup(signupDto: SignUpDto) {
    const { password, ...userData } = signupDto;
    const existingUser = await this.userService.findByEmail(signupDto.email);
    if (existingUser) {
      throw new ConflictException(
        'User with this email already exists',
        'USER_ALREADY_EXISTS',
      );
    }

    const newUser = await this.userService.create({
      ...userData,
      passwordHash: await HashingUtil.hashPassword(password),
    });
    if (!newUser) {
      throw new InternalServerErrorException(
        'Failed to create user',
        'USER_CREATION_FAILED',
      );
    }
    const rawToken = TokenUtility.generateToken();
    const hashedToken = await TokenUtility.hashToken(rawToken);
    console.log(`token=${rawToken}&userId=${newUser.id}`);
    const verificationTokenData: CreateEmailVerificationTokenData = {
      userId: newUser.id,
      tokenHash: hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    };
    let verificationToken: EmailVerificationToken | undefined;
    try {
      verificationToken = await this.emailVerificationTokenRepository.create(
        verificationTokenData,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create verification token',
        'VERIFICATION_TOKEN_CREATION_FAILED',
      );
    }
    const verificationUrl = `${this.emailVerificationTokenUrl}?token=${rawToken}&userId=${newUser.id}`;

    try {
      await this.resendService.send_verification_email(
        newUser.email,
        verificationUrl,
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // remove the created user
      await this.userService.delete(newUser.id);
      // remove the created verification token
      if (verificationToken) {
        await this.emailVerificationTokenRepository.delete(
          verificationToken.id,
        );
      }
      throw new InternalServerErrorException(
        'Failed to send verification email',
        'EMAIL_SENDING_FAILED',
      );
    }

    const { passwordHash, ...safeUser } = newUser;
    return {
      status: true,
      message: 'User created successfully and verification email sent',
      user: safeUser,
    };
  }

  async verifyEmail(token: string, userId: string) {
    try {
      // Find the token
      const tokenRecord =
        await this.emailVerificationTokenRepository.findValidToken(userId);
      if (!tokenRecord) {
        throw new BadRequestException(
          'Invalid or expired verification token',
          'INVALID_TOKEN',
        );
      }
      const isValid = await TokenUtility.compareToken(
        token,
        tokenRecord.tokenHash,
      );
      if (!isValid) {
        throw new BadRequestException(
          'Invalid or expired verification token',
          'INVALID_TOKEN',
        );
      }

      // Check if token is expired
      const isExpired = tokenRecord.expiresAt < new Date();
      if (isExpired) {
        throw new BadRequestException(
          'Invalid or expired verification token',
          'INVALID_TOKEN',
        );
      }

      // Mark email as verified
      await this.userService.markEmailVerified(userId);

      // add role to the user
      await this.userService.assignRole(userId, 'customer');

      // Delete the token after successful verification
      await this.emailVerificationTokenRepository.delete(tokenRecord.id);

      return {
        status: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to verify email',
        'EMAIL_VERIFICATION_FAILED',
      );
    }
  }

  async login(
    loginDto: LoginDto,
    response: Response,
    metadata?: { userAgent?: string; ipAddress?: string },
  ) {
    const { email, password } = loginDto;

    // check if the user exists
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials',
        'INVALID_CREDENTIALS',
      );
    }

    // check if the user has verified their email
    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email first',
        'EMAIL_NOT_VERIFIED',
      );
    }

    // check if the password is valid
    const isPasswordValid = await TokenUtility.compareToken(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid credentials',
        'INVALID_CREDENTIALS',
      );
    }

    //generate access and refresh token
    const refreshTokenExpiresIn = this.getRefreshTokenDuration();
    const sessionId = randomUUID();
    const refreshTokenId = randomUUID();
    const { accessToken, refreshToken } =
      await this.generateAccessAndRefreshToken(
        user,
        sessionId,
        refreshTokenId,
        refreshTokenExpiresIn,
      );

    // Store refresh token in the database
    const expiresAt = this.getRefreshTokenExpiresAt(refreshTokenExpiresIn);

    const hashedRefreshToken = await TokenUtility.hashToken(refreshToken);
    await this.userService.createSessionWithRefreshToken(
      {
        id: sessionId,
        userId: user.id,
        expiresAt,
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
      },
      { id: refreshTokenId, tokenHash: hashedRefreshToken, expiresAt },
    );

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/auth',
    });

    return {
      status: true,
      message: 'Login successful',
      accessToken,
    };
  }

  async refreshToken(refreshTokenFromReq: string, response: Response) {
    if (!refreshTokenFromReq) {
      throw new UnauthorizedException(
        'Refresh token is required',
        'REFRESH_TOKEN_REQUIRED',
      );
    }

    let payload: RefreshJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshJwtPayload>(
        refreshTokenFromReq,
        {
          secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
        'INVALID_REFRESH_TOKEN',
      );
    }

    if (
      payload.type !== 'refresh' ||
      !payload.sid ||
      !payload.jti ||
      !payload.sub
    ) {
      throw new UnauthorizedException(
        'Invalid refresh token',
        'INVALID_REFRESH_TOKEN',
      );
    }

    const userId = payload.sub;
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found', 'USER_NOT_FOUND');
    }
    const tokenRecord = await this.userService.findRefreshTokenById(
      userId,
      payload.jti,
    );
    if (
      !tokenRecord ||
      tokenRecord.sessionId !== payload.sid ||
      !(await TokenUtility.compareToken(
        refreshTokenFromReq,
        tokenRecord.tokenHash,
      ))
    ) {
      throw new UnauthorizedException(
        'Invalid or revoked refresh token',
        'INVALID_REFRESH_TOKEN',
      );
    }

    if (tokenRecord.revokedAt || tokenRecord.expiresAt <= new Date()) {
      await this.userService.revokeSessionById(userId, payload.sid);
      throw new UnauthorizedException(
        'Refresh token reuse detected',
        'REFRESH_TOKEN_REUSED',
      );
    }

    const refreshTokenExpiresIn = this.getRefreshTokenDuration();
    const newRefreshTokenId = randomUUID();
    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateAccessAndRefreshToken(
        user,
        payload.sid,
        newRefreshTokenId,
        refreshTokenExpiresIn,
      );

    const expiresAt = this.getRefreshTokenExpiresAt(refreshTokenExpiresIn);
    const hashedRefreshToken = await TokenUtility.hashToken(newRefreshToken);

    const rotated = await this.userService.rotateRefreshToken(
      user.id,
      payload.sid,
      payload.jti,
      {
        id: newRefreshTokenId,
        tokenHash: hashedRefreshToken,
        expiresAt,
      },
    );
    if (!rotated) {
      await this.userService.revokeSessionById(user.id, payload.sid);
      throw new UnauthorizedException(
        'Refresh token reuse detected',
        'REFRESH_TOKEN_REUSED',
      );
    }

    response.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/auth',
    });

    return {
      status: true,
      message: 'Token refreshed successfully',
      accessToken,
    };
  }

  async getProtectedData(userId: string) {
    const user = await this.userService.findById(userId);
    const roles = await this.userService.getRoles(userId);
    if (!user) {
      throw new UnauthorizedException('User not found', 'USER_NOT_FOUND');
    }

    const { passwordHash, ...safeUser } = user;
    return {
      status: true,
      message: 'Access granted to protected route',
      user: { ...safeUser, roles: roles.map((r) => r) },
    };
  }

  async logout(refreshToken: string, response: Response) {
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth',
    });
    if (!refreshToken) {
      throw new UnauthorizedException(
        'Refresh token is required',
        'REFRESH_TOKEN_REQUIRED',
      );
    }

    let payload: RefreshJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshJwtPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
        'INVALID_REFRESH_TOKEN',
      );
    }

    if (
      payload.type !== 'refresh' ||
      !payload.sid ||
      !payload.jti ||
      !payload.sub
    ) {
      throw new UnauthorizedException(
        'Invalid refresh token',
        'INVALID_REFRESH_TOKEN',
      );
    }

    const userId = payload.sub;
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found', 'USER_NOT_FOUND');
    }

    const tokenRecord = await this.userService.findRefreshTokenById(
      userId,
      payload.jti,
    );
    if (
      !tokenRecord ||
      tokenRecord.sessionId !== payload.sid ||
      !(await TokenUtility.compareToken(refreshToken, tokenRecord.tokenHash))
    ) {
      throw new UnauthorizedException(
        'Invalid or revoked refresh token',
        'INVALID_REFRESH_TOKEN',
      );
    }

    await this.userService.revokeSessionById(user.id, payload.sid);

    return {
      status: true,
      message: 'Logout successful',
    };
  }
}
