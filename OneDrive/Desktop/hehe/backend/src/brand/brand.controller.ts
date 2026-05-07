import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TeamId } from '../common/decorators/team.decorator';
import { BrandService } from './brand.service';
import { CreateBrandProfileDto } from './dto/create-brand-profile.dto';
import { UpdateBrandProfileDto } from './dto/update-brand-profile.dto';
import { CreatePillarDto } from './dto/create-pillar.dto';
import { CreateCompetitorDto } from './dto/create-competitor.dto';
import { CreateVoiceExampleDto } from './dto/voice-example.dto';

@Controller('brand')
@UseGuards(JwtAuthGuard)
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  private requireTeam(teamId: string | undefined): string {
    if (!teamId) throw new BadRequestException('Missing team context');
    return teamId;
  }

  // ─── Profile ────────────────────────────────────────────────────────────────

  @Get('profile')
  getProfile(@TeamId() teamId: string | undefined) {
    return this.brandService.getProfile(this.requireTeam(teamId));
  }

  @Post('profile')
  createProfile(
    @TeamId() teamId: string | undefined,
    @Body() dto: CreateBrandProfileDto,
  ) {
    return this.brandService.createProfile(this.requireTeam(teamId), dto);
  }

  @Patch('profile')
  updateProfile(
    @TeamId() teamId: string | undefined,
    @Body() dto: UpdateBrandProfileDto,
  ) {
    return this.brandService.updateProfile(this.requireTeam(teamId), dto);
  }

  @Post('profile/complete')
  completeOnboarding(@TeamId() teamId: string | undefined) {
    return this.brandService.completeOnboarding(this.requireTeam(teamId));
  }

  // ─── Pillars ────────────────────────────────────────────────────────────────

  @Get('pillars')
  listPillars(@TeamId() teamId: string | undefined) {
    return this.brandService.listPillars(this.requireTeam(teamId));
  }

  @Post('pillars')
  createPillar(
    @TeamId() teamId: string | undefined,
    @Body() dto: CreatePillarDto,
  ) {
    return this.brandService.createPillar(this.requireTeam(teamId), dto);
  }

  @Patch('pillars/:id')
  updatePillar(
    @TeamId() teamId: string | undefined,
    @Param('id') id: string,
    @Body() dto: CreatePillarDto,
  ) {
    return this.brandService.updatePillar(this.requireTeam(teamId), id, dto);
  }

  @Delete('pillars/:id')
  deletePillar(
    @TeamId() teamId: string | undefined,
    @Param('id') id: string,
  ) {
    return this.brandService.deletePillar(this.requireTeam(teamId), id);
  }

  // ─── Competitors ────────────────────────────────────────────────────────────

  @Get('competitors')
  listCompetitors(@TeamId() teamId: string | undefined) {
    return this.brandService.listCompetitors(this.requireTeam(teamId));
  }

  @Post('competitors')
  createCompetitor(
    @TeamId() teamId: string | undefined,
    @Body() dto: CreateCompetitorDto,
  ) {
    return this.brandService.createCompetitor(this.requireTeam(teamId), dto);
  }

  @Delete('competitors/:id')
  deleteCompetitor(
    @TeamId() teamId: string | undefined,
    @Param('id') id: string,
  ) {
    return this.brandService.deleteCompetitor(this.requireTeam(teamId), id);
  }

  // ─── Voice Examples ─────────────────────────────────────────────────────────

  @Get('voice-examples')
  listVoiceExamples(@TeamId() teamId: string | undefined) {
    return this.brandService.listVoiceExamples(this.requireTeam(teamId));
  }

  @Post('voice-examples')
  createVoiceExample(
    @TeamId() teamId: string | undefined,
    @Body() dto: CreateVoiceExampleDto,
  ) {
    return this.brandService.createVoiceExample(this.requireTeam(teamId), dto);
  }

  @Delete('voice-examples/:id')
  deleteVoiceExample(
    @TeamId() teamId: string | undefined,
    @Param('id') id: string,
  ) {
    return this.brandService.deleteVoiceExample(this.requireTeam(teamId), id);
  }

  // ─── Brand Context (for agents) ────────────────────────────────────────────

  @Get('context')
  getBrandContext(@TeamId() teamId: string | undefined) {
    return this.brandService.getBrandContext(this.requireTeam(teamId));
  }
}
