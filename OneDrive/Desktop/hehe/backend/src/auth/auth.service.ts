import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
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

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          email,
          name: name ?? null,
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

    const token = this.jwtService.sign({
      sub: result.user.id,
      email: result.user.email,
      team_id: result.team.id,
    });

    await this.emailService.sendWelcomeEmail(result.user.email, result.team.name);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      team_id: result.team.id,
      token,
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

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      team_id: membership.team.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      team_id: membership.team.id,
      token,
    };
  }
}
