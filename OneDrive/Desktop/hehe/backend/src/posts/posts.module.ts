import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";
import { PostsImportController } from "./import.controller";
import { PostsImportService } from "./import.service";
import { AbTestController } from "./ab-test.controller";
import { AbTestService } from "./ab-test.service";
import { PlanLimitGuard } from "../common/guards/plan-limit.guard";
import { PrismaModule } from "../prisma/prisma.module";
import { TeamsModule } from "../teams/teams.module";

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
    PrismaModule,
    TeamsModule,
  ],
  controllers: [PostsController, PostsImportController, AbTestController],
  providers: [PostsService, PostsImportService, AbTestService, PlanLimitGuard],
  exports: [PostsService],
})
export class PostsModule {}