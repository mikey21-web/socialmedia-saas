import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TeamId } from '../common/decorators/team.decorator';
import { SubscriptionFeatureLimit } from '../common/decorators/subscription-feature.decorator';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { PlanLimit, PlanLimitGuard } from '../common/guards/plan-limit.guard';
import { PostsService } from './posts.service';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';
import { CreatePostDto } from './dto/create-post.dto';
import { ListPostsDto } from './dto/list-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@UseGuards(JwtAuthGuard, SubscriptionGuard, PlanLimitGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @SubscriptionFeatureLimit('posts')
  @PlanLimit('posts')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  createPost(
    @Req() req: { user: AuthenticatedRequestUser },
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.createPost(req.user, dto);
  }

  @Get()
  listPosts(
    @Req() req: { user: AuthenticatedRequestUser },
    @Query() query: ListPostsDto,
  ) {
    return this.postsService.listPosts(req.user, query);
  }

  @Get('recurring')
  listRecurringPosts(@TeamId() teamId: string | undefined) {
    return this.postsService.listRecurringPosts(teamId);
  }

  @Get(':id')
  getPostById(
    @Req() req: { user: AuthenticatedRequestUser },
    @Param('id') postId: string,
  ) {
    return this.postsService.getPostById(req.user, postId);
  }

@Patch(':id')
  updatePost(
    @Req() req: { user: AuthenticatedRequestUser },
    @Param('id') postId: string,
    @Body() dto: UpdatePostDto,
  ) {
    if (dto.scheduledAt) {
      const scheduledDate = new Date(dto.scheduledAt);
      const now = new Date();
      if (scheduledDate <= now) {
        throw new BadRequestException('scheduledAt must be a future date when rescheduling a post');
      }
    }
    return this.postsService.updatePost(req.user, postId, dto);
  }

  @Delete(':id')
  deletePost(
    @Req() req: { user: AuthenticatedRequestUser },
    @Param('id') postId: string,
  ) {
    return this.postsService.deletePost(req.user, postId);
  }
}
