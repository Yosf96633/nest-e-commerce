import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(201)
  async signup(@Body() signupDto: SignUpDto) {
    return this.authService.signup(signupDto);
  }

  @Post('verify-email')
  @HttpCode(200)
  async verifyEmail(@Query() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(
      verifyEmailDto.token,
      verifyEmailDto.userId,
    );
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(loginDto, res, {
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
    });
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: RefreshTokenDto,
  ) {
    const refreshToken = req.cookies?.['refresh_token'] || body?.refreshToken;
    return this.authService.refreshToken(refreshToken, res);
  }

  @UseGuards(JwtAuthGuard)
  @Get('protected')
  @HttpCode(200)
  async protectedRoute(@Req() req: Request & { user: any }) {
    return this.authService.getProtectedData(req.user.sub);
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: RefreshTokenDto,
  ) {
    const refreshToken = req.cookies?.['refresh_token'] || body?.refreshToken;
    return this.authService.logout(refreshToken, res);
  }
}
