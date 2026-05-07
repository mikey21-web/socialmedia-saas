import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import axios from "axios";

interface PlatformMetricsResult {
  platform: string;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
}
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  constructor(private readonly prisma: PrismaService) {}
  async fetchMetricsForPost(postId: string, platform: string, platformPostId: string, accessToken?: string): Promise<PlatformMetricsResult> {
    try {
      switch (platform) {
        case "instagram": return await this.fetchInstagramMetrics(platformPostId, accessToken);
        case "x": case "twitter": return await this.fetchTwitterMetrics(platformPostId, accessToken);
        case "linkedin": return await this.fetchLinkedInMetrics(platformPostId, accessToken);
        case "facebook": return await this.fetchFacebookMetrics(platformPostId, accessToken);
        case "tiktok": return await this.fetchTikTokMetrics(platformPostId, accessToken);
        case "youtube": return await this.fetchYouTubeMetrics(platformPostId, accessToken);
        default: this.logger.warn(`Unsupported platform: ${platform}`);
          return { platform, reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0 };
      }
    } catch (error) {
      this.logger.error(`Failed to fetch metrics for ${platform}:`, error);
      return { platform, reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0 };
    }
  }
  private async fetchInstagramMetrics(postId: string, accessToken?: string): Promise<PlatformMetricsResult> {
    if (!accessToken) return this.getDefaultMetrics("instagram");
    try {
      const response = await axios.get(`https://graph.instagram.com/v18.0/${postId}/insights`, {
        params: { metric: "reach,impressions,likes,comments,saves,shares", access_token: accessToken },
      });
      const data = response.data?.data || [];
      const metrics: PlatformMetricsResult = this.getDefaultMetrics("instagram");
      for (const item of data) {
        const value = item.values?.[0]?.value || 0;
        if (item.name === "reach") metrics.reach = value;
        else if (item.name === "impressions") metrics.impressions = value;
        else if (item.name === "likes") metrics.likes = value;
        else if (item.name === "comments") metrics.comments = value;
        else if (item.name === "shares") metrics.shares = value;
      }
      return metrics;
    } catch (error) { this.logger.warn(`Instagram metrics fetch failed:`, error); return this.getDefaultMetrics("instagram"); }
  }
  private async fetchTwitterMetrics(tweetId: string, accessToken?: string): Promise<PlatformMetricsResult> {
    if (!accessToken) return this.getDefaultMetrics("x");
    try {
      const response = await axios.get(`https://api.twitter.com/2/tweets/${tweetId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }, params: { "tweet.fields": "public_metrics" },
      });
      const pm = response.data?.data?.public_metrics;
      if (pm) return { platform: "x", reach: 0, impressions: 0, likes: pm.like_count || 0, comments: pm.reply_count || 0, shares: (pm.retweet_count || 0) + (pm.quote_count || 0) };
      return this.getDefaultMetrics("x");
    } catch (error) { this.logger.warn(`Twitter metrics fetch failed:`, error); return this.getDefaultMetrics("x"); }
  }
  private async fetchLinkedInMetrics(shareUrn: string, accessToken?: string): Promise<PlatformMetricsResult> {
    if (!accessToken) return this.getDefaultMetrics("linkedin");
    try {
      const response = await axios.get(`https://api.linkedin.com/v2/shares?q=owners&owners=${shareUrn}&fields=engagement`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const e = response.data?.elements?.[0]?.totalShares || {};
      return { platform: "linkedin", reach: e.firstShareCount || 0, impressions: e.totalShares || 0, likes: e.likes || 0, comments: e.comments || 0, shares: e.sharedBy || 0 };
    } catch (error) { this.logger.warn(`LinkedIn metrics fetch failed:`, error); return this.getDefaultMetrics("linkedin"); }
  }
  private async fetchFacebookMetrics(postId: string, accessToken?: string): Promise<PlatformMetricsResult> {
    if (!accessToken) return this.getDefaultMetrics("facebook");
    try {
      const response = await axios.get(`https://graph.facebook.com/v18.0/${postId}`, {
        params: { fields: "engagement,reach,insights.metric(reach,impressions)", access_token: accessToken },
      });
      const eng = response.data?.engagement || {};
      const ins = response.data?.insights?.data?.[0]?.values?.[0]?.value || {};
      return { platform: "facebook", reach: ins.reach || eng?.reach || 0, impressions: ins.impressions || eng?.impressions || 0, likes: eng?.like_count || 0, comments: eng?.comment_count || 0, shares: eng?.share_count || 0 };
    } catch (error) { this.logger.warn(`Facebook metrics fetch failed:`, error); return this.getDefaultMetrics("facebook"); }
  }
  private async fetchTikTokMetrics(videoId: string, accessToken?: string): Promise<PlatformMetricsResult> {
    if (!accessToken) return this.getDefaultMetrics("tiktok");
    try {
      const response = await axios.get(`https://open.tiktokapis.com/v2/video/query/`, {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        data: { video_ids: [videoId], fields: ["video_description", "like_count", "comment_count", "share_count", "view_count"] },
      });
      const v = response.data?.data?.videos?.[0] || {};
      return { platform: "tiktok", reach: v.view_count || 0, impressions: v.view_count || 0, likes: v.like_count || 0, comments: v.comment_count || 0, shares: v.share_count || 0 };
    } catch (error) { this.logger.warn(`TikTok metrics fetch failed:`, error); return this.getDefaultMetrics("tiktok"); }
  }
  private async fetchYouTubeMetrics(videoId: string, accessToken?: string): Promise<PlatformMetricsResult> {
    if (!accessToken) return this.getDefaultMetrics("youtube");
    try {
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
        params: { id: videoId, part: "statistics", key: accessToken },
      });
      const stats = response.data?.items?.[0]?.statistics || {};
      return { platform: "youtube", reach: parseInt(stats.viewCount || "0"), impressions: parseInt(stats.viewCount || "0"), likes: parseInt(stats.likeCount || "0"), comments: parseInt(stats.commentCount || "0"), shares: 0 };
    } catch (error) { this.logger.warn(`YouTube metrics fetch failed:`, error); return this.getDefaultMetrics("youtube"); }
  }
  async updatePostMetrics(postId: string): Promise<void> {
    const postPlatforms = await this.prisma.postPlatform.findMany({
      where: { postId }, select: { platform: true, platformPostId: true, post: { select: { teamId: true } } },
    });
    const teamId = postPlatforms[0]?.post?.teamId;
    if (!teamId) return;
    const credentials = await this.prisma.platformCredential.findMany({ where: { teamId }, select: { platform: true, accessToken: true } });
    const credMap = new Map(credentials.map(c => [c.platform, c.accessToken]));
    for (const pp of postPlatforms) {
      const token = credMap.get(pp.platform);
      const metrics = await this.fetchMetricsForPost(postId, pp.platform, pp.platformPostId || "", token);
      await this.prisma.platformMetrics.upsert({
        where: { postId_platform: { postId, platform: pp.platform } },
        create: { postId, platform: pp.platform, reach: metrics.reach, impressions: metrics.impressions, likes: metrics.likes, comments: metrics.comments, shares: metrics.shares },
        update: { reach: metrics.reach, impressions: metrics.impressions, likes: metrics.likes, comments: metrics.comments, shares: metrics.shares, collectedAt: new Date() },
      });
    }
    const totals = await this.prisma.platformMetrics.aggregate({ where: { postId }, _sum: { reach: true, impressions: true, likes: true, comments: true, shares: true } });
    await this.prisma.post.update({ where: { id: postId }, data: { reach: totals._sum.reach || 0, impressions: totals._sum.impressions || 0, metricsUpdatedAt: new Date() } });
  }
  async refreshAllPostMetrics(teamId: string): Promise<{ updated: number; failed: number }> {
    const posts = await this.prisma.post.findMany({ where: { teamId, status: "published", deletedAt: null }, select: { id: true } });
    let updated = 0, failed = 0;
    for (const post of posts) {
      try { await this.updatePostMetrics(post.id); updated++; } catch (error) { this.logger.error(`Failed to update metrics for post ${post.id}:`, error); failed++; }
    }
    return { updated, failed };
  }
  private getDefaultMetrics(platform: string): PlatformMetricsResult { return { platform, reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0 }; }
}