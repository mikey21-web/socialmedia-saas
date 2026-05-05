import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() body: AuthDto) {
    return this.authService.signup(body.email, body.password, body.name);
  }

  @Post('signin')
  signin(@Body() body: AuthDto) {
    return this.authService.signin(body.email, body.password);
  }
}
