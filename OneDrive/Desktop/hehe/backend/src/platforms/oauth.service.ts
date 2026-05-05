import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PlatformsService } from './platforms.service';

type OAuthPlatform = 'x' | 'instagram' | 'linkedin' | 'facebook';

type OAuthStateEntry = {
  userId: string;
  platform: OAuthPlatform;
  codeVerifier?: string;
  createdAt: number;
};

const FIVE_MINUTES_MS = 5 * 60 * 1000;

@Injectable()
export class OauthService {
  private readonly oauthStates = new Map<string, OAuthStateEntry>();

  constructor(private readonly platformsService: PlatformsService) {}

  getAuthorizeUrl(platform: string, userId: string) {
    const normalizedPlatform = this.normalizePlatform(platform);
    const state = randomUUID();
    const oauthState: OAuthStateEntry = {
      userId,
      platform: normalizedPlatform,
      createdAt: Date.now(),
    };

    let authorizeUrl: URL;
    const callbackUrl = this.getCallbackUrl();
    const clientId = this.readOAuthEnv(normalizedPlatform, 'CLIENT_ID');

    if (normalizedPlatform === 'x') {
      const codeVerifier = randomUUID().replace(/-/g, '');
      oauthState.codeVerifier = codeVerifier;

      authorizeUrl = new URL('https://twitter.com/i/oauth2/authorize');
      authorizeUrl.searchParams.set('response_type', 'code');
      authorizeUrl.searchParams.set('client_id', clientId);
      authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
      authorizeUrl.searchParams.set(
        'scope',
        process.env.X_OAUTH_SCOPE ?? 'tweet.read tweet.write users.read offline.access',
      );
      authorizeUrl.searchParams.set('state', state);
      authorizeUrl.searchParams.set('code_challenge', codeVerifier);
      authorizeUrl.searchParams.set('code_challenge_method', 'plain');
    } else if (normalizedPlatform === 'instagram') {
      authorizeUrl = new URL('https://api.instagram.com/oauth/authorize');
      authorizeUrl.searchParams.set('client_id', clientId);
      authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
      authorizeUrl.searchParams.set('response_type', 'code');
      authorizeUrl.searchParams.set(
        'scope',
        process.env.INSTAGRAM_OAUTH_SCOPE ?? 'instagram_business_basic,instagram_business_content_publish',
      );
      authorizeUrl.searchParams.set('state', state);
      authorizeUrl.searchParams.set('platform', normalizedPlatform);
    } else if (normalizedPlatform === 'linkedin') {
      authorizeUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
      authorizeUrl.searchParams.set('response_type', 'code');
      authorizeUrl.searchParams.set('client_id', clientId);
      authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
      authorizeUrl.searchParams.set(
        'scope',
        process.env.LINKEDIN_OAUTH_SCOPE ?? 'openid profile w_member_social',
      );
      authorizeUrl.searchParams.set('state', state);
      authorizeUrl.searchParams.set('platform', normalizedPlatform);
    } else {
      authorizeUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
      authorizeUrl.searchParams.set('client_id', clientId);
      authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
      authorizeUrl.searchParams.set('response_type', 'code');
      authorizeUrl.searchParams.set('scope', process.env.FACEBOOK_OAUTH_SCOPE ?? 'pages_manage_posts,pages_read_engagement');
      authorizeUrl.searchParams.set('state', state);
      authorizeUrl.searchParams.set('platform', normalizedPlatform);
    }

    this.oauthStates.set(state, oauthState);
    this.cleanupExpiredStates();

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

    const oauthState = this.oauthStates.get(params.state);

    if (!oauthState) {
      throw new BadRequestException('OAuth state is invalid or has expired');
    }

    this.oauthStates.delete(params.state);

    if (params.platform && this.normalizePlatform(params.platform) !== oauthState.platform) {
      throw new BadRequestException('OAuth platform mismatch');
    }

    const tokenPayload = await this.exchangeAuthorizationCode(
      oauthState.platform,
      params.code,
      oauthState.codeVerifier,
    );

    await this.platformsService.storeCredential(
      oauthState.userId,
      oauthState.platform,
      tokenPayload,
    );

    return {
      connected: true,
      platform: oauthState.platform,
    };
  }

  private async exchangeAuthorizationCode(
    platform: OAuthPlatform,
    code: string,
    codeVerifier?: string,
  ) {
    const callbackUrl = this.getCallbackUrl();
    const clientId = this.readOAuthEnv(platform, 'CLIENT_ID');
    const clientSecret = this.readOAuthEnv(platform, 'CLIENT_SECRET');

    if (platform === 'x') {
      if (!codeVerifier) {
        throw new BadRequestException('Missing PKCE code verifier for X OAuth flow');
      }

      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        client_id: clientId,
        code_verifier: codeVerifier,
      });

      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      const payload = await this.extractJson(response);
      return this.normalizeTokenResponse(payload);
    }

    if (platform === 'instagram') {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        client_id: clientId,
        client_secret: clientSecret,
      });

      const response = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      const payload = await this.extractJson(response);
      return this.normalizeTokenResponse(payload);
    }

    if (platform === 'linkedin') {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        client_id: clientId,
        client_secret: clientSecret,
      });

      const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      const payload = await this.extractJson(response);
      return this.normalizeTokenResponse(payload);
    }

    const url = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('client_secret', clientSecret);
    url.searchParams.set('redirect_uri', callbackUrl);
    url.searchParams.set('code', code);

    const response = await fetch(url, { method: 'GET' });
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

  private async extractJson(response: Response) {
    const payload = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      const message = this.readOptionalString(payload, ['error_description', 'error', 'message'])
        ?? 'OAuth token exchange failed';
      throw new BadRequestException(message);
    }

    return payload;
  }

  private cleanupExpiredStates() {
    const now = Date.now();
    for (const [state, data] of this.oauthStates.entries()) {
      if (now - data.createdAt > FIVE_MINUTES_MS) {
        this.oauthStates.delete(state);
      }
    }
  }

  private normalizePlatform(platform: string): OAuthPlatform {
    const normalizedPlatform = platform.toLowerCase();

    if (
      normalizedPlatform !== 'x'
      && normalizedPlatform !== 'instagram'
      && normalizedPlatform !== 'linkedin'
      && normalizedPlatform !== 'facebook'
    ) {
      throw new BadRequestException(`Unsupported platform: ${platform}`);
    }

    return normalizedPlatform;
  }

  private getCallbackUrl() {
    return process.env.OAUTH_CALLBACK_URL ?? 'http://localhost:3001/oauth/callback';
  }

  private readOAuthEnv(platform: OAuthPlatform, key: 'CLIENT_ID' | 'CLIENT_SECRET') {
    const envKey = `${platform.toUpperCase()}_${key}`;
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
