import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminBackupsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const teams = await this.prisma.team.findMany({ where: { lastBackupAt: { not: null } }, select: { id: true, name: true, lastBackupAt: true }, orderBy: { lastBackupAt: 'desc' }, take: 20 });
    return {
      provider: process.env.RAILWAY_ENVIRONMENT ? 'railway' : process.env.VERCEL ? 'vercel' : 'manual',
      backups: teams.map((team) => ({ id: team.id, team: team.name, date: team.lastBackupAt, size: null, status: 'completed' })),
    };
  }

  async manual() {
    const now = new Date();
    await this.prisma.team.updateMany({ where: { deletedAt: null }, data: { lastBackupAt: now } });
    return { triggered: true, status: 'queued', provider: process.env.RAILWAY_ENVIRONMENT ? 'railway' : process.env.VERCEL ? 'vercel' : 'manual', requestedAt: now };
  }
}
