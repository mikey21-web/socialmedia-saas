import { Logger } from '@nestjs/common';
import { PlatformError } from '../errors/platform-errors';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

const DEFAULTS: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry'>> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
};

const logger = new Logger('RetryWithBackoff');

/**
 * Retry an async operation with exponential backoff and jitter.
 *
 * - Honors PlatformRateLimitError.retryAfterSeconds when present
 * - Honors PlatformError.retryable to skip non-retryable errors
 * - Adds full jitter (random 0-delay) to prevent thundering herd
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULTS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const shouldRetry = opts.shouldRetry
        ? opts.shouldRetry(error, attempt)
        : defaultShouldRetry(error);

      if (!shouldRetry || attempt === opts.maxAttempts) {
        throw error;
      }

      const delayMs = computeDelay(error, attempt, opts);
      opts.onRetry?.(error, attempt, delayMs);
      logger.warn(`Retry ${attempt}/${opts.maxAttempts} after ${delayMs}ms: ${(error as Error)?.message}`);

      await sleep(delayMs);
    }
  }

  throw lastError;
}

function defaultShouldRetry(error: unknown): boolean {
  if (error instanceof PlatformError) {
    return error.retryable;
  }
  // Network errors (TypeError from fetch, AbortError) are retryable
  if (error instanceof TypeError) return true;
  if ((error as { name?: string })?.name === 'AbortError') return true;
  if ((error as { code?: string })?.code === 'ECONNRESET') return true;
  if ((error as { code?: string })?.code === 'ETIMEDOUT') return true;
  return false;
}

function computeDelay(error: unknown, attempt: number, opts: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry'>>): number {
  // Honor rate-limit retry-after
  if (error instanceof PlatformError && 'retryAfterSeconds' in error) {
    const retryAfter = (error as { retryAfterSeconds: number }).retryAfterSeconds;
    return Math.min(retryAfter * 1000, opts.maxDelayMs);
  }

  const exponential = Math.min(
    opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1),
    opts.maxDelayMs,
  );

  if (opts.jitter) {
    return Math.floor(Math.random() * exponential);
  }
  return exponential;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
