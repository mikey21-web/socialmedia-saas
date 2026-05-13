/**
 * Typed errors for platform publishing failures.
 * These let callers respond appropriately (retry, alert, halt) based on error type.
 */

export class PlatformError extends Error {
  constructor(
    public readonly platform: string,
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = 'PlatformError';
  }
}

export class PlatformRateLimitError extends PlatformError {
  constructor(platform: string, public readonly retryAfterSeconds: number) {
    super(
      platform,
      `${platform} rate limited, retry after ${retryAfterSeconds}s`,
      'RATE_LIMITED',
      true,
    );
    this.name = 'PlatformRateLimitError';
  }
}

export class PlatformAuthError extends PlatformError {
  constructor(platform: string, message: string = 'Authentication failed') {
    super(platform, `${platform}: ${message}`, 'AUTH_FAILED', false);
    this.name = 'PlatformAuthError';
  }
}

export class PlatformContentError extends PlatformError {
  constructor(platform: string, message: string) {
    super(platform, `${platform}: ${message}`, 'CONTENT_REJECTED', false);
    this.name = 'PlatformContentError';
  }
}

export class PlatformNetworkError extends PlatformError {
  constructor(platform: string, message: string) {
    super(platform, `${platform}: ${message}`, 'NETWORK_ERROR', true);
    this.name = 'PlatformNetworkError';
  }
}

export class PlatformServerError extends PlatformError {
  constructor(platform: string, statusCode: number, message: string) {
    super(platform, `${platform}: ${statusCode} ${message}`, 'SERVER_ERROR', true);
    this.name = 'PlatformServerError';
  }
}

/**
 * Categorize a fetch response into a typed PlatformError.
 */
export function classifyResponseError(
  platform: string,
  response: Response,
  body: unknown,
): PlatformError {
  const message = extractErrorMessage(body) ?? response.statusText;

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('retry-after') ?? '60', 10);
    return new PlatformRateLimitError(platform, retryAfter);
  }

  if (response.status === 401 || response.status === 403) {
    return new PlatformAuthError(platform, message);
  }

  if (response.status === 400 || response.status === 422) {
    return new PlatformContentError(platform, message);
  }

  if (response.status >= 500) {
    return new PlatformServerError(platform, response.status, message);
  }

  return new PlatformError(platform, message, 'UNKNOWN', false);
}

function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const obj = body as Record<string, unknown>;
  if (typeof obj.detail === 'string') return obj.detail;
  if (typeof obj.error === 'string') return obj.error;
  if (typeof obj.message === 'string') return obj.message;
  if (typeof obj.error_description === 'string') return obj.error_description;
  if (Array.isArray(obj.errors) && obj.errors.length > 0) {
    const first = obj.errors[0];
    if (typeof first === 'object' && first !== null && 'message' in first) {
      return String((first as Record<string, unknown>).message);
    }
  }
  return null;
}
