import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'crypto';
import type { StringValue } from 'ms';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

type TeamRecord = {
  id: string;
  name: string;
};

export type GoogleAuthProfile = {
  email: string;
  name: string | null;
  picture: string | null;
};

type AuthPayload = {
  user: {
    id: string;
    email: string;
    name: string | null;
    picture?: string | null;
  };
  team_id: string;
  token: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async signup(email: string, password: string, name?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await this.createUserWithTeam(email, name ?? null, passwordHash);
    const tokens = await this.issueTokens(result.user.id, result.user.email, result.team.id);

    await this.emailService.sendWelcomeEmail(result.user.email, result.team.name);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      team_id: result.team.id,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
    };
  }

  async signin(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
    const isPasswordValid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

    if (!user || !isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const membership = await this.prisma.teamMember.findFirst({
      where: { userId: user.id },
      include: { team: true },
      orderBy: { id: 'asc' },
    });

    if (!membership) {
      throw new BadRequestException('No team found');
    }

    const tokens = await this.issueTokens(user.id, user.email, membership.team.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? null,
      },
      team_id: membership.team.id,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
    };
  }

  async googleAuth(profile: GoogleAuthProfile) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!existingUser) {
      const generatedPassword = randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(generatedPassword, 10);
      const created = await this.createUserWithTeam(profile.email, profile.name, passwordHash);
      const tokens = await this.issueTokens(created.user.id, created.user.email, created.team.id);
      await this.emailService.sendWelcomeEmail(created.user.email, created.team.name);

      return {
        user: {
          id: created.user.id,
          email: created.user.email,
          name: created.user.name,
          picture: profile.picture,
        },
        team_id: created.team.id,
        token: tokens.token,
        refreshToken: tokens.refreshToken,
      };
    }

    const team = await this.ensureUserTeam(existingUser.id, existingUser.email, existingUser.name);
    const tokens = await this.issueTokens(existingUser.id, existingUser.email, team.id);

    return {
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        picture: profile.picture,
      },
      team_id: team.id,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
    };
  }

  async verifyGoogleIdToken(idToken: string) {
    const audience = process.env.GOOGLE_CLIENT_ID;
    if (!audience) {
      throw new BadRequestException('GOOGLE_CLIENT_ID is not configured');
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience,
      });
      const payload = ticket.getPayload();
      const email = payload?.email;

      if (!email) {
        throw new BadRequestException('Google account email is required');
      }

      return this.googleAuth({
        email,
        name: payload?.name ?? null,
        picture: payload?.picture ?? null,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid Google token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthPayload> {
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!refreshSecret) {
      throw new BadRequestException('REFRESH_TOKEN_SECRET is not configured');
    }

    let payload: { sub: string; email: string; team_id: string };
    try {
      payload = this.jwtService.verify(refreshToken, { secret: refreshSecret }) as {
        sub: string;
        email: string;
        team_id: string;
      };
    } catch {
      throw new BadRequestException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, refreshTokenHash: true },
    });

    if (!user?.refreshTokenHash) {
      throw new BadRequestException('Invalid refresh token');
    }

    const isValidRefreshToken = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValidRefreshToken) {
      throw new BadRequestException('Invalid refresh token');
    }

    const team = await this.ensureUserTeam(user.id, user.email, user.name);
    const tokens = await this.issueTokens(user.id, user.email, team.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      team_id: team.id,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
    };
  }

  private signToken(userId: string, email: string, teamId: string, role = 'user') {
    return this.jwtService.sign(
      {
        sub: userId,
        email,
        team_id: teamId,
        role,
      },
      {
        expiresIn: (process.env.JWT_EXPIRY ?? '24h') as StringValue,
      },
    );
  }

  private signRefreshToken(userId: string, email: string, teamId: string) {
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!refreshSecret) {
      throw new BadRequestException('REFRESH_TOKEN_SECRET is not configured');
    }

    return this.jwtService.sign(
      {
        sub: userId,
        email,
        team_id: teamId,
      },
      {
        secret: refreshSecret,
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRY ?? '7d') as StringValue,
      },
    );
  }

  private async issueTokens(userId: string, email: string, teamId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const role = user?.role ?? 'user';

    const token = this.signToken(userId, email, teamId, role);
    const refreshToken = this.signRefreshToken(userId, email, teamId);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });

    return { token, refreshToken };
  }

  private async createUserWithTeam(email: string, name: string | null, passwordHash: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: passwordHash,
        },
      });

      const teamName = name ? `${name}'s Team` : `${email}'s Team`;
      const team = await tx.team.create({
        data: {
          name: teamName,
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: 'admin',
            },
          },
        },
      });

      return { user, team };
    });
  }

  private async ensureUserTeam(userId: string, email: string, name: string | null): Promise<TeamRecord> {
    const membership = await this.prisma.teamMember.findFirst({
      where: { userId },
      include: { team: true },
      orderBy: { id: 'asc' },
    });

    if (membership) {
      return membership.team;
    }

    const teamName = name ? `${name}'s Team` : `${email}'s Team`;
    const team = await this.prisma.team.create({
      data: {
        name: teamName,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'admin',
          },
        },
      },
    });

    return team;
  }
}
