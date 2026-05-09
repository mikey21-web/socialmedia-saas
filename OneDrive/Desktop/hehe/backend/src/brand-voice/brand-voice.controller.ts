import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PlanLimit, PlanLimitGuard } from '../common/guards/plan-limit.guard';
import { BrandVoiceService } from './brand-voice.service';
import { UploadSamplesDto } from './dto/upload-samples.dto';
import { CreateProfileDto } from './dto/create-profile.dto';

@Controller('brand-voice')
@UseGuards(JwtAuthGuard, PlanLimitGuard)
export class BrandVoiceProfileController {
  constructor(private readonly service: BrandVoiceService) {}

  @Post('upload-samples')
  async uploadSamples(
    @Req() req: { user: { team_id: string } },
    @Body() dto: UploadSamplesDto,
  ) {
    return this.service.uploadSamples(req.user.team_id, dto.posts);
  }

  @Post('profiles')
  @PlanLimit('brand_voice_profiles')
  async createProfile(
    @Req() req: { user: { team_id: string } },
    @Body() body: CreateProfileDto & { extraction?: Record<string, unknown> },
  ) {
    return this.service.createProfile(req.user.team_id, body);
  }

  @Get('profiles')
  async listProfiles(@Req() req: { user: { team_id: string } }) {
    return this.service.listProfiles(req.user.team_id);
  }

  @Get('profiles/default')
  async getDefault(@Req() req: { user: { team_id: string } }) {
    return this.service.getDefaultProfile(req.user.team_id);
  }

  @Get('profiles/:id')
  async getProfile(@Param('id') id: string) {
    return this.service.getProfile(id);
  }

  @Patch('profiles/:id')
  async updateProfile(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.updateProfile(id, body);
  }

  @Delete('profiles/:id')
  async deleteProfile(@Param('id') id: string) {
    return this.service.deleteProfile(id);
  }

  @Post('profiles/:id/validate-content')
  async validateContent(
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.service.validateContentMatchesVoice(id, body.content);
  }
}
