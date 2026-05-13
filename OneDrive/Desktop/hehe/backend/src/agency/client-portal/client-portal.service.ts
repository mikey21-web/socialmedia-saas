import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateClientPortalDto {
  clientName: string;
  clientEmail?: string;
  clientLogo?: string;
  brandColor?: string;
  permissions?: {
    viewPosts?: boolean;
    approvePosts?: boolean;
    viewAnalytics?: boolean;
  };
}

export interface BulkOnboardClientDto {
  websiteUrl: string;
  clientName: string;
  clientEmail?: string;
  socialHandles?: Record<string, string>;
}

@Injectable()
export class ClientPortalService {
  private readonly logger = new Logger(ClientPortalService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createClientPortal(agencyTeamId: string, dto: CreateClientPortalDto) {
    // Create a new team for the client
    const clientTeam = await this.prisma.team.create({
      data: {
        name: dto.clientName,
        ownerId: agencyTeamId, // agency owns the client team
      },
    });

    const accessToken = this.generateAccessToken();

    const portal = await this.prisma.clientPortal.create({
      data: {
        agencyTeamId,
        clientTeamId: clientTeam.id,
        clientName: dto.clientName,
        clientEmail: dto.clientEmail,
        clientLogo: dto.clientLogo,
        brandColor: dto.brandColor ?? '#2563eb',
        accessToken,
        permissions: (dto.permissions ?? {
          viewPosts: true,
          approvePosts: true,
          viewAnalytics: true,
        }) as any,
      },
    });

    return {
      id: portal.id,
      clientTeamId: clientTeam.id,
      accessToken,
      previewLink: this.buildPreviewLink(accessToken),
    };
  }

  async listClientPortals(agencyTeamId: string) {
    const portals = await this.prisma.clientPortal.findMany({
      where: { agencyTeamId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return portals.map(p => ({
      id: p.id,
      clientName: p.clientName,
      clientEmail: p.clientEmail,
      clientTeamId: p.clientTeamId,
      brandColor: p.brandColor,
      previewLink: this.buildPreviewLink(p.accessToken),
      lastAccessedAt: p.lastAccessedAt,
      createdAt: p.createdAt,
    }));
  }

  async getClientView(accessToken: string) {
    const portal = await this.prisma.clientPortal.findUnique({
      where: { accessToken },
    });

    if (!portal || !portal.isActive) {
      throw new NotFoundException('Portal not found or inactive');
    }

    // Update last accessed
    await this.prisma.clientPortal.update({
      where: { id: portal.id },
      data: { lastAccessedAt: new Date() },
    });

    const permissions = portal.permissions as Record<string, boolean>;
    const result: Record<string, unknown> = {
      clientName: portal.clientName,
      brandColor: portal.brandColor,
      clientLogo: portal.clientLogo,
      permissions,
    };

    if (permissions.viewPosts) {
      const posts = await this.prisma.post.findMany({
        where: { teamId: portal.clientTeamId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          content: true,
          status: true,
          scheduledAt: true,
          mediaUrls: true,
          platforms: { select: { platform: true, status: true } },
          createdAt: true,
        },
      });
      result.posts = posts;
    }

    if (permissions.viewAnalytics) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const analytics = await this.prisma.analyticsEvent.findMany({
        where: {
          post: { teamId: portal.clientTeamId },
          collectedAt: { gte: thirtyDaysAgo },
        },
        select: { eventType: true, count: true, collectedAt: true },
      });

      let totalImpressions = 0;
      let totalEngagements = 0;
      for (const event of analytics) {
        if (event.eventType.includes('impression')) totalImpressions += event.count;
        if (event.eventType.includes('engagement') || event.eventType.includes('like') || event.eventType.includes('comment')) {
          totalEngagements += event.count;
        }
      }

      result.analytics = { totalImpressions, totalEngagements, period: '30d' };
    }

    return result;
  }

  async clientApprovePost(accessToken: string, postId: string) {
    const portal = await this.prisma.clientPortal.findUnique({
      where: { accessToken },
    });

    if (!portal || !portal.isActive) {
      throw new NotFoundException('Portal not found');
    }

    const permissions = portal.permissions as Record<string, boolean>;
    if (!permissions.approvePosts) {
      throw new ForbiddenException('Approval permission not granted');
    }

    const post = await this.prisma.post.findFirst({
      where: { id: postId, teamId: portal.clientTeamId, deletedAt: null },
    });

    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.post.update({
      where: { id: postId },
      data: { status: 'approved' },
    });
  }

  async clientRejectPost(accessToken: string, postId: string, reason?: string) {
    const portal = await this.prisma.clientPortal.findUnique({
      where: { accessToken },
    });

    if (!portal || !portal.isActive) {
      throw new NotFoundException('Portal not found');
    }

    const permissions = portal.permissions as Record<string, boolean>;
    if (!permissions.approvePosts) {
      throw new ForbiddenException('Approval permission not granted');
    }

    const post = await this.prisma.post.findFirst({
      where: { id: postId, teamId: portal.clientTeamId, deletedAt: null },
    });

    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.post.update({
      where: { id: postId },
      data: { status: 'rejected', rejectionReason: reason },
    });
  }

  async bulkOnboard(agencyTeamId: string, clients: BulkOnboardClientDto[]) {
    if (clients.length === 0) {
      throw new BadRequestException('At least one client is required');
    }

    if (clients.length > 50) {
      throw new BadRequestException('Maximum 50 clients per batch');
    }

    const job = await this.prisma.bulkOnboardJob.create({
      data: {
        agencyTeamId,
        status: 'processing',
        totalClients: clients.length,
        csvData: clients as any,
      },
    });

    // Process in background
    this.processBulkOnboard(job.id, agencyTeamId, clients).catch(err => {
      this.logger.error(`Bulk onboard job ${job.id} failed`, err);
    });

    return { jobId: job.id, totalClients: clients.length };
  }

  async getBulkOnboardStatus(agencyTeamId: string, jobId: string) {
    const job = await this.prisma.bulkOnboardJob.findFirst({
      where: { id: jobId, agencyTeamId },
    });

    if (!job) throw new NotFoundException('Job not found');

    return {
      id: job.id,
      status: job.status,
      totalClients: job.totalClients,
      processedClients: job.processedClients,
      failedClients: job.failedClients,
      results: job.results,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    };
  }

  private async processBulkOnboard(
    jobId: string,
    agencyTeamId: string,
    clients: BulkOnboardClientDto[],
  ) {
    const results: Array<{ clientName: string; status: string; portalLink?: string; error?: string }> = [];
    let processed = 0;
    let failed = 0;

    for (const client of clients) {
      try {
        const portal = await this.createClientPortal(agencyTeamId, {
          clientName: client.clientName,
          clientEmail: client.clientEmail,
        });

        results.push({
          clientName: client.clientName,
          status: 'success',
          portalLink: this.buildPreviewLink(portal.accessToken),
        });
        processed++;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.push({ clientName: client.clientName, status: 'failed', error: message });
        failed++;
      }

      // Update progress
      await this.prisma.bulkOnboardJob.update({
        where: { id: jobId },
        data: { processedClients: processed + failed, failedClients: failed, results: results as any },
      });
    }

    await this.prisma.bulkOnboardJob.update({
      where: { id: jobId },
      data: {
        status: failed === clients.length ? 'failed' : 'completed',
        completedAt: new Date(),
      },
    });
  }

  async deactivatePortal(agencyTeamId: string, portalId: string) {
    return this.prisma.clientPortal.updateMany({
      where: { id: portalId, agencyTeamId },
      data: { isActive: false },
    });
  }

  private generateAccessToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private buildPreviewLink(token: string): string {
    const baseUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    return `${baseUrl}/portal/${token}`;
  }
}
