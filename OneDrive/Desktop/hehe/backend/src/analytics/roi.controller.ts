import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TeamId } from '../common/decorators/team.decorator';
import { RoiService, CreateUtmLinkDto, RecordConversionDto } from './roi.service';

@Controller()
export class RoiController {
  constructor(private readonly roiService: RoiService) {}

  // ─── Authenticated endpoints ──────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('analytics/utm-links')
  createUtmLink(
    @Req() req: { user: { team_id: string } },
    @Body() dto: CreateUtmLinkDto,
  ) {
    return this.roiService.createUtmLink(req.user.team_id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('analytics/utm-links/post/:postId')
  createUtmLinksForPost(
    @Req() req: { user: { team_id: string } },
    @Param('postId') postId: string,
    @Body() body: { destinationUrl: string; platforms: string[] },
  ) {
    return this.roiService.createUtmLinksForPost(
      req.user.team_id,
      postId,
      body.destinationUrl,
      body.platforms,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('analytics/roi')
  getRoiSummary(
    @Req() req: { user: { team_id: string } },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.roiService.getRoiSummary(
      req.user.team_id,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('analytics/roi/post/:postId')
  getPostRoi(
    @Req() req: { user: { team_id: string } },
    @Param('postId') postId: string,
  ) {
    return this.roiService.getPostRoi(req.user.team_id, postId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('analytics/conversions')
  recordConversion(
    @Req() req: { user: { team_id: string } },
    @Body() dto: RecordConversionDto,
  ) {
    return this.roiService.recordConversion(req.user.team_id, dto);
  }

  // ─── Public redirect endpoint (no auth) ───────────────────────────────────

  @Get('r/:shortCode')
  async redirect(
    @Param('shortCode') shortCode: string,
    @Req() req: { ip?: string; headers: Record<string, string> },
    @Res() res: Response,
  ) {
    try {
      const result = await this.roiService.recordClick(
        shortCode,
        req.ip,
        req.headers['user-agent'],
      );
      res.redirect(302, result.redirectUrl);
    } catch {
      res.redirect(302, process.env.FRONTEND_URL ?? 'http://localhost:3000');
    }
  }
}
