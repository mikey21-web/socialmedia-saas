import { Module } from '@nestjs/common';
import { PublishingModule } from '../publishing/publishing.module';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { TeamsModule } from '../teams/teams.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [PublishingModule, TeamsModule],
  controllers: [PostsController],
  providers: [PostsService, SubscriptionGuard],
  exports: [PostsService],
})
export class PostsModule {}
