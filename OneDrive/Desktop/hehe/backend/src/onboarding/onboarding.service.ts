import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgencyOrchestratorService } from '../agency/orchestrator/agency-orchestrator.service';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: AgencyOrchestratorService,
  ) {}

  async complete(teamId: string) {
    await this.prisma.team.update({
      where: { id: teamId },
      data: {
        onboardingComplete: true,
        agencyTier: 'solo',
      },
    });

    this.orchestrator.runDailyCycleForTeam(teamId).catch((err) => {
      console.error(`Background cycle failed for team ${teamId}:`, err);
    });

    return { success: true, redirectTo: '/agency' };
  }
}
