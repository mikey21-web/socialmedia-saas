import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

/**
 * Enforces IP whitelist when one is configured for the team.
 * Used to lock admin/security-sensitive endpoints to known IPs.
 */
@Injectable()
export class IpWhitelistGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: { team_id: string } }>();
    const teamId = req.user?.team_id;
    if (!teamId) return true; // No team context, let downstream auth handle it

    const cacheKey = `ip-whitelist:${teamId}`;
    const whitelist = await this.cache.wrap(
      cacheKey,
      async () => {
        const entries = await this.prisma.ipWhitelist.findMany({
          where: { teamId },
          select: { ipAddress: true },
        });
        return entries.map((e) => e.ipAddress);
      },
      60,
    );

    // No whitelist configured = allow all
    if (whitelist.length === 0) return true;

    const clientIp = this.extractClientIp(req);
    if (!whitelist.includes(clientIp)) {
      throw new ForbiddenException('Your IP is not whitelisted for this account');
    }

    return true;
  }

  private extractClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip ?? req.socket?.remoteAddress ?? '';
  }
}
