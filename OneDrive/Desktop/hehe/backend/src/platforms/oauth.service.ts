import { BadRequestException, Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../common/redis.provider';
import { PlatformsService } from './platforms.service';
import { PrismaService } from '../prisma/prisma.service';

type OAuthPlatform = 'x' | 'instagram' | 'linkedin' | 'facebook' | 'youtube' | 'tiktok';

type OAuthStateEntry = {
  userId: string;
  teamId?: string;
  platform: OAuthPlatform;
  codeVerifier?: string;
  createdAt: number;
};

type FacebookPage = {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string };
  picture?: { data?: { url?: string } };
};

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const GRAPH = 'https://graph.facebook.com/v20.0';

@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);
  private readonly fallbackStates = new Map<string, OAuthStateEntry>();

  constructor(
    private readonly platformsService: PlatformsService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
  ) {}

  async getAuthorizeUrl(platform: string, userId: string, teamId?: string) {
    const normalizedPlatform = this.normalizePlatform(platform);
    const resolvedTeamId = teamId ?? await this.resolveTeamId(userId);
    const state = this.jwtService.sign(
      { userId, teamId: resolvedTeamId, platform: normalizedPlatform },
      {
        secret: this.readJwtSecret(),
        expiresIn: '10m',
      },
    );
    const oauthState: OAuthStateEntry = {
      userId,
      teamId: resolvedTeamId,
      platform: normalizedPlatform,
      createdAt: Date.now(),
    };

    const callbackUrl = this.getCallbackUrl(normalizedPlatform);
    let authorizeUrl: URL;

    if (normalizedPlatform === 'x') {
      const codeVerifier = randomBytes(32).toString('base64url');
      const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
      oauthState.codeVerifier = codeVerifier;
      const clientId = this.readOAuthEnv('x', 'CLIENT_ID');

      authorizeUrl = new URL('https://twitter.com/i/oauth2/authorize');
      authorizeUrl.searchParams.set('response_type', 'code');
      authorizeUrl.searchParams.set('client_id', clientId);
      authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
      authorizeUrl.searchParams.set(
        'scope',
        process.env.X_OAUTH_SCOPE ?? 'tweet.read tweet.write users.read offline.access',
      );
      authorizeUrl.searchParams.set('state', state);
      authorizeUrl.searchParams.set('code_challenge', codeChallenge);
      authorizeUrl.searchParams.set('code_challenge_method', 'S256');
      await this.storeCodeVerifier(state, codeVerifier);
    } else if (normalizedPlatform === 'linkedin') {
      const clientId = this.readOAuthEnv('linkedin', 'CLIENT_ID');

      authorizeUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
      authorizeUrl.searchParams.set('response_type', 'code');
      authorizeUrl.searchParams.set('client_id', clientId);
      authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
      authorizeUrl.searchParams.set(
        'scope',
        process.env.LINKEDIN_OAUTH_SCOPE ?? 'openid profile w_member_social',
      );
      authorizeUrl.searchParams.set('state', state);
    } else if (normalizedPlatform === 'youtube') {
      const clientId = this.readOAuthEnv('youtube', 'CLIENT_ID');
      const YOUTUBE_SCOPES = [
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/yt-analytics.readonly',
        'openid',
        'profile',
        'email',
      ].join(' ');

      authorizeUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authorizeUrl.searchParams.set('response_type', 'code');
      authorizeUrl.searchParams.set('client_id', clientId);
      authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
      authorizeUrl.searchParams.set('scope', YOUTUBE_SCOPES);
      authorizeUrl.searchParams.set('state', state);
      authorizeUrl.searchParams.set('access_type', 'offline');
      authorizeUrl.searchParams.set('prompt', 'consent');
    } else if (normalizedPlatform === 'tiktok') {
      const clientId = this.readOAuthEnv('tiktok', 'CLIENT_ID');
      authorizeUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
      authorizeUrl.searchParams.set('client_key', clientId);
      authorizeUrl.searchParams.set('response_type', 'code');
      authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
      authorizeUrl.searchParams.set('scope', 'user.info.basic,video.publish,video.upload');
      authorizeUrl.searchParams.set('state', state);
    } else {
      // facebook AND instagram both go through Facebook OAuth
      const facebookScopes =
        normalizedPlatform === 'instagram'
          ? 'instagram_basic,pages_show_list,pages_read_engagement,business_management,instagram_content_publish,instagram_manage_insights'
          : 'pages_show_list,business_management,pages_manage_posts,pages_manage_engagement,pages_read_engagement,read_insights';

      const clientId = this.readOAuthEnv('facebook', 'CLIENT_ID');

      authorizeUrl = new URL('https://www.facebook.com/v20.0/dialog/oauth');
      authorizeUrl.searchParams.set('client_id', clientId);
      authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
      authorizeUrl.searchParams.set('response_type', 'code');
      authorizeUrl.searchParams.set('scope', facebookScopes);
      authorizeUrl.searchParams.set('state', state);
    }

    await this.storeOAuthState(state, oauthState);

    return authorizeUrl.toString();
  }

  async handleOAuthCallback(params: {
    code?: string;
    state?: string;
    platform?: string;
    error?: string;
  }) {
    if (params.error) {
      throw new BadRequestException(`OAuth provider returned error: ${params.error}`);
    }

    if (!params.code || !params.state) {
      throw new BadRequestException('OAuth callback is missing required query params');
    }

    const oauthState = await this.getOAuthState(params.state);

    if (!oauthState) {
      throw new BadRequestException('OAuth state is invalid or has expired');
    }

    await this.deleteOAuthState(params.state);

    const { platform, userId } = oauthState;

    if (platform === 'x') {
      const tokenPayload = await this.exchangeXCode(params.code, oauthState.codeVerifier!);
      await this.platformsService.storeCredential(userId, 'x', tokenPayload, 'default');
      return { connected: true, platform: 'x' };
    }

    if (platform === 'linkedin') {
      const tokenPayload = await this.exchangeLinkedInCode(params.code);
      await this.platformsService.storeCredential(userId, 'linkedin', tokenPayload, 'default');
      return { connected: true, platform: 'linkedin' };
    }

    if (platform === 'youtube') {
      const tokenPayload = await this.exchangeYouTubeCode(params.code);
      const channelInfo = await this.fetchYouTubeChannelInfo(tokenPayload.accessToken);
      await this.platformsService.storeCredential(
        userId,
        'youtube',
        tokenPayload,
        channelInfo.id,
        channelInfo.title,
      );
      return { connected: true, platform: 'youtube' };
    }

    if (platform === 'tiktok') {
      const tokenPayload = await this.exchangeTikTokCode(params.code);
      await this.platformsService.storeCredential(userId, 'tiktok', tokenPayload, 'default', 'TikTok');
      return { connected: true, platform: 'tiktok' };
    }

    // facebook or instagram — both exchange via Facebook OAuth
    const longLivedToken = await this.exchangeFacebookCode(params.code);
    const pages = await this.fetchAllFacebookPages(longLivedToken);
    const expiresAt = new Date(Date.now() + 59 * 24 * 60 * 60 * 1000);

    if (platform === 'facebook') {
      for (const page of pages) {
        await this.platformsService.storeCredential(
          userId,
          'facebook',
          { accessToken: page.access_token, refreshToken: null, expiresAt },
          page.id,
          page.name,
        );
        this.logger.log(`Connected Facebook page: ${page.name} (${page.id})`);
      }
    } else {
      // instagram — store IG Business Accounts linked to pages
      let connectedCount = 0;
      for (const page of pages) {
        if (!page.instagram_business_account?.id) continue;

        const igId = page.instagram_business_account.id;
        const igDetails = await this.fetchInstagramAccountDetails(igId, longLivedToken);

        await this.platformsService.storeCredential(
          userId,
          'instagram',
          { accessToken: page.access_token, refreshToken: null, expiresAt },
          igId,
          igDetails?.username ?? igDetails?.name ?? igId,
        );
        connectedCount++;
        this.logger.log(`Connected Instagram account: ${igDetails?.username ?? igId}`);
      }

      if (connectedCount === 0) {
        throw new BadRequestException(
          'No Instagram Business accounts found. Make sure your Instagram is a Business or Creator account connected to a Facebook Page.',
        );
      }
    }

    return { connected: true, platform };
  }

  private async exchangeXCode(code: string, codeVerifier: string) {
    const callbackUrl = this.getCallbackUrl('x');
    const clientId = this.readOAuthEnv('x', 'CLIENT_ID');

    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        client_id: clientId,
        code_verifier: codeVerifier,
      }),
    });

    const payload = await this.extractJson(response);
    return this.normalizeTokenResponse(payload);
  }

  private async exchangeLinkedInCode(code: string) {
    const callbackUrl = this.getCallbackUrl('linkedin');
    const clientId = this.readOAuthEnv('linkedin', 'CLIENT_ID');
    const clientSecret = this.readOAuthEnv('linkedin', 'CLIENT_SECRET');

    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const payload = await this.extractJson(response);
    return this.normalizeTokenResponse(payload);
  }

  private async exchangeYouTubeCode(code: string) {
    const callbackUrl = this.getCallbackUrl('youtube');
    const clientId = this.readOAuthEnv('youtube', 'CLIENT_ID');
    const clientSecret = this.readOAuthEnv('youtube', 'CLIENT_SECRET');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const payload = await this.extractJson(response);
    return this.normalizeTokenResponse(payload);
  }

  private async exchangeTikTokCode(code: string) {
    const callbackUrl = this.getCallbackUrl('tiktok');
    const clientId = this.readOAuthEnv('tiktok', 'CLIENT_ID');
    const clientSecret = this.readOAuthEnv('tiktok', 'CLIENT_SECRET');

    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
      }),
    });

    const payload = await this.extractJson(response);
    return this.normalizeTokenResponse(payload);
  }

  private async fetchYouTubeChannelInfo(accessToken: string): Promise<{ id: string; title: string }> {
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const json = (await res.json()) as {
      items?: Array<{ id: string; snippet?: { title?: string } }>;
    };
    const channel = json.items?.[0];
    return {
      id: channel?.id ?? 'default',
      title: channel?.snippet?.title ?? 'YouTube Channel',
    };
  }

  private async exchangeFacebookCode(code: string): Promise<string> {
    const callbackUrl = this.getCallbackUrl('facebook');
    const clientId = this.readOAuthEnv('facebook', 'CLIENT_ID');
    const clientSecret = this.readOAuthEnv('facebook', 'CLIENT_SECRET');

    // Short-lived token
    const shortRes = await fetch(
      `${GRAPH}/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&client_secret=${clientSecret}&code=${code}`,
    );
    const shortPayload = await this.extractJson(shortRes);
    const shortToken = this.readString(shortPayload, ['access_token']);

    // Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortToken}`,
    );
    const longPayload = await this.extractJson(longRes);
    return this.readString(longPayload, ['access_token']);
  }

  private async fetchAllFacebookPages(userToken: string): Promise<FacebookPage[]> {
    const seenIds = new Set<string>();
    const pages: FacebookPage[] = [];
    const authHeader = { Authorization: `Bearer ${userToken}` };

    const fetchPaginated = async (startUrl: string) => {
      let url: string | undefined = startUrl;
      while (url) {
        const res = await fetch(url, { headers: authHeader });
        const json = (await res.json()) as {
          data?: FacebookPage[];
          paging?: { next?: string };
        };
        for (const page of json.data ?? []) {
          if (!seenIds.has(page.id)) {
            seenIds.add(page.id);
            pages.push(page);
          }
        }
        url = json.paging?.next;
      }
    };

    await fetchPaginated(
      `${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account,picture.type(large)&limit=100`,
    );

    // Also check Business Manager pages
    try {
      let bizUrl: string | undefined = `${GRAPH}/me/businesses`;

      while (bizUrl) {
        const bizRes = await fetch(bizUrl, { headers: authHeader });
        const bizJson = (await bizRes.json()) as {
          data?: { id: string }[];
          paging?: { next?: string };
        };

        for (const biz of bizJson.data ?? []) {
          try {
            await fetchPaginated(
              `${GRAPH}/${biz.id}/owned_pages?fields=id,name,access_token,instagram_business_account,picture.type(large)&limit=100`,
            );
          } catch {
            // continue
          }
          try {
            await fetchPaginated(
              `${GRAPH}/${biz.id}/client_pages?fields=id,name,access_token,instagram_business_account,picture.type(large)&limit=100`,
            );
          } catch {
            // continue
          }
        }

        bizUrl = bizJson.paging?.next;
      }
    } catch {
      // Business Manager not available for all users
    }

    return pages;
  }

  private async fetchInstagramAccountDetails(
    igId: string,
    userToken: string,
  ): Promise<{ id: string; name?: string; username?: string } | null> {
    try {
      const res = await fetch(
        `${GRAPH}/${igId}?fields=id,name,username`,
        { headers: { Authorization: `Bearer ${userToken}` } },
      );
      return (await res.json()) as { id: string; name?: string; username?: string };
    } catch {
      return null;
    }
  }

  private normalizeTokenResponse(payload: Record<string, unknown>) {
    const accessToken = this.readString(payload, ['access_token', 'accessToken']);
    const refreshToken = this.readOptionalString(payload, ['refresh_token', 'refreshToken']);
    const expiresIn = this.readOptionalNumber(payload, ['expires_in', 'expiresIn']);

    return {
      accessToken,
      refreshToken,
      expiresAt:
        typeof expiresIn === 'number'
          ? new Date(Date.now() + expiresIn * 1000)
          : null,
    };
  }

  private async extractJson(response: Response) {
    const payload = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      const message =
        this.readOptionalString(payload, ['error_description', 'error', 'message']) ??
        'OAuth token exchange failed';
      throw new BadRequestException(message);
    }
    return payload;
  }

  private async storeOAuthState(state: string, entry: OAuthStateEntry) {
    if (this.redis) {
      await this.redis.set(`oauth:${state}`, JSON.stringify(entry), 'EX', 300);
    } else {
      this.fallbackStates.set(state, entry);
      const now = Date.now();
      for (const [k, v] of this.fallbackStates.entries()) {
        if (now - v.createdAt > FIVE_MINUTES_MS) this.fallbackStates.delete(k);
      }
    }
  }

  private async getOAuthState(state: string): Promise<OAuthStateEntry | null> {
    const decoded = this.decodeState(state);
    if (decoded) {
      const codeVerifier = await this.getCodeVerifier(state);
      return { ...decoded, codeVerifier, createdAt: Date.now() };
    }

    if (this.redis) {
      const json = await this.redis.get(`oauth:${state}`);
      return json ? (JSON.parse(json) as OAuthStateEntry) : null;
    }
    const entry = this.fallbackStates.get(state);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > FIVE_MINUTES_MS) {
      this.fallbackStates.delete(state);
      return null;
    }
    return entry;
  }

  private async deleteOAuthState(state: string) {
    if (this.redis) {
      await this.redis.del(`oauth:${state}`);
    } else {
      this.fallbackStates.delete(state);
    }
  }

  async refreshTokenIfExpired(credentialId: string) {
    const credential = await this.prisma.platformCredential.findUnique({
      where: { id: credentialId },
    });
    if (!credential) {
      throw new BadRequestException('Platform credential not found');
    }
    if (!credential.expiresAt || credential.expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
      return credential;
    }
    if (!credential.refreshToken) {
      return credential;
    }

    const refreshToken = this.decryptToken(credential.refreshToken);
    const refreshedTokens = await this.callRefreshTokenEndpoint(credential.platform, refreshToken);
    const accessToken = this.encryptToken(refreshedTokens.accessToken);
    const nextRefreshToken = refreshedTokens.refreshToken
      ? this.encryptToken(refreshedTokens.refreshToken)
      : credential.refreshToken;

    return this.prisma.platformCredential.update({
      where: { id: credential.id },
      data: {
        accessToken,
        refreshToken: nextRefreshToken,
        expiresAt: refreshedTokens.expiresAt,
      },
    });
  }

  encryptToken(raw: string) {
    const key = this.getEncryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(raw, 'utf8'), cipher.final()]);
    return `${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${encrypted.toString('base64')}`;
  }

  decryptToken(encrypted: string) {
    const [ivB64, tagB64, encryptedB64] = encrypted.split('.');
    if (!ivB64 || !tagB64 || !encryptedB64) {
      throw new BadRequestException('Stored credential format is invalid');
    }
    const decipher = createDecipheriv('aes-256-gcm', this.getEncryptionKey(), Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedB64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  private async callRefreshTokenEndpoint(platform: string, refreshToken: string) {
    const normalizedPlatform = this.normalizePlatform(platform);
    const clientId = this.readOAuthEnv(normalizedPlatform, 'CLIENT_ID');
    const clientSecret = this.readOAuthEnv(normalizedPlatform, 'CLIENT_SECRET');
    const endpoint = normalizedPlatform === 'linkedin'
      ? 'https://www.linkedin.com/oauth/v2/accessToken'
      : 'https://api.twitter.com/2/oauth2/token';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    const payload = await this.extractJson(response);
    return this.normalizeTokenResponse(payload);
  }

  private normalizePlatform(platform: string): OAuthPlatform {
    const p = platform.toLowerCase();
    if (p !== 'x' && p !== 'instagram' && p !== 'linkedin' && p !== 'facebook' && p !== 'youtube' && p !== 'tiktok') {
      throw new BadRequestException(`Unsupported platform: ${platform}`);
    }
    return p;
  }

  private getCallbackUrl(platform: string) {
    const normalizedPlatform = platform === 'x' ? 'TWITTER' : platform.toUpperCase();
    return process.env[`${normalizedPlatform}_REDIRECT_URI`]
      ?? process.env.OAUTH_CALLBACK_URL
      ?? `http://localhost:3001/platforms/callback/${platform}`;
  }

  private readOAuthEnv(platform: string, key: 'CLIENT_ID' | 'CLIENT_SECRET') {
    const prefix = platform === 'x' ? 'TWITTER' : platform.toUpperCase();
    const legacyPrefix = platform.toUpperCase();
    const envKey = `${prefix}_${key}`;
    const legacyEnvKey = `${legacyPrefix}_${key}`;
    const value = process.env[envKey];
    if (!value && process.env[legacyEnvKey]) return process.env[legacyEnvKey] as string;
    if (!value) throw new BadRequestException(`${envKey} is not configured`);
    return value;
  }

  private async resolveTeamId(userId: string) {
    const membership = await this.prisma.teamMember.findFirst({
      where: { userId },
      select: { teamId: true },
      orderBy: { id: 'asc' },
    });
    if (!membership) {
      throw new BadRequestException('User is not a member of any team');
    }
    return membership.teamId;
  }

  private readJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new BadRequestException('JWT_SECRET is not configured');
    return secret;
  }

  private decodeState(state: string): OAuthStateEntry | null {
    try {
      const decoded = this.jwtService.verify(state, { secret: this.readJwtSecret() }) as {
        userId?: unknown;
        teamId?: unknown;
        platform?: unknown;
      };
      if (typeof decoded.userId !== 'string' || typeof decoded.platform !== 'string') return null;
      return {
        userId: decoded.userId,
        teamId: typeof decoded.teamId === 'string' ? decoded.teamId : undefined,
        platform: this.normalizePlatform(decoded.platform),
        createdAt: Date.now(),
      };
    } catch {
      return null;
    }
  }

  private async storeCodeVerifier(state: string, codeVerifier: string) {
    if (this.redis) {
      await this.redis.set(`oauth:pkce:${state}`, codeVerifier, 'EX', 600);
      return;
    }
    this.fallbackStates.set(`pkce:${state}`, {
      userId: '',
      platform: 'x',
      codeVerifier,
      createdAt: Date.now(),
    });
  }

  private async getCodeVerifier(state: string) {
    if (this.redis) {
      return await this.redis.get(`oauth:pkce:${state}`) ?? undefined;
    }
    const entry = this.fallbackStates.get(`pkce:${state}`);
    return entry?.codeVerifier;
  }

  private getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) throw new BadRequestException('ENCRYPTION_KEY is not configured');
    const buffer = Buffer.from(key, 'hex');
    if (buffer.length !== 32) throw new BadRequestException('ENCRYPTION_KEY must be 32-byte hex');
    return buffer;
  }

  private readString(payload: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim()) return value;
    }
    throw new BadRequestException('Token response did not include access token');
  }

  private readOptionalString(payload: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim()) return value;
    }
    return null;
  }

  private readOptionalNumber(payload: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const n = Number(value);
        if (!Number.isNaN(n)) return n;
      }
    }
    return null;
  }
}
