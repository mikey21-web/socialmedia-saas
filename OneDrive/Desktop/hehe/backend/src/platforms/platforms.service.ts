import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { WorkflowExecutionAlreadyStartedError } from '@temporalio/client';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { tokenRefreshWorkflow } from '../publishing/workflows/token-refresh.workflow';
import { PrismaService } from '../prisma/prisma.service';
import { TemporalClientService } from '../temporal/client';

const SUPPORTED_PLATFORMS = ['x', 'twitter', 'instagram', 'linkedin', 'facebook', 'youtube', 'tiktok'] as const;
type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

export type PlatformTokenPayload = {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
};

@Injectable()
export class PlatformsService {
  private readonly logger = new Logger(PlatformsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly temporalClientService: TemporalClientService,
  ) {}

  listSupportedPlatforms() {
    return SUPPORTED_PLATFORMS;
  }

  async storeCredential(
    userId: string,
    platform: string,
    tokens: PlatformTokenPayload,
    accountId: string,
    accountName?: string,
  ) {
    const normalizedPlatform = this.normalizePlatform(platform);
    const teamId = await this.resolveTeamId(userId);
    const key = this.deriveKey(userId);

    const encryptedAccessToken = this.encryptValue(tokens.accessToken, key);
    const encryptedRefreshToken = tokens.refreshToken
      ? this.encryptValue(tokens.refreshToken, key)
      : null;

    const credential = await this.prisma.platformCredential.upsert({
      where: {
        teamId_platform_accountId: {
          teamId,
          platform: normalizedPlatform,
          accountId,
        },
      },
      create: {
        teamId,
        platform: normalizedPlatform,
        accountId,
        accountName: accountName ?? null,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: tokens.expiresAt ?? null,
      },
      update: {
        accountName: accountName ?? null,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: tokens.expiresAt ?? null,
      },
    });

    if (tokens.expiresAt) {
      await this.scheduleTokenRefreshWorkflow(userId, normalizedPlatform, teamId, credential.id);
    }

    return credential;
  }

  async scheduleTokenRefreshWorkflow(
    userId: string,
    platform: string,
    teamId: string,
    credentialId?: string,
  ) {
    if (!credentialId) {
      throw new BadRequestException('Credential id is required for token refresh scheduling');
    }

    const client = await this.temporalClientService.getClient();

    try {
      await client.workflow.start(tokenRefreshWorkflow, {
        taskQueue: 'posts-queue',
        workflowId: `token-refresh-${teamId}-${platform}`,
        workflowExecutionTimeout: '30 days',
        args: [{ teamId, platform, userId, credentialId }],
      });
    } catch (error) {
      if (error instanceof WorkflowExecutionAlreadyStartedError) {
        this.logger.log(`Token refresh workflow already running for ${teamId}/${platform}`);
        return;
      }
      throw error;
    }
  }

  async getCredential(userId: string, platform: string, accountId?: string) {
    const normalizedPlatform = this.normalizePlatform(platform);
    const teamId = await this.resolveTeamId(userId);
    const key = this.deriveKey(userId);

    const credential = accountId
      ? await this.prisma.platformCredential.findUnique({
        where: {
          teamId_platform_accountId: {
            teamId,
            platform: normalizedPlatform,
            accountId,
          },
        },
      })
      : await this.prisma.platformCredential.findFirst({
        where: {
          teamId,
          platform: normalizedPlatform,
        },
        orderBy: { createdAt: 'asc' },
      });

    if (!credential) {
      throw new NotFoundException('Platform credential not found');
    }

    return {
      id: credential.id,
      accountId: credential.accountId,
      accountName: credential.accountName,
      accessToken: this.decryptValue(credential.accessToken, key),
      refreshToken: credential.refreshToken
        ? this.decryptValue(credential.refreshToken, key)
        : null,
      expiresAt: credential.expiresAt,
    };
  }

