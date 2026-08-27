import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/signup.dto';
import { HashingUtil } from './utils/hashing.util';
import { TokenUtility } from './utils/token.utils';
import {
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
  type IEmailVerificationTokenRepository,
} from './interfaces/email-verification-tokens-repositry.interface';
import { NewEmailVerificationToken } from 'src/infrastructure/database/schema';
import { EMAIL_VERIFICATION_TOKEN_URL } from './auth.constants';
import { ResendService } from 'src/infrastructure/resend/resend.service';
@Injectable()
export class AuthService {
  constructor(
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY)
    private readonly emailVerificationTokenRepository: IEmailVerificationTokenRepository,
    private readonly userService: UsersService,
    @Inject(EMAIL_VERIFICATION_TOKEN_URL)
    private readonly emailVerificationTokenUrl: string,
    private readonly resendService: ResendService
  ) { }

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
}
