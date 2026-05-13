import { Module, Global } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker/circuit-breaker.service';

@Global()
@Module({
  providers: [
    {
      provide: CircuitBreakerService,
      useFactory: () =>
        new CircuitBreakerService({
          failureThreshold: 5,
          cooldownMs: 60_000,
          halfOpenSuccessThreshold: 2,
        }),
    },
  ],
  exports: [CircuitBreakerService],
})
export class CommonModule {}
