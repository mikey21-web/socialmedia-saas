import { CircuitBreakerService } from '../common/circuit-breaker/circuit-breaker.service';
import { PlatformAuthError, PlatformServerError } from '../common/errors/platform-errors';
import { ResilientPublisherService } from './resilient-publisher.service';

describe('ResilientPublisherService', () => {
  let service: ResilientPublisherService;

  beforeEach(() => {
    service = new ResilientPublisherService(
      new CircuitBreakerService({ failureThreshold: 3, cooldownMs: 100, halfOpenSuccessThreshold: 1 }),
    );
  });

  it('returns success on first attempt', async () => {
    const op = jest.fn().mockResolvedValue({ id: 'abc' });
    const result = await service.publish('twitter', op);
    expect(result.success).toBe(true);
    expect(result.result).toEqual({ id: 'abc' });
    expect(result.attempts).toBe(1);
  });

  it('retries on retryable errors', async () => {
    const op = jest
      .fn()
      .mockRejectedValueOnce(new PlatformServerError('twitter', 503, 'down'))
      .mockResolvedValueOnce({ id: 'abc' });

    const result = await service.publish('twitter', op, { maxAttempts: 3 });
    expect(result.success).toBe(true);
    expect(result.attempts).toBe(2);
  });

  it('does not retry on auth errors', async () => {
    const op = jest.fn().mockRejectedValue(new PlatformAuthError('twitter'));
    const result = await service.publish('twitter', op, { maxAttempts: 3 });
    expect(result.success).toBe(false);
    expect(result.attempts).toBe(1);
    expect(result.error?.code).toBe('AUTH_FAILED');
  });

  it('returns CIRCUIT_OPEN after threshold breaches', async () => {
    const op = jest.fn().mockRejectedValue(new PlatformServerError('twitter', 500, 'down'));

    // Burn through failures
    await service.publish('twitter', op, { maxAttempts: 1 });
    await service.publish('twitter', op, { maxAttempts: 1 });
    await service.publish('twitter', op, { maxAttempts: 1 });

    // Now circuit is open
    const blockedOp = jest.fn().mockResolvedValue({ id: 'should-not-run' });
    const result = await service.publish('twitter', blockedOp, { maxAttempts: 1 });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('CIRCUIT_OPEN');
    expect(blockedOp).not.toHaveBeenCalled();
  });

  it('isolates circuits per platform', async () => {
    const failOp = jest.fn().mockRejectedValue(new PlatformServerError('twitter', 500, 'down'));
    await service.publish('twitter', failOp, { maxAttempts: 1 });
    await service.publish('twitter', failOp, { maxAttempts: 1 });
    await service.publish('twitter', failOp, { maxAttempts: 1 });

    // LinkedIn should still work
    const okOp = jest.fn().mockResolvedValue({ id: 'li-1' });
    const result = await service.publish('linkedin', okOp);
    expect(result.success).toBe(true);
  });
});
