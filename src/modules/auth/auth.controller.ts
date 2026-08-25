import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { }

    @Post('signup')
    @HttpCode(201)
    async signup(@Body() signupDto: SignUpDto) {
        return this.authService.signup(signupDto);
    }
}
