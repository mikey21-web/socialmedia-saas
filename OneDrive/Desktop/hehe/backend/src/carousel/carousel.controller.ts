import { Body, Controller, Get, Header, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PlanLimit, PlanLimitGuard } from '../common/guards/plan-limit.guard';
import { CarouselService } from './carousel.service';
import { CarouselBrief } from './carousel.types';

@UseGuards(JwtAuthGuard, PlanLimitGuard)
export class CarouselController {
  constructor(private readonly carousel: CarouselService) {}

  @Post('carousel/generate')
  @PlanLimit('carousels')
  generate(@Req() req: { user: { team_id: string } }, @Body() body: CarouselBrief) {
    return this.carousel.generateCarousel(req.user.team_id, body);
  }

  @Get('carousel/:id')
  get(@Req() req: { user: { team_id: string } }, @Param('id') id: string) {
    return this.carousel.getCarousel(req.user.team_id, id);
  }

  @Get('carousel/:id/preview')
  @Header('content-type', 'text/html; charset=utf-8')
  preview(@Req() req: { user: { team_id: string } }, @Param('id') id: string) {
    return this.carousel.getPreviewHtml(req.user.team_id, id);
  }

  @Post('carousel/:id/publish')
  publish(@Req() req: { user: { team_id: string } }, @Param('id') id: string) {
    return this.carousel.publishToInstagram(req.user.team_id, id);
  }

  @Get('carousels')
  list(@Req() req: { user: { team_id: string } }) {
    return this.carousel.listCarousels(req.user.team_id);
  }
}
