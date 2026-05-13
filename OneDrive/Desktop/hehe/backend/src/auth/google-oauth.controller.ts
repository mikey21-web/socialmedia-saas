import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleVerifyDto } from './dto/google-verify.dto';

@Controller('auth')
export class GoogleOauthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    return;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: { user: { id: string; email: string; name?: string | null } },
    @Res() res: Response,
  ) {
    const result = await this.authService.generateTokens(req.user);
    this.setRefreshCookie(res, result.refreshToken);
    const frontendBaseUrl = process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000';
    const callbackUrl = new URL('/auth/callback', frontendBaseUrl);
    callbackUrl.searchParams.set('token', result.accessToken);
    callbackUrl.searchParams.set('refresh', result.refreshToken);

    return res.redirect(callbackUrl.toString());
  }

  @Post('google/verify')
  async verifyGoogleIdToken(
    @Body() body: GoogleVerifyDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyGoogleIdToken(body.idToken);
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
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
}
