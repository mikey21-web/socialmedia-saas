import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';
import { TeamsService } from './teams.service';

class UpdateSignatureDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  signature!: string;
}

class InviteMemberDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  role?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('signature')
  async getSignature(@Req() req: { user: AuthenticatedRequestUser }) {
    const signature = await this.teamsService.getTeamSignature(req.user.team_id);
    return { signature };
  }

  @Patch('signature')
  async updateSignature(
    @Req() req: { user: AuthenticatedRequestUser },
    @Body() body: UpdateSignatureDto,
  ) {
    const signature = body.signature?.trim() ?? '';
    const result = await this.teamsService.updateSignature(
      req.user.team_id,
      signature,
    );
    return { signature: result.signature };
  }

  @Post(':teamId/members')
  async inviteMember(
    @Param('teamId') teamId: string,
    @Req() req: { user: AuthenticatedRequestUser },
    @Body() body: InviteMemberDto,
  ) {
    if (teamId !== req.user.team_id) {
      throw new ForbiddenException('You do not have access to this team');
    }

    return this.teamsService.inviteMember(teamId, body.userId, body.role ?? 'editor');
  }
}
