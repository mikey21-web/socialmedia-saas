import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt.guard';
import { DesignerService, ImageGenerationBrief } from './designer.service';

@Controller('agency/designer')
@UseGuards(JwtAuthGuard)
export class DesignerController {
  constructor(private readonly designer: DesignerService) {}

  @Post('generate')
  generateImage(
    @Req() req: { user: { team_id: string } },
    @Body() body: Omit<ImageGenerationBrief, 'teamId'>,
  ) {
    return this.designer.generateImage({ teamId: req.user.team_id, ...body });
  }

  @Post('variants')
  generateVariants(
    @Req() req: { user: { team_id: string } },
    @Body() body: { brief: Omit<ImageGenerationBrief, 'teamId'>; count: number },
  ) {
    return this.designer.generateVariants({ teamId: req.user.team_id, ...body.brief }, body.count);
  }

  @Post('thumbnail')
  generateThumbnail(
    @Req() req: { user: { team_id: string } },
    @Body() body: { videoTitle: string; brandPrimaryColor: string },
  ) {
    return this.designer.generateThumbnail(req.user.team_id, body.videoTitle, body.brandPrimaryColor);
  }

  @Post('carousel-cover')
  generateCarouselCover(
    @Req() req: { user: { team_id: string } },
    @Body() body: { topic: string; brandColors: { primary: string; light: string; dark: string } },
  ) {
    return this.designer.generateCarouselCoverImage(req.user.team_id, body.topic, body.brandColors);
  }
}
