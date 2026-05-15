import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';
import { OauthService } from './oauth.service';

const FRONTEND_URL = () =>
  process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000';

@Controller('oauth')
export class OauthController {
  constructor(private readonly oauthService: OauthService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':platform/authorize')
  async authorize(
    @Param('platform') platform: string,
    @Req() req: { user: AuthenticatedRequestUser },
    @Res() res: Response,
  ) {
    const url = await this.oauthService.getAuthorizeUrl(platform, req.user.userId);
    return res.redirect(url);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':platform/url')
  async getAuthorizeUrl(
    @Param('platform') platform: string,
    @Req() req: { user: AuthenticatedRequestUser },
  ) {
    return {
      url: await this.oauthService.getAuthorizeUrl(platform, req.user.userId),
    };
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('platform') platform: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    if (error) {
      return res.redirect(`${FRONTEND_URL()}/settings/connections?error=${encodeURIComponent(error)}`);
    }
    try {
      await this.oauthService.handleOAuthCallback({ code, state, platform, error });
      return res.redirect(`${FRONTEND_URL()}/settings/connections?connected=true`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'oauth_failed';
      return res.redirect(`${FRONTEND_URL()}/settings/connections?error=${encodeURIComponent(message)}`);
    }
  }
}