  async getCredentialsByPlatform(userId: string, platform: string) {
    const normalizedPlatform = this.normalizePlatform(platform);
    const teamId = await this.resolveTeamId(userId);
    const key = this.deriveKey(userId);

    const credentials = await this.prisma.platformCredential.findMany({
      where: { teamId, platform: normalizedPlatform },
      orderBy: { createdAt: 'asc' },
    });

    return credentials.map((credential) => ({
      id: credential.id,
      accountId: credential.accountId,
      accountName: credential.accountName,
      accessToken: this.decryptValue(credential.accessToken, key),
      refreshToken: credential.refreshToken
        ? this.decryptValue(credential.refreshToken, key)
        : null,
      expiresAt: credential.expiresAt,
    }));
  }

  async listTeamCredentials(teamId: string) {
    const credentials = await this.prisma.platformCredential.findMany({
      where: { teamId },
      orderBy: [{ platform: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        platform: true,
        accountId: true,
        accountName: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const now = Date.now();
    return credentials.map((credential) => ({
      ...credential,
      status: credential.expiresAt && credential.expiresAt.getTime() <= now ? 'expired' : 'connected',
    }));
  }

  async deleteCredential(teamId: string, credentialId: string) {
    const credential = await this.prisma.platformCredential.findFirst({
      where: { id: credentialId, teamId },
      select: { id: true },
    });
    if (!credential) {
      throw new NotFoundException('Platform credential not found');
    }

    await this.prisma.platformCredential.delete({ where: { id: credentialId } });
    return { deleted: true };
  }

  async getCredentialById(userId: string, credentialId: string) {
    const key = this.deriveKey(userId);
    const credential = await this.prisma.platformCredential.findFirst({
      where: {
        id: credentialId,
        team: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    });

    if (!credential) {
      throw new NotFoundException('Platform credential not found');
    }

    return {
      id: credential.id,
      platform: credential.platform,
      accountId: credential.accountId,
      accountName: credential.accountName,
      accessToken: this.decryptValue(credential.accessToken, key),
      refreshToken: credential.refreshToken
        ? this.decryptValue(credential.refreshToken, key)
        : null,
      expiresAt: credential.expiresAt,
    };
  }

  async refreshToken(userId: string, credentialId: string) {
    const credential = await this.getCredentialById(userId, credentialId);
    const normalizedPlatform = this.normalizePlatform(credential.platform);

    if (!credential.refreshToken) {
      throw new BadRequestException('NoRefreshToken');
    }

    const refreshedTokens = await this.callRefreshTokenEndpoint(
      normalizedPlatform,
      credential.refreshToken,
    );

    await this.storeCredential(
      userId,
      normalizedPlatform,
      {
        accessToken: refreshedTokens.accessToken,
        refreshToken: refreshedTokens.refreshToken ?? credential.refreshToken,
        expiresAt: refreshedTokens.expiresAt,
      },
      credential.accountId ?? normalizedPlatform,
      credential.accountName ?? undefined,
    );

    this.logger.log(`Refreshed token for ${normalizedPlatform} credential ${credentialId}`);

    return {
      platform: normalizedPlatform,
      refreshed: true,
    };
  }

  private async callRefreshTokenEndpoint(platform: string, refreshToken: string) {
    const clientId = this.readOAuthEnv(platform, 'CLIENT_ID');
    const clientSecret = this.readOAuthEnv(platform, 'CLIENT_SECRET');

    const tokenEndpointByPlatform: Record<string, string> = {
      x: 'https://api.twitter.com/2/oauth2/token',
      instagram: 'https://graph.instagram.com/refresh_access_token',
      linkedin: 'https://www.linkedin.com/oauth/v2/accessToken',
      facebook: 'https://graph.facebook.com/v19.0/oauth/access_token',
      youtube: 'https://oauth2.googleapis.com/token',
      tiktok: 'https://open.tiktokapis.com/v2/oauth/token/',
    };

    const tokenEndpoint = tokenEndpointByPlatform[platform];

    if (!tokenEndpoint) {
      throw new BadRequestException('PlatformNotSupported');
    }

    if (platform === 'instagram') {
      const url = new URL(tokenEndpoint);
      url.searchParams.set('grant_type', 'ig_refresh_token');
      url.searchParams.set('access_token', refreshToken);

      const response = await fetch(url, { method: 'GET' });
      const payload = await this.extractJson(response);
      return this.normalizeTokenResponse(payload);
    }

    if (platform === 'tiktok') {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_key: clientId,
        client_secret: clientSecret,
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      const payload = await this.extractJson(response);
      return this.normalizeTokenResponse(payload);
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const payload = await this.extractJson(response);
    return this.normalizeTokenResponse(payload);
  }

  private normalizeTokenResponse(payload: Record<string, unknown>) {
    const accessToken = this.readString(payload, ['access_token', 'accessToken']);
    const refreshToken = this.readOptionalString(payload, ['refresh_token', 'refreshToken']);
    const expiresIn = this.readOptionalNumber(payload, ['expires_in', 'expiresIn']);

    return {
      accessToken,
      refreshToken,
      expiresAt: typeof expiresIn === 'number'
        ? new Date(Date.now() + expiresIn * 1000)
        : null,
    };
  }

  private deriveKey(userId: string) {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (encryptionKey) {
      const decoded = Buffer.from(encryptionKey, 'hex');
      if (decoded.length === 32) {
        return decoded;
      }
    }

    const secret = process.env.TOKEN_ENCRYPTION_KEY;

    if (!secret) {
      throw new Error('ENCRYPTION_KEY env not set');
    }

    return createHash('sha256')
      .update(`${secret}:${userId}`)
      .digest();
  }

  private encryptValue(value: string, key: Buffer) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`;
  }

  private decryptValue(value: string, key: Buffer) {
    const [ivB64, authTagB64, encryptedB64] = value.split('.');

    if (!ivB64 || !authTagB64 || !encryptedB64) {
      throw new BadRequestException('Stored credential format is invalid');
    }

    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedB64, 'base64')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  private async resolveTeamId(userId: string) {
    const membership = await this.prisma.teamMember.findFirst({
      where: { userId },
      select: { teamId: true },
      orderBy: { id: 'asc' },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of any team');
    }

    return membership.teamId;
  }

  private normalizePlatform(platform: string) {
    const normalizedPlatform = platform.toLowerCase() === 'twitter' ? 'x' : platform.toLowerCase();

    if (!SUPPORTED_PLATFORMS.includes(normalizedPlatform as SupportedPlatform)) {
      throw new BadRequestException(`Unsupported platform: ${platform}`);
    }

    return normalizedPlatform;
  }

  private async extractJson(response: Response) {
    const payload = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      const message = this.readOptionalString(payload, ['error_description', 'error', 'message'])
        ?? 'OAuth token exchange failed';
      throw new BadRequestException(message);
    }

    return payload;
  }

  private readOAuthEnv(platform: string, key: 'CLIENT_ID' | 'CLIENT_SECRET') {
    const envPrefixByPlatform: Record<string, string> = {
      x: 'X',
      instagram: 'INSTAGRAM',
      linkedin: 'LINKEDIN',
      facebook: 'FACEBOOK',
      youtube: 'YOUTUBE',
      tiktok: 'TIKTOK',
    };

    const prefix = envPrefixByPlatform[platform];
    const envKey = `${prefix}_${key}`;
    const value = process.env[envKey];

    if (!value) {
      throw new BadRequestException(`${envKey} is not configured`);
    }

    return value;
  }

  private readString(payload: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    throw new BadRequestException('Token response did not include access token');
  }

  private readOptionalString(payload: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return null;
  }

  private readOptionalNumber(payload: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'number') {
        return value;
      }
      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  }
}
