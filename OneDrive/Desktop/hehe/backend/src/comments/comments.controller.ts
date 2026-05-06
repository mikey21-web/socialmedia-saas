import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsService } from './comments.service';

@UseGuards(JwtAuthGuard)
@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(
    @Param('postId') postId: string,
    @Req() req: { user: AuthenticatedRequestUser },
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(
      postId,
      req.user.team_id,
      req.user.userId,
      dto.content,
    );
  }

  @Get()
  findAll(
    @Param('postId') postId: string,
    @Req() req: { user: AuthenticatedRequestUser },
  ) {
    return this.commentsService.findAll(postId, req.user.team_id);
  }

  @Delete(':id')
  remove(
    @Param('postId') postId: string,
    @Param('id') id: string,
    @Req() req: { user: AuthenticatedRequestUser },
  ) {
    return this.commentsService.remove(postId, id, req.user.team_id, req.user.userId);
  }
}
