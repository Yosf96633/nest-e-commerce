import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/signup.dto';
import { HashingUtil } from './utils/hashing.util';
import { TokenUtility } from './utils/token.utils';
import {
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
  type IEmailVerificationTokenRepository,
} from './interfaces/email-verification-tokens-repositry.interface';
import { NewEmailVerificationToken, RefreshToken, User } from 'src/infrastructure/database/schema';
import { EMAIL_VERIFICATION_TOKEN_URL } from './auth.constants';
import { ResendService } from 'src/infrastructure/resend/resend.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';


@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY)
    private readonly emailVerificationTokenRepository: IEmailVerificationTokenRepository,
    private readonly userService: UsersService,
    @Inject(EMAIL_VERIFICATION_TOKEN_URL)
    private readonly emailVerificationTokenUrl: string,
    private readonly resendService: ResendService,
    private readonly configService: ConfigService
  ) { }

  private async generateAccessAndRefreshToken(user: User): Promise<{ accessToken: string, refreshToken: string }> {
    //Generate JWT Access Token
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    })
    //Generate Refresh Token using jwt and hash it
    const refreshToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    }, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRATION_TIME') as any,
    }
    )
    return {
      accessToken,
      refreshToken
    }
  }


  async signup(signupDto: SignUpDto) {
    const { password, ...userData } = signupDto;
    const existingUser = await this.userService.findByEmail(signupDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists', "USER_ALREADY_EXISTS");
    }

    const newUser = await this.userService.create({
      ...userData,
      passwordHash: await HashingUtil.hashPassword(password),
    });
    if (!newUser) {
      throw new InternalServerErrorException("Failed to create user", "USER_CREATION_FAILED");
    }
    const rawToken = TokenUtility.generateToken();
    const hashedToken = await TokenUtility.hashToken(rawToken);
    const verificationTokenData: NewEmailVerificationToken = {
      userId: newUser.id,
      tokenHash: hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    };

    try {
      await this.emailVerificationTokenRepository.create(verificationTokenData);
    } catch (error) {
      throw new InternalServerErrorException("Failed to create verification token", "VERIFICATION_TOKEN_CREATION_FAILED");
    }
    const verificationUrl = `${this.emailVerificationTokenUrl}?token=${rawToken}&userId=${newUser.id}`;


    try {
      await this.resendService.send_verification_email(newUser.email, verificationUrl);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new InternalServerErrorException("Failed to send verification email", "EMAIL_SENDING_FAILED");
    }

    const { passwordHash, ...safeUser } = newUser;
    return {
      status: true,
      message: "User created successfully and verification email sent",
      user: safeUser,
    };
  }

  async verifyEmail(token: string, userId: string) {
    try {
      // Find the token
      const tokenRecord = await this.emailVerificationTokenRepository.findValidToken(userId);
      if (!tokenRecord) {
        throw new BadRequestException('Invalid or expired verification token', "INVALID_TOKEN");
      }
      const isValid = await TokenUtility.compareToken(token, tokenRecord.tokenHash);
      if (!isValid) {
        throw new BadRequestException('Invalid or expired verification token', "INVALID_TOKEN");
      }

      // Check if token is expired
      const isExpired = tokenRecord.expiresAt < new Date();
      if (isExpired) {
        throw new BadRequestException('Invalid or expired verification token', "INVALID_TOKEN");
      }

      // Mark email as verified
      await this.userService.markEmailVerified(userId);

      // Delete the token after successful verification
      await this.emailVerificationTokenRepository.delete(tokenRecord.id);

      return {
        status: true,
        message: "Email verified successfully",
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException("Failed to verify email", "EMAIL_VERIFICATION_FAILED");
    }
  }

  async login(loginDto: LoginDto, response: Response) {
    const { email, password } = loginDto;

    // check if the user exists
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials", "INVALID_CREDENTIALS");
    }

    // check if the user has verified their email
    if (!user.isEmailVerified) {
      throw new UnauthorizedException("Please verify your email first", "EMAIL_NOT_VERIFIED");
    }

    // check if the password is valid
    const isPasswordValid = await TokenUtility.compareToken(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials", "INVALID_CREDENTIALS");
    }

    //generate access and refresh token
    const { accessToken, refreshToken } = await this.generateAccessAndRefreshToken(user);

    // Store refresh token in the database
    const durationInDays = 15;
    // current time + (15 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
    const expiresAt = new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000);

    const hashedRefreshToken = await TokenUtility.hashToken(refreshToken);
    await this.userService.storeRefreshToken(user.id, hashedRefreshToken, expiresAt);


    response.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/auth",
    });

    return {
      status: true,
      message: "Login successful",
      accessToken,
    };
  }

  async refreshToken(refreshTokenFromReq: string, response: Response) {
    if (!refreshTokenFromReq) {
      throw new UnauthorizedException('Refresh token is required', 'REFRESH_TOKEN_REQUIRED');
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshTokenFromReq, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const userId = payload.sub;
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found', 'USER_NOT_FOUND');
    }

    const activeTokens = await this.userService.findActiveRefreshTokensByUserId(userId);
    let matchedTokenRecord: RefreshToken | undefined;

    for (const tokenRecord of activeTokens) {
      const isValid = await TokenUtility.compareToken(refreshTokenFromReq, tokenRecord.tokenHash);
      if (isValid) {
        matchedTokenRecord = tokenRecord;
        break;
      }
    }

    if (!matchedTokenRecord) {
      throw new UnauthorizedException('Invalid or revoked refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.generateAccessAndRefreshToken(user);

    const durationInDays = 15;
    const expiresAt = new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000);
    const hashedRefreshToken = await TokenUtility.hashToken(newRefreshToken);

    const newRefreshTokenRecord = await this.userService.storeRefreshToken(
      user.id,
      hashedRefreshToken,
      expiresAt,
    );

    await this.userService.revokeRefreshToken(matchedTokenRecord.id, newRefreshTokenRecord.id);

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
    if (!user) {
      throw new UnauthorizedException('User not found', 'USER_NOT_FOUND');
    }

    const { passwordHash, ...safeUser } = user;
    return {
      status: true,
      message: 'Access granted to protected route',
      user: safeUser,
    };
  }
}
