import { Injectable, Logger, Optional } from '@nestjs/common';
import { CircuitBreakerService, CircuitOpenError } from '../common/circuit-breaker/circuit-breaker.service';
import { PlatformError, classifyResponseError } from '../common/errors/platform-errors';
import { retryWithBackoff } from '../common/retry/retry-with-backoff';

export interface PublishAttemptResult<T> {
  success: boolean;
  result?: T;
  error?: PlatformError;
  attempts: number;
  durationMs: number;
}

/**
 * Wraps platform publish operations with retry, circuit breaker, and typed errors.
 * Each platform gets its own circuit so a Twitter outage doesn't block LinkedIn.
 */
@Injectable()
export class ResilientPublisherService {
  private readonly logger = new Logger(ResilientPublisherService.name);

  constructor(
    @Optional() private readonly circuitBreaker?: CircuitBreakerService,
  ) {}

  async publish<T>(
    platform: string,
    operation: () => Promise<T>,
    options: { teamId?: string; postId?: string; maxAttempts?: number } = {},
  ): Promise<PublishAttemptResult<T>> {
    const start = Date.now();
    const circuitKey = `publish:${platform}`;
    let attempts = 0;

    const wrappedOperation = async (): Promise<T> => {
      attempts++;
      return operation();
    };

    const executor = this.circuitBreaker
      ? () => this.circuitBreaker!.execute(circuitKey, wrappedOperation)
      : wrappedOperation;

    try {
      const result = await retryWithBackoff(executor, {
        maxAttempts: options.maxAttempts ?? 3,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        onRetry: (err, attempt, delayMs) => {
          this.logger.warn(
            `Retrying ${platform} publish (attempt ${attempt + 1}/${options.maxAttempts ?? 3}) after ${delayMs}ms`,
            { teamId: options.teamId, postId: options.postId, error: (err as Error)?.message },
          );
        },
      });

      return {
        success: true,
        result,
        attempts,
        durationMs: Date.now() - start,
      };
    } catch (error) {
      const platformError = this.normalizeError(platform, error);
      this.logger.error(`Publish to ${platform} failed after ${attempts} attempts: ${platformError.message}`, {
        teamId: options.teamId,
        postId: options.postId,
        code: platformError.code,
      });
      return {
        success: false,
        error: platformError,
        attempts,
        durationMs: Date.now() - start,
      };
    }
  }

  /**
   * Helper to wrap a fetch call and classify the response into a typed error.
   */
  async fetchWithClassification(
    platform: string,
    url: string,
    init: RequestInit,
  ): Promise<Record<string, unknown>> {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(30000),
    });

    const text = await response.text();
    let body: unknown = {};
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }
    }

    if (!response.ok) {
      throw classifyResponseError(platform, response, body);
    }

    return body as Record<string, unknown>;
  }

  private normalizeError(platform: string, error: unknown): PlatformError {
    if (error instanceof PlatformError) return error;
    if (error instanceof CircuitOpenError) {
      return new PlatformError(
        platform,
        `${platform} is temporarily unavailable (circuit open)`,
        'CIRCUIT_OPEN',
        false,
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    return new PlatformError(platform, message, 'UNKNOWN', false);
  }
}
