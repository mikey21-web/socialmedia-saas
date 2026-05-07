import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthenticatedRequestUser } from "../common/interfaces/authenticated-request-user.interface";
import { TeamsService } from "../teams/teams.service";

const VALID_PLATFORMS = ["x", "instagram", "linkedin", "facebook", "tiktok", "youtube"] as const;
type ValidPlatform = (typeof VALID_PLATFORMS)[number];


interface CreateAbTestDto {
  caption: string;
  platforms: string[];
  timeA: string;
  timeB: string;
}

interface AbTestResult {
  ab_test_id: string;
  variantA_postId: string;
  variantB_postId: string;
}

interface AbTestWithPosts {
  id: string;
  teamId: string;
  caption: string;
  platforms: string[];
  variantATime: Date;
  variantBTime: Date;
  variantAEngagement: number;
  variantBEngagement: number;
  winner: string | null;
  createdAt: Date;
  posts: Array<{
    id: string;
    abTestVariant: string;
    scheduledAt: Date;
    status: string;
    platform: string;
  }>;
}

@Injectable()
export class AbTestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teamsService: TeamsService,
  ) {}

  async createAbTest(
    user: AuthenticatedRequestUser,
    dto: CreateAbTestDto,
  ): Promise<AbTestResult> {
    // Validate platforms
    for (const platform of dto.platforms) {
      if (!VALID_PLATFORMS.includes(platform as ValidPlatform)) {
        throw new BadRequestException(
          `Invalid platform: ${platform}. Valid values: ${VALID_PLATFORMS.join(", ")}`,
        );
      }
    }

    // Parse and validate times
    const timeA = new Date(dto.timeA);
    const timeB = new Date(dto.timeB);

    if (Number.isNaN(timeA.getTime())) {
      throw new BadRequestException("Invalid date format for timeA");
    }
    if (Number.isNaN(timeB.getTime())) {
      throw new BadRequestException("Invalid date format for timeB");
    }

    // Check if times are the same
    if (timeA.getTime() === timeB.getTime()) {
      throw new BadRequestException("Time A and Time B must be different");
    }

    // Check minimum time difference (1 hour)
    const hourInMs = 60 * 60 * 1000;
    const diff = Math.abs(timeA.getTime() - timeB.getTime());
    if (diff < hourInMs) {
      throw new BadRequestException(
        "Time difference between A and B must be at least 1 hour",
      );
    }

    // Validate caption length
    if (!dto.caption || dto.caption.length === 0) {
      throw new BadRequestException("Caption is required");
    }
    if (dto.caption.length > 5000) {
      throw new BadRequestException("Caption must be 5000 characters or less");
    }

    const teamId = await this.resolveTeamId(user.userId, user.team_id);
    const teamSignature = await this.teamsService.getTeamSignature(teamId);
    const normalizedSignature = teamSignature?.trim();

    const content = normalizedSignature
      ? `${dto.caption}\n\n${normalizedSignature}`
      : dto.caption;
    const title = content.trim().slice(0, 80) || "Untitled";

    // Create the A/B test and both post variants
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the ab_test record
      const abTest = await tx.abTest.create({
        data: {
          teamId,
          caption: dto.caption,
          platforms: dto.platforms,
          mediaUrls: [],
          variantATime: timeA,
          variantBTime: timeB,
        },
      });


      // Create variant A post
      const postA = await tx.post.create({
        data: {
          teamId,
          title,
          content,
          mediaUrls: [],
          scheduledAt: timeA,
          status: "scheduled",
          abTestId: abTest.id,
          abTestVariant: "A",
        },
      });

      // Create platform entries for variant A
      await tx.postPlatform.createMany({
        data: dto.platforms.map((platform) => ({
          postId: postA.id,
          platform,
          status: "scheduled",
        })),
      });

      // Create variant B post
      const postB = await tx.post.create({
        data: {
          teamId,
          title,
          content,
          mediaUrls: [],
          scheduledAt: timeB,
          status: "scheduled",
          abTestId: abTest.id,
          abTestVariant: "B",
        },
      });

      // Create platform entries for variant B
      await tx.postPlatform.createMany({
        data: dto.platforms.map((platform) => ({
          postId: postB.id,
          platform,
          status: "scheduled",
        })),
      });

      // Update ab_test with post IDs
      await tx.abTest.update({
        where: { id: abTest.id },
        data: {
          variantAPostId: postA.id,
          variantBPostId: postB.id,
        },
      });

      return {
        ab_test_id: abTest.id,
        variantA_postId: postA.id,
        variantB_postId: postB.id,
      };
    });

    return result;
  }

  async getAbTestResults(teamId: string, abTestId: string) {
    const abTest = await this.prisma.abTest.findUnique({
      where: { id: abTestId },
      include: {
        posts: {
          select: {
            id: true,
            abTestVariant: true,
            scheduledAt: true,
            status: true,
            platforms: {
              select: { platform: true },
            },
          },
        },
      },
    });

    if (!abTest || abTest.teamId !== teamId) {
      throw new BadRequestException("A/B test not found");
    }

    return {
      id: abTest.id,
      caption: abTest.caption,
      platforms: abTest.platforms,
      variantA: {
        time: abTest.variantATime,
        engagement: abTest.variantAEngagement,
        postId: abTest.variantAPostId,
        status: abTest.posts.find((p) => p.abTestVariant === "A")?.status,
      },
      variantB: {
        time: abTest.variantBTime,
        engagement: abTest.variantBEngagement,
        postId: abTest.variantBPostId,
        status: abTest.posts.find((p) => p.abTestVariant === "B")?.status,
      },
      winner: abTest.winner,
      createdAt: abTest.createdAt,
    };
  }

  async listAbTests(teamId: string) {
    const tests = await this.prisma.abTest.findMany({
      where: { teamId },
      orderBy: { createdAt: "desc" },
    });

    return tests;
  }

  async calculateWinner(abTestId: string): Promise<string | null> {
    const abTest = await this.prisma.abTest.findUnique({
      where: { id: abTestId },
      include: {
        posts: true,
      },
    });


    if (!abTest) {
      throw new BadRequestException("A/B test not found");
    }

    // Check if both variants have been published
    const variantA = abTest.posts.find((p) => p.abTestVariant === "A");
    const variantB = abTest.posts.find((p) => p.abTestVariant === "B");

    if (!variantA || !variantB) {
      throw new BadRequestException("One or both variants not found");
    }

    if (variantA.status !== "published" || variantB.status !== "published") {
      throw new BadRequestException("Both variants must be published to calculate winner");
    }

    // Calculate engagement (this would typically come from analytics data)
    // For now, we just compare the stored engagement values
    const winner =
      abTest.variantAEngagement > abTest.variantBEngagement
        ? "A"
        : abTest.variantBEngagement > abTest.variantAEngagement
          ? "B"
          : "tie";


    await this.prisma.abTest.update({
      where: { id: abTestId },
      data: { winner },
    });

    return winner === "tie" ? null : winner;
  }

  private async resolveTeamId(userId: string, teamId?: string): Promise<string> {
    const membership = await this.prisma.teamMember.findFirst({
      where: teamId ? { userId, teamId } : { userId },
      select: { teamId: true },
      orderBy: { id: "asc" },
    });

    if (!membership) {
      throw new BadRequestException("User is not a team member");
    }

    return membership.teamId;
  }
}
