import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { TeamId } from '../../common/decorators/team.decorator';
import { ContentService } from './content.service';
import { GenerateInput } from './types';

@Controller('agents/content')
@UseGuards(JwtAuthGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  private requireTeam(teamId: string | undefined): string {
    if (!teamId) throw new BadRequestException('Missing team context');
    return teamId;
  }

  @Post('generate')
  generate(
    @TeamId() teamId: string | undefined,
    @Body() body: GenerateInput,
  ) {
    return this.contentService.generate(this.requireTeam(teamId), body);
  }

  @Post('regenerate/:postId')
  regenerate(
    @TeamId() teamId: string | undefined,
    @Param('postId') postId: string,
  ) {
    return this.contentService.regenerate(this.requireTeam(teamId), postId);
  }

  @Post('refine/:postId')
  refine(
    @TeamId() teamId: string | undefined,
    @Param('postId') postId: string,
    @Body('feedback') feedback: string,
  ) {
    if (!feedback) {
      throw new BadRequestException('Feedback is required');
    }
    return this.contentService.refine(this.requireTeam(teamId), postId, feedback);
  }
}
