import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { createHash } from 'crypto';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const path = String(req.path ?? req.originalUrl ?? '');
    const teamId = req.body?.teamId ?? req.user?.team_id;
    if (path.includes('/subscriptions/checkout') && teamId) {
      return `team:${teamId}`;
    }

    const userId = req.user?.userId ?? req.user?.sub;
    if (userId) {
      return `user:${userId}`;
    }

    const authHeader = req.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader) {
      const digest = createHash('sha256').update(authHeader).digest('hex');
      return `auth:${digest}`;
    }

    return super.getTracker(req);
  }
}
