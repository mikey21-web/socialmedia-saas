import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { SubscriptionFeatureLimit } from "../common/decorators/subscription-feature.decorator";
import { SubscriptionGuard } from "../common/guards/subscription.guard";
import { TeamId } from "../common/decorators/team.decorator";
import { AbTestService } from "./ab-test.service";
import { AuthenticatedRequestUser } from "../common/interfaces/authenticated-request-user.interface";

interface CreateAbTestDto {
  caption: string;
  platforms: string[];
  timeA: string;
  timeB: string;
}

@UseGuards(JwtAuthGuard, SubscriptionGuard)
@Controller("posts")
export class AbTestController {
  constructor(private readonly abTestService: AbTestService) {}

  @Post("ab-test")
  @SubscriptionFeatureLimit("posts")
  createAbTest(
    @Req() req: { user: AuthenticatedRequestUser },
    @Body() dto: CreateAbTestDto,
  ): Promise<unknown> {
    return this.abTestService.createAbTest(req.user, dto);
  }


  @Get("ab-test/:id/results")
  getAbTestResults(
    @TeamId() teamId: string | undefined,
    @Param("id") abTestId: string,
  ): Promise<unknown> {
    if (!teamId) {
      throw new Error("Team context required");
    }
    return this.abTestService.getAbTestResults(teamId, abTestId);
  }


  @Get("ab-test")
  listAbTests(@TeamId() teamId: string | undefined): Promise<unknown> | [] {
    if (!teamId) {
      return [];
    }
    return this.abTestService.listAbTests(teamId);
  }

  @Post("ab-test/:id/calculate-winner")
  calculateWinner(@Param("id") abTestId: string): Promise<unknown> {
    return this.abTestService.calculateWinner(abTestId);
  }
}
