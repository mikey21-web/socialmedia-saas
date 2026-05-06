import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ThirdPartyManager } from './thirdparty.manager';
import { ThirdPartyService } from './thirdparty.service';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('thirdparty')
export class ThirdPartyController {
  constructor(
    private readonly thirdPartyManager: ThirdPartyManager,
    private readonly thirdPartyService: ThirdPartyService,
  ) {}

  @Get()
  listProviders() {
    return this.thirdPartyManager.getAllProviders();
  }

  @Get('integrations')
  listTeamIntegrations(@Req() req: { user: AuthenticatedRequestUser }) {
    return this.thirdPartyService.getAllByTeam(req.user);
  }

  @Post(':identifier/connect')
  async connect(
    @Req() req: { user: AuthenticatedRequestUser },
    @Param('identifier') identifier: string,
    @Body() body: { apiKey: string },
  ) {
    if (!body.apiKey) throw new BadRequestException('apiKey required');

    const provider = this.thirdPartyManager.getProvider(identifier);
    if (!provider) throw new NotFoundException(`Provider '${identifier}' not found`);

    const result = await provider.instance.checkConnection(body.apiKey);
    if (!result) throw new BadRequestException('Invalid API key — connection check failed');

    return this.thirdPartyService.save(req.user, identifier, body.apiKey, result);
  }

  @Delete('integrations/:id')
  disconnect(
    @Req() req: { user: AuthenticatedRequestUser },
    @Param('id') id: string,
  ) {
    return this.thirdPartyService.delete(req.user, id);
  }

  @Get(':identifier/voices')
  async getVoices(
    @Req() req: { user: AuthenticatedRequestUser },
    @Param('identifier') identifier: string,
  ) {
    const provider = this.thirdPartyManager.getProvider(identifier);
    if (!provider) throw new NotFoundException(`Provider '${identifier}' not found`);
    if (typeof provider.instance.voices !== 'function') {
      throw new BadRequestException(`Provider '${identifier}' does not support voices`);
    }

    const apiKey = await this.thirdPartyService.getDecryptedApiKey(req.user, identifier);
    return provider.instance.voices(apiKey);
  }

  @Get(':identifier/avatars')
  async getAvatars(
    @Req() req: { user: AuthenticatedRequestUser },
    @Param('identifier') identifier: string,
  ) {
    const provider = this.thirdPartyManager.getProvider(identifier);
    if (!provider) throw new NotFoundException(`Provider '${identifier}' not found`);
    if (typeof provider.instance.avatars !== 'function') {
      throw new BadRequestException(`Provider '${identifier}' does not support avatars`);
    }

    const apiKey = await this.thirdPartyService.getDecryptedApiKey(req.user, identifier);
    return provider.instance.avatars(apiKey);
  }

  @Post(':identifier/generate')
  async generate(
    @Req() req: { user: AuthenticatedRequestUser },
    @Param('identifier') identifier: string,
    @Body() body: any,
  ) {
    const provider = this.thirdPartyManager.getProvider(identifier);
    if (!provider) throw new NotFoundException(`Provider '${identifier}' not found`);

    const apiKey = await this.thirdPartyService.getDecryptedApiKey(req.user, identifier);
    return { url: await provider.instance.sendData(apiKey, body) };
  }
}
