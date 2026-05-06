import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';
import { CreatePostsetDto } from './dto/create-postset.dto';
import { PostsetsService } from './postsets.service';

@UseGuards(JwtAuthGuard)
@Controller('postsets')
export class PostsetsController {
  constructor(private readonly postsetsService: PostsetsService) {}

  @Post()
  create(
    @Req() req: { user: AuthenticatedRequestUser },
    @Body() dto: CreatePostsetDto,
  ) {
    return this.postsetsService.create(req.user.team_id, dto);
  }

  @Get()
  findAll(@Req() req: { user: AuthenticatedRequestUser }) {
    return this.postsetsService.findAll(req.user.team_id);
  }

  @Get(':id')
  findOne(
    @Req() req: { user: AuthenticatedRequestUser },
    @Param('id') id: string,
  ) {
    return this.postsetsService.findOne(req.user.team_id, id);
  }

  @Delete(':id')
  remove(
    @Req() req: { user: AuthenticatedRequestUser },
    @Param('id') id: string,
  ) {
    return this.postsetsService.remove(req.user.team_id, id);
  }
}
