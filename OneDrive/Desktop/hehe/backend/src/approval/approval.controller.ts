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
import { Throttle } from "@nestjs/throttler";
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
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  getPostDetails(@Param("token") token: string): Promise<unknown> {
    return this.approvalService.getPostByToken(token);
  }

  @Post(":token/approve")
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  approve(@Param("token") token: string): Promise<unknown> {
    return this.approvalService.approveByToken(token);
  }

  @Post(":token/reject")
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  reject(
    @Param("token") token: string,
    @Body("reason") reason?: string,
  ): Promise<unknown> {
    return this.approvalService.rejectByToken(token, reason);
  }

  @UseGuards(JwtAuthGuard)

  @Post("batch")
  batchAction(@Body() dto: BatchActionDto): Promise<unknown> {
    return this.approvalService.batchAction(dto.postIds, dto.action, dto.reason);
  }

  @Get("pending")
  getPendingPosts(@TeamId() teamId: string | undefined): Promise<unknown> | [] {
    if (!teamId) {
      return [];
    }
    return this.approvalService.getPendingPosts(teamId);
  }
}
