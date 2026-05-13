import { Injectable, Logger } from '@nestjs/common';

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitMetrics {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureAt: number;
  openedAt: number;
}

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening the circuit */
  failureThreshold?: number;
  /** Time in ms before attempting half-open state */
  cooldownMs?: number;
  /** Number of successes needed in half-open to close again */
  halfOpenSuccessThreshold?: number;
}

const DEFAULTS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  cooldownMs: 60_000, // 1 minute
  halfOpenSuccessThreshold: 2,
};

/**
 * Per-circuit (e.g. per-platform) breaker.
 * When 5 consecutive failures happen, circuit opens and rejects calls for 60s.
 * After cooldown, allows 1 trial. If it succeeds, circuit closes again.
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitMetrics>();
  private readonly options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = { ...DEFAULTS, ...options };
  }

  async execute<T>(circuitKey: string, operation: () => Promise<T>): Promise<T> {
    const circuit = this.getOrCreate(circuitKey);

    if (circuit.state === 'open') {
      if (Date.now() - circuit.openedAt < this.options.cooldownMs) {
        throw new CircuitOpenError(circuitKey, this.options.cooldownMs - (Date.now() - circuit.openedAt));
      }
      // Cooldown elapsed — try half-open
      circuit.state = 'half-open';
      circuit.successes = 0;
      this.logger.log(`Circuit ${circuitKey} entering half-open state`);
    }

    try {
      const result = await operation();
      this.recordSuccess(circuitKey);
      return result;
    } catch (err) {
      this.recordFailure(circuitKey);
      throw err;
    }
  }

  getState(circuitKey: string): CircuitState {
    return this.circuits.get(circuitKey)?.state ?? 'closed';
  }

  getMetrics(circuitKey: string): CircuitMetrics | null {
    return this.circuits.get(circuitKey) ?? null;
  }

  reset(circuitKey: string): void {
    this.circuits.delete(circuitKey);
  }

  getAllStates(): Record<string, CircuitState> {
    const result: Record<string, CircuitState> = {};
    for (const [key, metrics] of this.circuits.entries()) {
      result[key] = metrics.state;
    }
    return result;
  }

  private getOrCreate(circuitKey: string): CircuitMetrics {
    let circuit = this.circuits.get(circuitKey);
    if (!circuit) {
      circuit = {
        state: 'closed',
        failures: 0,
        successes: 0,
        lastFailureAt: 0,
        openedAt: 0,
      };
      this.circuits.set(circuitKey, circuit);
    }
    return circuit;
  }

  private recordSuccess(circuitKey: string): void {
    const circuit = this.getOrCreate(circuitKey);
    circuit.successes++;

    if (circuit.state === 'half-open') {
      if (circuit.successes >= this.options.halfOpenSuccessThreshold) {
        circuit.state = 'closed';
        circuit.failures = 0;
        this.logger.log(`Circuit ${circuitKey} closed after ${circuit.successes} successes`);
      }
    } else if (circuit.state === 'closed') {
      circuit.failures = 0;
    }
  }

  private recordFailure(circuitKey: string): void {
    const circuit = this.getOrCreate(circuitKey);
    circuit.failures++;
    circuit.lastFailureAt = Date.now();

    if (circuit.state === 'half-open') {
      circuit.state = 'open';
      circuit.openedAt = Date.now();
      this.logger.warn(`Circuit ${circuitKey} re-opened after half-open failure`);
    } else if (circuit.failures >= this.options.failureThreshold) {
      circuit.state = 'open';
      circuit.openedAt = Date.now();
      this.logger.warn(`Circuit ${circuitKey} opened after ${circuit.failures} failures`);
    }
  }
}

export class CircuitOpenError extends Error {
  readonly code = 'CIRCUIT_OPEN';

  constructor(
    public readonly circuitKey: string,
    public readonly cooldownRemainingMs: number,
  ) {
    super(`Circuit ${circuitKey} is open. Retry in ${Math.ceil(cooldownRemainingMs / 1000)}s`);
    this.name = 'CircuitOpenError';
  }
}
