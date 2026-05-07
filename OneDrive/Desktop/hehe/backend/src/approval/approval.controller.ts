import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { ApprovalService } from "./approval.service";
import { TeamId } from "../common/decorators/team.decorator";

interface BatchActionDto {
  postIds: string[];
  action: "approve" | "reject";
  reason?: string;
}

@Controller("approval")
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get(":token")
  getPostDetails(@Param("token") token: string) {
    return this.approvalService.getPostByToken(token);
  }

  @Post(":token/approve")
  approve(@Param("token") token: string) {
    return this.approvalService.approveByToken(token);
  }

  @Post(":token/reject")
  reject(
    @Param("token") token: string,
    @Body("reason") reason?: string,
  ) {
    return this.approvalService.rejectByToken(token, reason);
  }

  @UseGuards(JwtAuthGuard)

  @Post("batch")
  batchAction(@Body() dto: BatchActionDto) {
    return this.approvalService.batchAction(dto.postIds, dto.action, dto.reason);
  }

  @Get("pending")
  getPendingPosts(@TeamId() teamId: string | undefined) {
    if (!teamId) {
      return [];
    }
    return this.approvalService.getPendingPosts(teamId);
  }
}
