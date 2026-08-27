import { Body, Controller, HttpCode, Post, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { }

    @Post('signup')
    @HttpCode(201)
    async signup(@Body() signupDto: SignUpDto) {
        return this.authService.signup(signupDto);
    }

    @Post('verify-email')
    @HttpCode(200)
    async verifyEmail(@Query() verifyEmailDto: VerifyEmailDto) {
        return this.authService.verifyEmail(verifyEmailDto.token, verifyEmailDto.userId);
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
        return this.authService.login(loginDto, res);
    }
}
