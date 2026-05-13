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
    update: jest.fn(),
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
  sign: jest.fn((payload: unknown, options?: { secret?: string }) =>
    options?.secret ? 'mock-refresh-token' : 'mock-token',
  ),
  verify: jest.fn(),
};

const mockEmail = {
  sendWelcomeEmail: jest.fn().mockResolvedValue({ sent: true }),
};

describe('AuthService', () => {
  let service: AuthService;
  const originalJwtExpiry = process.env.JWT_EXPIRY;
  const originalRefreshSecret = process.env.REFRESH_TOKEN_SECRET;
  const originalRefreshExpiry = process.env.REFRESH_TOKEN_EXPIRY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_EXPIRY = '24h';
    process.env.REFRESH_TOKEN_SECRET = 'refresh-secret';
    process.env.REFRESH_TOKEN_EXPIRY = '7d';
    mockPrisma.user.update.mockResolvedValue({});
    service = new AuthService(
      mockPrisma as unknown as PrismaService,
      mockJwt as unknown as JwtService,
      mockEmail as unknown as EmailService,
    );
  });

  afterAll(() => {
    process.env.JWT_EXPIRY = originalJwtExpiry;
    process.env.REFRESH_TOKEN_SECRET = originalRefreshSecret;
    process.env.REFRESH_TOKEN_EXPIRY = originalRefreshExpiry;
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
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { sub: 'u1', email: 'a@b.com', team_id: 't1', role: 'user' },
        { expiresIn: '24h' },
      );
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

    it('uses configured JWT expiry', async () => {
      process.env.JWT_EXPIRY = '1h';
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.com', name: 'Bob' });
      mockPrisma.team.create.mockResolvedValue({ id: 't1', name: "Bob's Team" });

      await service.signup('a@b.com', 'password123', 'Bob');

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { sub: 'u1', email: 'a@b.com', team_id: 't1', role: 'user' },
        { expiresIn: '1h' },
      );
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
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user.email).toBe('a@b.com');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { sub: 'u1', email: 'a@b.com', team_id: 't1', role: 'user' },
        { expiresIn: '24h' },
      );
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

  // ── google oauth ─────────────────────────────────────────────────────────────

  describe('googleAuth', () => {
    it('creates user + team and returns token when email does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.user.create.mockResolvedValue({
        id: 'u2',
        email: 'google@user.com',
        name: 'Google User',
      });
      mockPrisma.team.create.mockResolvedValue({ id: 't2', name: "Google User's Team" });

      const result = await service.googleAuth({
        email: 'google@user.com',
        name: 'Google User',
        picture: 'https://example.com/pic.png',
      });

      expect(result.token).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user.email).toBe('google@user.com');
      expect(result.user.picture).toBe('https://example.com/pic.png');
      expect(mockEmail.sendWelcomeEmail).toHaveBeenCalledWith(
        'google@user.com',
        "Google User's Team",
      );
    });

    it('returns existing user token when user and team membership already exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-existing',
        email: 'existing@user.com',
        name: 'Existing',
      });
      mockPrisma.teamMember.findFirst.mockResolvedValue({ team: { id: 't-existing' } });

      const result = await service.googleAuth({
        email: 'existing@user.com',
        name: 'Existing',
        picture: null,
      });

      expect(result.team_id).toBe('t-existing');
      expect(result.user.email).toBe('existing@user.com');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('verifyGoogleIdToken', () => {
    const originalClientId = process.env.GOOGLE_CLIENT_ID;

    afterEach(() => {
      process.env.GOOGLE_CLIENT_ID = originalClientId;
    });

    it('validates token and signs in the Google user', async () => {
      process.env.GOOGLE_CLIENT_ID = 'google-client';
      jest.spyOn(service, 'googleAuth').mockResolvedValue({
        user: { id: 'u3', email: 'verified@user.com', name: 'Verified', picture: null },
        team_id: 't3',
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      });

      const verifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => ({
          email: 'verified@user.com',
          name: 'Verified',
          picture: null,
        }),
      });
      (
        service as unknown as { googleClient: { verifyIdToken: typeof verifyIdToken } }
      ).googleClient.verifyIdToken = verifyIdToken;

      const result = await service.verifyGoogleIdToken('valid-google-token');

      expect(result.token).toBe('mock-token');
      expect(verifyIdToken).toHaveBeenCalledWith({
        idToken: 'valid-google-token',
        audience: 'google-client',
      });
    });

    it('throws for invalid google token', async () => {
      process.env.GOOGLE_CLIENT_ID = 'google-client';
      const verifyIdToken = jest.fn().mockRejectedValue(new Error('invalid'));
      (
        service as unknown as { googleClient: { verifyIdToken: typeof verifyIdToken } }
      ).googleClient.verifyIdToken = verifyIdToken;

      await expect(service.verifyGoogleIdToken('bad-token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshAccessToken', () => {
    it('returns new tokens for valid refresh token', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'u1', email: 'a@b.com', team_id: 't1' });
      const hashedRefresh = await bcrypt.hash('valid-refresh-token', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        name: 'Alice',
        refreshTokenHash: hashedRefresh,
      });
      mockPrisma.teamMember.findFirst.mockResolvedValue({ team: { id: 't1' } });

      const result = await service.refreshAccessToken('valid-refresh-token');

      expect(result.token).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('throws when refresh token is invalid', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refreshAccessToken('bad-token')).rejects.toThrow(BadRequestException);
    });
  });
});
