import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async submit(
    @Req() req: { user: { team_id: string; userId: string } },
    @Body() body: { type: string; score?: number; comment?: string; page?: string; metadata?: Record<string, unknown> },
  ) {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "feedback" (id, team_id, user_id, type, score, comment, page, metadata, created_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())`,
      req.user.team_id,
      req.user.userId,
      body.type ?? 'nps',
      body.score ?? null,
      body.comment ?? null,
      body.page ?? null,
      JSON.stringify(body.metadata ?? {}),
    );
    return { submitted: true };
  }

  @Get('summary')
  async summary(@Req() req: { user: { team_id: string } }) {
    const results = await this.prisma.$queryRawUnsafe<Array<{ type: string; avg_score: number; count: bigint }>>(
      `SELECT type, AVG(score) as avg_score, COUNT(*) as count FROM "feedback" WHERE team_id = $1 AND score IS NOT NULL GROUP BY type`,
      req.user.team_id,
    ).catch(() => []);

    return results.map(r => ({
      type: r.type,
      avgScore: Number(r.avg_score ?? 0),
      count: Number(r.count),
    }));
  }
}
