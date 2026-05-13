import { retryWithBackoff } from './retry-with-backoff';
import {
  PlatformAuthError,
  PlatformContentError,
  PlatformRateLimitError,
  PlatformServerError,
} from '../errors/platform-errors';

describe('retryWithBackoff', () => {
  it('returns result on first success', async () => {
    const op = jest.fn().mockResolvedValue('ok');
    const result = await retryWithBackoff(op, { maxAttempts: 3 });
    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('retries retryable errors and eventually succeeds', async () => {
    const op = jest
      .fn()
      .mockRejectedValueOnce(new PlatformServerError('twitter', 503, 'down'))
      .mockResolvedValueOnce('ok');

    const result = await retryWithBackoff(op, {
      maxAttempts: 3,
      initialDelayMs: 1,
      jitter: false,
    });

    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-retryable errors', async () => {
    const op = jest.fn().mockRejectedValue(new PlatformAuthError('twitter'));
    await expect(retryWithBackoff(op, { maxAttempts: 3 })).rejects.toBeInstanceOf(PlatformAuthError);
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('does not retry content errors', async () => {
    const op = jest.fn().mockRejectedValue(new PlatformContentError('twitter', 'Caption too long'));
    await expect(retryWithBackoff(op, { maxAttempts: 3 })).rejects.toBeInstanceOf(PlatformContentError);
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('throws after max attempts', async () => {
    const op = jest.fn().mockRejectedValue(new PlatformServerError('twitter', 500, 'fail'));
    await expect(
      retryWithBackoff(op, { maxAttempts: 3, initialDelayMs: 1, jitter: false }),
    ).rejects.toBeInstanceOf(PlatformServerError);
    expect(op).toHaveBeenCalledTimes(3);
  });

  it('honors PlatformRateLimitError retry-after', async () => {
    const op = jest
      .fn()
      .mockRejectedValueOnce(new PlatformRateLimitError('twitter', 0))
      .mockResolvedValueOnce('ok');

    const start = Date.now();
    const result = await retryWithBackoff(op, { maxAttempts: 2, initialDelayMs: 1000, jitter: false });
    const elapsed = Date.now() - start;

    expect(result).toBe('ok');
    expect(elapsed).toBeLessThan(500); // honored 0s retry-after instead of 1000ms backoff
  });

  it('calls onRetry callback', async () => {
    const onRetry = jest.fn();
    const op = jest
      .fn()
      .mockRejectedValueOnce(new PlatformServerError('twitter', 500, 'fail'))
      .mockResolvedValueOnce('ok');

    await retryWithBackoff(op, {
      maxAttempts: 3,
      initialDelayMs: 1,
      jitter: false,
      onRetry,
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
