import { CircuitBreakerService, CircuitOpenError } from './circuit-breaker.service';

describe('CircuitBreakerService', () => {
  let breaker: CircuitBreakerService;

  beforeEach(() => {
    breaker = new CircuitBreakerService({
      failureThreshold: 3,
      cooldownMs: 100,
      halfOpenSuccessThreshold: 2,
    });
  });

  it('starts in closed state', () => {
    expect(breaker.getState('test')).toBe('closed');
  });

  it('passes through successful calls', async () => {
    const result = await breaker.execute('test', async () => 'success');
    expect(result).toBe('success');
    expect(breaker.getState('test')).toBe('closed');
  });

  it('opens after threshold consecutive failures', async () => {
    const fail = async () => {
      throw new Error('boom');
    };

    await expect(breaker.execute('test', fail)).rejects.toThrow('boom');
    await expect(breaker.execute('test', fail)).rejects.toThrow('boom');
    expect(breaker.getState('test')).toBe('closed');

    await expect(breaker.execute('test', fail)).rejects.toThrow('boom');
    expect(breaker.getState('test')).toBe('open');
  });

  it('rejects calls when circuit is open', async () => {
    const fail = async () => { throw new Error('boom'); };
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute('test', fail)).rejects.toThrow();
    }

    await expect(breaker.execute('test', async () => 'should not run')).rejects.toThrow(CircuitOpenError);
  });

  it('moves to half-open after cooldown', async () => {
    const fail = async () => { throw new Error('boom'); };
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute('test', fail)).rejects.toThrow();
    }
    expect(breaker.getState('test')).toBe('open');

    await new Promise((r) => setTimeout(r, 150));

    // Next call moves to half-open
    await breaker.execute('test', async () => 'ok');
    // Still half-open until threshold met
    expect(breaker.getState('test')).toBe('half-open');
  });

  it('closes circuit after enough half-open successes', async () => {
    const fail = async () => { throw new Error('boom'); };
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute('test', fail)).rejects.toThrow();
    }

    await new Promise((r) => setTimeout(r, 150));
    await breaker.execute('test', async () => 'ok');
    await breaker.execute('test', async () => 'ok');

    expect(breaker.getState('test')).toBe('closed');
  });

  it('isolates circuits per key', async () => {
    const fail = async () => { throw new Error('boom'); };

    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute('twitter', fail)).rejects.toThrow();
    }

    expect(breaker.getState('twitter')).toBe('open');
    expect(breaker.getState('linkedin')).toBe('closed');

    // LinkedIn calls still work
    await expect(breaker.execute('linkedin', async () => 'ok')).resolves.toBe('ok');
  });
});
