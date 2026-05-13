import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly prisma: PrismaService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL: process.env.GOOGLE_OAUTH_CALLBACK_URL ?? 'http://localhost:3001/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('No email from Google'), undefined);
      return;
    }

    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: profile.displayName ?? email.split('@')[0],
          password: '',
        },
      });

      await this.prisma.team.create({
        data: {
          name: `${user.name ?? email.split('@')[0]}'s Workspace`,
          ownerId: user.id,
          members: { create: { userId: user.id, role: 'OWNER' } },
        },
      });
    }

    done(null, user);
  }
}

export { GoogleOAuthStrategy as GoogleOauthStrategy };
