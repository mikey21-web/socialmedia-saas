import { Body, Controller, Get, Post, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import {
  VISUAL_DIRECTIONS,
  getDirectionById,
  directionToBrandVoiceProfile,
  DirectionId,
} from './visual-directions';
import { BrandVoiceService } from './brand-voice.service';

@Controller('brand-voice/directions')
@UseGuards(JwtAuthGuard)
export class VisualDirectionsController {
  constructor(private readonly brandVoice: BrandVoiceService) {}

  /**
   * List all 5 visual directions. Used by the onboarding direction picker.
   */
  @Get()
  list() {
    return VISUAL_DIRECTIONS.map((d) => ({
      id: d.id,
      name: d.name,
      tagline: d.tagline,
      description: d.description,
      references: d.references,
      mood: d.mood,
      colors: d.colors,
      fonts: d.fonts,
    }));
  }

  /**
   * Apply a chosen direction to the team's brand voice. Creates or replaces
   * the default brand voice profile with deterministic palette + font stack.
   */
  @Post('apply')
  async apply(
    @Req() req: { user: { team_id: string } },
    @Body() body: { directionId: DirectionId },
  ) {
    const direction = getDirectionById(body.directionId);
    if (!direction) {
      throw new NotFoundException(`Unknown direction: ${body.directionId}`);
    }

    const profileData = directionToBrandVoiceProfile(direction);

    return this.brandVoice.createProfile(req.user.team_id, {
      name: direction.name,
      isDefault: true,
      primaryColor: profileData.primaryColor,
      fontPrimary: profileData.fontPrimary,
      fontSecondary: profileData.fontSecondary ?? undefined,
    });
  }
}
