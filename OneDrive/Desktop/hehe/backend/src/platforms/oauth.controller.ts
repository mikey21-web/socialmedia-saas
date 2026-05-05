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

@Controller('oauth')
export class OauthController {
  constructor(private readonly oauthService: OauthService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':platform/authorize')
  authorize(
    @Param('platform') platform: string,
    @Req() req: { user: AuthenticatedRequestUser },
    @Res() res: Response,
  ) {
    const url = this.oauthService.getAuthorizeUrl(platform, req.user.userId);
    return res.redirect(url);
  }

  @Get('callback')
  callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('platform') platform: string | undefined,
    @Query('error') error: string | undefined,
  ) {
    return this.oauthService.handleOAuthCallback({
      code,
      state,
      platform,
      error,
    });
  }
}
