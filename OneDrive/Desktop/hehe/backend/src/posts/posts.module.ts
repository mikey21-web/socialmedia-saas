import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";
import { PostsImportController } from "./import.controller";
import { PostsImportService } from "./import.service";
import { AbTestController } from "./ab-test.controller";
import { AbTestService } from "./ab-test.service";
import { TeamsModule } from "../teams/teams.module";

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
    TeamsModule,
  ],
  controllers: [PostsController, PostsImportController, AbTestController],
  providers: [PostsService, PostsImportService, AbTestService],
  exports: [PostsService],
})
export class PostsModule {}