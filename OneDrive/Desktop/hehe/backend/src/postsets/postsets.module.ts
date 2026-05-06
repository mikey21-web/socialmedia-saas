import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PostsetsController } from './postsets.controller';
import { PostsetsService } from './postsets.service';

@Module({
  imports: [PrismaModule],
  controllers: [PostsetsController],
  providers: [PostsetsService],
  exports: [PostsetsService],
})
export class PostsetsModule {}
