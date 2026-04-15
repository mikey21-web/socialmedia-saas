export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

export interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts || 3;
  const delayMs = options.delayMs || 100;
  const backoffMultiplier = options.backoffMultiplier || 2;

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError || new Error('Max retries exceeded');
}

export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

export async function withCircuitBreaker<T>(
  key: string,
  fn: () => Promise<T>,
  failureThreshold: number = 5,
  resetTimeMs: number = 60000
): Promise<T> {
  let state = circuitBreakers.get(key) || { failures: 0, lastFailureTime: 0, state: 'closed' };

  if (state.state === 'open') {
    if (Date.now() - state.lastFailureTime > resetTimeMs) {
      state.state = 'half-open';
    } else {
      throw new Error(`Circuit breaker OPEN for ${key}`);
    }
  }

  try {
    const result = await fn();
    state = { failures: 0, lastFailureTime: 0, state: 'closed' };
    circuitBreakers.set(key, state);
    return result;
  } catch (error) {
    state.failures++;
    state.lastFailureTime = Date.now();
    if (state.failures >= failureThreshold) {
      state.state = 'open';
    }
    circuitBreakers.set(key, state);
    throw error;
  }
}
