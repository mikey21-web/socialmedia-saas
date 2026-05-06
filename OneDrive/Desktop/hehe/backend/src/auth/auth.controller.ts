import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';

@Throttle({ default: { limit: 5, ttl: 300000 } })
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
