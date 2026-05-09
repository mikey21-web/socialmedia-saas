import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { stableRolloutBucket } from '../admin-utils';

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.db.featureFlag.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(data: { name: string; enabled?: boolean; description?: string; rolloutPercentage?: number }) {
    return this.prisma.db.featureFlag.create({
      data: {
        name: data.name,
        enabled: data.enabled ?? false,
        description: data.description,
        rolloutPercentage: Math.min(Math.max(data.rolloutPercentage ?? 0, 0), 100),
      },
    });
  }

  update(id: string, data: { name?: string; enabled?: boolean; description?: string; rolloutPercentage?: number }) {
    return this.prisma.db.featureFlag.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.rolloutPercentage !== undefined ? { rolloutPercentage: Math.min(Math.max(data.rolloutPercentage, 0), 100) } : {}),
      },
    });
  }

  remove(id: string) {
    return this.prisma.db.featureFlag.delete({ where: { id } });
  }

  async check(flagName: string, teamId?: string) {
    const flag = await this.prisma.db.featureFlag.findUnique({ where: { name: flagName } });
    if (!flag) throw new NotFoundException('Feature flag not found');
    const rollout = Number(flag.rolloutPercentage ?? 0);
    const inRollout = teamId ? stableRolloutBucket(`${flag.name}:${teamId}`) < rollout : rollout >= 100;
    return { flagName, teamId: teamId ?? null, enabled: Boolean(flag.enabled) && inRollout, rolloutPercentage: rollout };
  }
}
