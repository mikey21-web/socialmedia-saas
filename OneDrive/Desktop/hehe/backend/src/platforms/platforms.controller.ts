import { Controller, Delete, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';
import { OauthService } from './oauth.service';
import { PlatformsService } from './platforms.service';

@UseGuards(JwtAuthGuard)
@Controller(['platforms', 'api/platforms'])
export class PlatformsController {
  constructor(
    private readonly platformsService: PlatformsService,
    private readonly oauthService: OauthService,
  ) {}

  @Get()
  listPlatforms() {
    return this.platformsService.listSupportedPlatforms();
  }

  @Get('connect/:platform')
  async connect(
    @Param('platform') platform: string,
    @Req() req: { user: AuthenticatedRequestUser },
    @Res() res: Response,
  ) {
    const url = await this.oauthService.getAuthorizeUrl(
      platform,
      req.user.userId,
      req.user.team_id,
    );
    return res.redirect(url);
  }

  @Get('credentials')
  listCredentials(@Req() req: { user: AuthenticatedRequestUser }) {
    return this.platformsService.listTeamCredentials(req.user.team_id);
  }

  @Delete('credentials/:id')
  deleteCredential(
    @Param('id') id: string,
    @Req() req: { user: AuthenticatedRequestUser },
  ) {
    return this.platformsService.deleteCredential(req.user.team_id, id);
  }
}

@Controller(['platforms', 'api/platforms'])
export class PlatformCallbacksController {
  constructor(private readonly oauthService: OauthService) {}

  @Get('callback/:platform')
  async callback(
    @Param('platform') platform: string,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    await this.oauthService.handleOAuthCallback({ code, state, platform, error });
    const frontendUrl = process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/settings/connections?connected=true`);
  }
}
