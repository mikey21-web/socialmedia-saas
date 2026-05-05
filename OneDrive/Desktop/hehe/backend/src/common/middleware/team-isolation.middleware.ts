import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class TeamIsolationMiddleware implements NestMiddleware {
  use(_req: unknown, _res: unknown, next: () => void): void {
    next();
  }
}
