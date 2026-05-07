import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { SubscriptionFeatureLimit } from "../common/decorators/subscription-feature.decorator";
import { SubscriptionGuard } from "../common/guards/subscription.guard";
import { TeamId } from "../common/decorators/team.decorator";
import { PostsImportService } from "./import.service";

@Controller("posts")
export class PostsImportController {
  constructor(private readonly postsImportService: PostsImportService) {}

  @Post("import")
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @SubscriptionFeatureLimit("posts")
  @UseInterceptors(FileInterceptor("file"))
  async importPosts(
    @UploadedFile() file: Express.Multer.File,
    @TeamId() teamId: string | undefined,
    @Query("dryRun") dryRun?: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    if (file.size > 50 * 1024 * 1024) {
      throw new BadRequestException(
        "File too large. Maximum size is 50MB",
      );
    }

    if (!file.mimetype.includes("csv")) {
      throw new BadRequestException(
        "Invalid file type. Only CSV files are allowed",
      );
    }

    const isDryRun = dryRun === "true" || dryRun === "1";

    return this.postsImportService.importFromCsv(
      teamId!,
      file.buffer,
      isDryRun,
    );
  }
}