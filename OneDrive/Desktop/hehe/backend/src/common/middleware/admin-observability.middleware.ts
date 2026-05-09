import { NextFunction, Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { stableRolloutBucket } from '../../admin/admin-utils';

type AuthPayload = { sub?: string; team_id?: string; role?: string };

function getAuthPayload(req: Request): AuthPayload {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return {};
  try {
    const jwt = new JwtService();
    return jwt.decode(token) as AuthPayload;
  } catch {
    return {};
  }
}

export function createApiUsageMiddleware(prisma: PrismaService) {
  return (req: Request, res: Response, next: NextFunction) => {
    const started = Date.now();
    res.on('finish', () => {
      if (req.path.includes('/health')) return;
      const payload = getAuthPayload(req);
      void prisma.db.apiUsageLog
        .create({
          data: {
            teamId: payload.team_id ?? (typeof req.headers['x-team-id'] === 'string' ? req.headers['x-team-id'] : null),
            endpoint: req.route?.path ? `${req.baseUrl}${String(req.route.path)}` : req.path,
            method: req.method,
            statusCode: res.statusCode,
            responseTimeMs: Date.now() - started,
          },
        })
        .catch(() => undefined);
    });
    next();
  };
}

export function createAuditMiddleware(prisma: PrismaService) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!['POST', 'PATCH', 'DELETE'].includes(req.method) || req.path.includes('/admin/audit')) {
      next();
      return;
    }
    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      const payload = getAuthPayload(req);
      void prisma.auditLog
        .create({
          data: {
            teamId: payload.team_id ?? (typeof req.headers['x-team-id'] === 'string' ? req.headers['x-team-id'] : 'system'),
            userId: payload.sub ?? 'system',
            action: `${req.method.toLowerCase()} ${req.path}`,
            resource: req.path,
            entity: req.path.split('/').filter(Boolean).slice(-2)[0] ?? req.path,
            newValue: req.body && typeof req.body === 'object' ? req.body : undefined,
            ipAddress: req.ip,
          },
        })
        .catch(() => undefined);
    });
    next();
  };
}

export function createFeatureFlagMiddleware(prisma: PrismaService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const flagName = typeof req.headers['x-feature-flag'] === 'string' ? req.headers['x-feature-flag'] : undefined;
    if (!flagName) {
      next();
      return;
    }
    const payload = getAuthPayload(req);
    const teamId = payload.team_id ?? (typeof req.headers['x-team-id'] === 'string' ? req.headers['x-team-id'] : undefined);
    const flag = await prisma.db.featureFlag.findUnique({ where: { name: flagName } }).catch(() => null);
    if (!flag?.enabled) {
      res.status(403).json({ message: `Feature flag ${flagName} is disabled` });
      return;
    }
    const rollout = Number(flag.rolloutPercentage ?? 0);
    if (teamId && stableRolloutBucket(`${flag.name}:${teamId}`) >= rollout) {
      res.status(403).json({ message: `Feature flag ${flagName} is not enabled for this team` });
      return;
    }
    next();
  };
}
