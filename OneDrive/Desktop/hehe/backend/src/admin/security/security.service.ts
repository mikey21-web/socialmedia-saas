import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminSecurityService {
  constructor(private readonly prisma: PrismaService) {}

  apiKeys(teamId: string) {
    return this.prisma.db.apiKey.findMany({ where: { teamId, revokedAt: null }, select: { id: true, teamId: true, description: true, lastUsed: true, createdAt: true } });
  }

  async createApiKey(data: { teamId: string; description?: string }) {
    const key = `diyaa_${randomBytes(24).toString('hex')}`;
    const keyHash = await bcrypt.hash(key, 12);
    const record = await this.prisma.db.apiKey.create({ data: { teamId: data.teamId, description: data.description, keyHash } });
    return { id: record.id, key, description: record.description, createdAt: record.createdAt };
  }

  revokeApiKey(id: string) {
    return this.prisma.db.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  whitelist(teamId: string) {
    return this.prisma.db.ipWhitelist.findMany({ where: { teamId }, orderBy: { createdAt: 'desc' } });
  }

  addIp(data: { teamId: string; ipAddress: string; ip_address?: string; description?: string }) {
    return this.prisma.db.ipWhitelist.create({ data: { teamId: data.teamId, ipAddress: data.ipAddress ?? data.ip_address, description: data.description } });
  }

  removeIp(id: string) {
    return this.prisma.db.ipWhitelist.delete({ where: { id } });
  }

  sessions(teamId: string) {
    return this.prisma.db.activeSession.findMany({ where: { teamId, revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { expiresAt: 'asc' } });
  }

  revokeSession(id: string) {
    return this.prisma.db.activeSession.update({ where: { id }, data: { revokedAt: new Date() } });
  }
}
