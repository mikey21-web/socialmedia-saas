import { GoogleOAuthStrategy } from './google-oauth.strategy';
import { PrismaService } from '../prisma/prisma.service';

describe('GoogleOAuthStrategy', () => {
  let strategy: GoogleOAuthStrategy;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
      team: { create: jest.fn() },
    } as unknown as jest.Mocked<PrismaService>;

    strategy = new GoogleOAuthStrategy(prisma);
  });

  it('returns existing user if email found', async () => {
    const mockUser = { id: 'u1', email: 'test@gmail.com', name: 'Test' };
    prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
    const done = jest.fn();

    await strategy.validate(
      'at',
      'rt',
      { emails: [{ value: 'test@gmail.com' }], displayName: 'Test' } as any,
      done,
    );

    expect(done).toHaveBeenCalledWith(null, mockUser);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('creates new user + team if email not found', async () => {
    const newUser = { id: 'u2', email: 'new@gmail.com', name: 'New User' };
    prisma.user.findUnique = jest.fn().mockResolvedValue(null);
    prisma.user.create = jest.fn().mockResolvedValue(newUser);
    prisma.team.create = jest.fn().mockResolvedValue({ id: 't1' });
    const done = jest.fn();

    await strategy.validate(
      'at',
      'rt',
      { emails: [{ value: 'new@gmail.com' }], displayName: 'New User' } as any,
      done,
    );

    expect(prisma.user.create).toHaveBeenCalled();
    expect(prisma.team.create).toHaveBeenCalled();
    expect(done).toHaveBeenCalledWith(null, newUser);
  });

  it('calls done with error if no email in profile', async () => {
    const done = jest.fn();

    await strategy.validate('at', 'rt', { emails: [] } as any, done);

    expect(done).toHaveBeenCalledWith(expect.any(Error), undefined);
  });
});
