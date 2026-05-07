import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt.guard';

describe('JwtAuthGuard', () => {
  const guard = new JwtAuthGuard();

  it('throws token expired message for expired token info', () => {
    expect(() =>
      guard.handleRequest(null, null, { name: 'TokenExpiredError', message: 'jwt expired' }),
    ).toThrow(new UnauthorizedException('Token expired'));
  });

  it('returns user when auth succeeds', () => {
    const user = { userId: 'u1' };
    expect(guard.handleRequest(null, user, {})).toBe(user);
  });
});
