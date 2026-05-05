import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  team: {
    create: jest.fn(),
  },
  teamMember: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-token'),
};

const mockEmail = {
  sendWelcomeEmail: jest.fn().mockResolvedValue({ sent: true }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      mockPrisma as unknown as PrismaService,
      mockJwt as unknown as JwtService,
      mockEmail as unknown as EmailService,
    );
  });

  // ── signup ──────────────────────────────────────────────────────────────────

  describe('signup', () => {
    it('creates user + team and returns token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const fakeUser = { id: 'u1', email: 'a@b.com', name: 'Alice' };
      const fakeTeam = { id: 't1', name: "Alice's Team" };
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.user.create.mockResolvedValue(fakeUser);
      mockPrisma.team.create.mockResolvedValue(fakeTeam);

      const result = await service.signup('a@b.com', 'password123', 'Alice');

      expect(result.token).toBe('mock-token');
      expect(result.user.email).toBe('a@b.com');
      expect(result.user.name).toBe('Alice');
      expect(result.team_id).toBe('t1');
      expect(mockEmail.sendWelcomeEmail).toHaveBeenCalledWith('a@b.com', "Alice's Team");
    });

    it('throws when email already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com' });

      await expect(service.signup('a@b.com', 'password123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('hashes the password before storing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const fakeUser = { id: 'u1', email: 'a@b.com', name: null };
      const fakeTeam = { id: 't1', name: "a@b.com's Team" };
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.user.create.mockResolvedValue(fakeUser);
      mockPrisma.team.create.mockResolvedValue(fakeTeam);

      await service.signup('a@b.com', 'plaintext');

      const createCall = mockPrisma.user.create.mock.calls[0][0] as { data: { password: string } };
      const stored = createCall.data.password;
      const matches = await bcrypt.compare('plaintext', stored);
      expect(matches).toBe(true);
    });

    it('uses name in team name when provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const fakeUser = { id: 'u1', email: 'a@b.com', name: 'Bob' };
      const fakeTeam = { id: 't1', name: "Bob's Team" };
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.user.create.mockResolvedValue(fakeUser);
      mockPrisma.team.create.mockResolvedValue(fakeTeam);

      await service.signup('a@b.com', 'password123', 'Bob');

      const teamCall = mockPrisma.team.create.mock.calls[0][0] as { data: { name: string } };
      expect(teamCall.data.name).toBe("Bob's Team");
    });
  });

  // ── signin ──────────────────────────────────────────────────────────────────

  describe('signin', () => {
    it('returns token for valid credentials', async () => {
      const hash = await bcrypt.hash('correctpass', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        password: hash,
      });
      mockPrisma.teamMember.findFirst.mockResolvedValue({
        team: { id: 't1' },
      });

      const result = await service.signin('a@b.com', 'correctpass');
      expect(result.token).toBe('mock-token');
      expect(result.user.email).toBe('a@b.com');
    });

    it('throws for unknown email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.signin('nobody@b.com', 'pass')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws for wrong password', async () => {
      const hash = await bcrypt.hash('correctpass', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        password: hash,
      });

      await expect(service.signin('a@b.com', 'wrongpass')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws when user has no team', async () => {
      const hash = await bcrypt.hash('correctpass', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        password: hash,
      });
      mockPrisma.teamMember.findFirst.mockResolvedValue(null);

      await expect(service.signin('a@b.com', 'correctpass')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
