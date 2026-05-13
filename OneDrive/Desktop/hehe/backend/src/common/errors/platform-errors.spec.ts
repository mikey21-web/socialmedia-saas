import {
  classifyResponseError,
  PlatformAuthError,
  PlatformContentError,
  PlatformRateLimitError,
  PlatformServerError,
  PlatformError,
} from './platform-errors';

function makeResponse(status: number, headers: Record<string, string> = {}): Response {
  return {
    status,
    statusText: `Status ${status}`,
    headers: {
      get: (k: string) => headers[k.toLowerCase()] ?? null,
    },
  } as unknown as Response;
}

describe('classifyResponseError', () => {
  it('returns PlatformRateLimitError for 429', () => {
    const err = classifyResponseError('twitter', makeResponse(429, { 'retry-after': '120' }), {});
    expect(err).toBeInstanceOf(PlatformRateLimitError);
    expect((err as PlatformRateLimitError).retryAfterSeconds).toBe(120);
    expect(err.retryable).toBe(true);
  });

  it('defaults retry-after to 60 when missing', () => {
    const err = classifyResponseError('x', makeResponse(429), {});
    expect(err).toBeInstanceOf(PlatformRateLimitError);
    expect((err as PlatformRateLimitError).retryAfterSeconds).toBe(60);
  });

  it('returns PlatformAuthError for 401', () => {
    const err = classifyResponseError('linkedin', makeResponse(401), { error: 'Invalid token' });
    expect(err).toBeInstanceOf(PlatformAuthError);
    expect(err.retryable).toBe(false);
    expect(err.message).toContain('Invalid token');
  });

  it('returns PlatformAuthError for 403', () => {
    const err = classifyResponseError('linkedin', makeResponse(403), {});
    expect(err).toBeInstanceOf(PlatformAuthError);
  });

  it('returns PlatformContentError for 400', () => {
    const err = classifyResponseError('instagram', makeResponse(400), { message: 'Caption too long' });
    expect(err).toBeInstanceOf(PlatformContentError);
    expect(err.retryable).toBe(false);
  });

  it('returns PlatformServerError for 500+', () => {
    const err = classifyResponseError('facebook', makeResponse(503), {});
    expect(err).toBeInstanceOf(PlatformServerError);
    expect(err.retryable).toBe(true);
  });

  it('extracts message from errors array', () => {
    const err = classifyResponseError(
      'twitter',
      makeResponse(400),
      { errors: [{ message: 'Tweet exceeds character limit' }] },
    );
    expect(err.message).toContain('Tweet exceeds character limit');
  });
});
