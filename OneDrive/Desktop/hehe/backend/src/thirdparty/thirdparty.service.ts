import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';

@Injectable()
export class ThirdPartyService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllByTeam(user: AuthenticatedRequestUser) {
    const teamId = await this.resolveTeamId(user.userId, user.team_id);
    return this.prisma.thirdPartyIntegration.findMany({
      where: { teamId },
      select: {
        id: true,
        identifier: true,
        name: true,
        username: true,
        externalId: true,
        createdAt: true,
      },
    });
  }

  async save(
    user: AuthenticatedRequestUser,
    identifier: string,
    apiKey: string,
    data: { name: string; username: string; id: string },
  ) {
    const teamId = await this.resolveTeamId(user.userId, user.team_id);
    const encryptedKey = this.encrypt(apiKey);

    return this.prisma.thirdPartyIntegration.upsert({
      where: { teamId_identifier: { teamId, identifier } },
      create: {
        teamId,
        identifier,
        type: 'custom',
        apiKey: encryptedKey,
        name: data.name,
        username: data.username,
        externalId: data.id,
      },
      update: {
        apiKey: encryptedKey,
        name: data.name,
        username: data.username,
        externalId: data.id,
      },
    });
  }

  async delete(user: AuthenticatedRequestUser, id: string) {
    const teamId = await this.resolveTeamId(user.userId, user.team_id);
    return this.prisma.thirdPartyIntegration.deleteMany({
      where: { teamId, id },
    });
  }

  async getDecryptedApiKey(user: AuthenticatedRequestUser, identifier: string): Promise<string> {
    const teamId = await this.resolveTeamId(user.userId, user.team_id);

    const integration = await this.prisma.thirdPartyIntegration.findUnique({
      where: { teamId_identifier: { teamId, identifier } },
    });

    if (!integration?.apiKey) {
      throw new NotFoundException(`ThirdParty '${identifier}' has no API key for this team`);
    }

    return this.decrypt(integration.apiKey);
  }

  private async resolveTeamId(userId: string, teamId?: string): Promise<string> {
    const membership = await this.prisma.teamMember.findFirst({
      where: teamId ? { userId, teamId } : { userId },
      select: { teamId: true },
      orderBy: { id: 'asc' },
    });

    if (!membership) throw new ForbiddenException('User is not a team member');

    return membership.teamId;
  }

  private deriveKey(): Buffer {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');
    return createHash('sha256').update(`thirdparty:${secret}`).digest();
  }

  private encrypt(value: string): string {
    const key = this.deriveKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`;
  }

  private decrypt(value: string): string {
    const key = this.deriveKey();
    const [ivB64, authTagB64, encryptedB64] = value.split('.');
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedB64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }
}
