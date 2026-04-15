import { withRetry, withTimeout, withCircuitBreaker } from '@/lib/agents/retry-executor';

describe('Retry Executor', () => {
  it('should retry on failure and eventually succeed', async () => {
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts++;
      if (attempts < 3) throw new Error('Fail');
      return 'success';
    });
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should throw after max retries exceeded', async () => {
    let attempts = 0;
    await expect(
      withRetry(async () => {
        attempts++;
        throw new Error('Always fails');
      }, { maxAttempts: 2 })
    ).rejects.toThrow('Always fails');
    expect(attempts).toBe(2);
  });

  it('should timeout after specified duration', async () => {
    await expect(
      withTimeout(
        () => new Promise(r => setTimeout(r, 100000)),
        100
      )
    ).rejects.toThrow('Timeout');
  });

  it('should succeed within timeout', async () => {
    const result = await withTimeout(
      () => Promise.resolve('ok'),
      1000
    );
    expect(result).toBe('ok');
  });

  it('should open circuit breaker after failures', async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      throw new Error('Fail');
    };

    for (let i = 0; i < 5; i++) {
      try {
        await withCircuitBreaker('test-key', fn, 3, 1000);
      } catch (e) {
        // expected
      }
    }

    // Circuit should now be open
    await expect(
      withCircuitBreaker('test-key', fn, 3, 1000)
    ).rejects.toThrow('Circuit breaker OPEN');
  });
});
