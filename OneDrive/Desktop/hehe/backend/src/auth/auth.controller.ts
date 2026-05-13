import { Body, Controller, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(
    @Body() body: AuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signup(body.email, body.password, body.name);
    this.setRefreshCookie(res, result.refreshToken);
    return {
      user: result.user,
      team_id: result.team_id,
      token: result.token,
    };
  }

  @Throttle(5, 60)
  @Post('signin')
  async signin(
    @Body() body: AuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signin(body.email, body.password);
    this.setRefreshCookie(res, result.refreshToken);
    return {
      user: result.user,
      team_id: result.team_id,
      token: result.token,
    };
  }

  @Post('refresh')
  async refresh(
    @Body() body: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieRefreshToken = req.cookies?.refresh_token as string | undefined;
    const refreshToken = cookieRefreshToken ?? body.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }

    const result = await this.authService.refreshAccessToken(refreshToken);
    this.setRefreshCookie(res, result.refreshToken);
    return {
      user: result.user,
      team_id: result.team_id,
      token: result.token,
    };
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: THIRTY_DAYS_IN_MS,
    });
  }
}
